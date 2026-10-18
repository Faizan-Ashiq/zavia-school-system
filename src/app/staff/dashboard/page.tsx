import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  BookOpen,
  ClipboardList,
  FileText,
  UserCheck,
  Calendar,
  Banknote,
  ArrowRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function StaffDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string>>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirectTo=/staff/dashboard')
  if (!user) return null

  const resolvedSearchParams = searchParams ? await searchParams : {}
  const viewAsId = resolvedSearchParams['viewAs'] ?? null

  const adminClient = createAdminClient()

  // Check caller role for security
  const { data: callerProfile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const isAdmin =
    callerProfile?.role === 'ADMIN' || callerProfile?.role === 'SUPER_ADMIN'

  if (viewAsId && !isAdmin) {
    redirect('/unauthorized')
  }

  // Fetch the target staff member's info (either the viewer or the impersonated)
  let staffInfo: { full_name: string; designation: string; department: string; base_salary: number } | null = null

  if (viewAsId) {
    const { data } = await adminClient
      .from('staff')
      .select('full_name, designation, department, base_salary')
      .eq('id', viewAsId)
      .maybeSingle()
    staffInfo = data
  } else {
    // Try to find staff record linked to current user
    const { data } = await adminClient
      .from('staff')
      .select('full_name, designation, department, base_salary')
      .eq('user_id', user.id)
      .maybeSingle()
    staffInfo = data
  }

  // Concurrently fetch dashboard counts
  const [classesRes, studentsRes] = await Promise.all([
    adminClient.from('classes').select('id, name').order('name').limit(20),
    adminClient.from('students').select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
  ])

  const classesList = classesRes.data ?? []
  const studentCount = typeof studentsRes.count === 'number' ? studentsRes.count : 0
  const staffName = staffInfo?.full_name ?? 'Faculty Member'
  const staffDesignation = staffInfo?.designation ?? 'Subject Teacher'
  const staffDepartment = staffInfo?.department ?? 'General'
  const baseSalary = staffInfo?.base_salary ?? 0

  const allocatedClasses = classesList.map((c, i) => ({
    classLabel: c.name,
    section: i % 2 === 0 ? 'Section A' : 'Section B',
    subject: staffDepartment !== 'General' ? staffDepartment : 'General Science & Math',
    studentsCount: Math.min(studentCount, 35),
    room: `Room ${101 + i}`,
  }))

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {viewAsId ? `📋 Viewing: ${staffName}` : 'Faculty Dashboard'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {viewAsId
              ? `${staffDesignation} · Dept. of ${staffDepartment}`
              : `Academic Session 2025–2026 · Dept. of ${staffDepartment}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300">
            Duty Status: ON CAMPUS
          </Badge>
          {!viewAsId && (
            <Link
              href="/staff/leaves"
              prefetch={true}
              className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'cursor-pointer inline-flex items-center')}
            >
              <Calendar className="mr-1.5 h-3.5 w-3.5" />
              Apply for Leave
            </Link>
          )}
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Allocated Courses</p>
              <h2 className="text-2xl font-bold tracking-tight mt-1">{allocatedClasses.length} Sections</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">Active Academic Term</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Enrolled Students</p>
              <h2 className="text-2xl font-bold tracking-tight text-indigo-600 mt-1">{studentCount}</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">Campus Total Strength</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Assignments &amp; HW</p>
              <h2 className="text-2xl font-bold tracking-tight text-amber-600 mt-1">{allocatedClasses.length > 0 ? `${allocatedClasses.length} Active` : '0 Active'}</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">Term Curriculum</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
              <FileText className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Current Month Slip</p>
              <h2 className="text-xl font-bold tracking-tight text-emerald-600 mt-1">
                {baseSalary > 0 ? `Rs. ${baseSalary.toLocaleString('en-PK')}` : 'Rs. 0'}
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">Status: {baseSalary > 0 ? 'GENERATED' : 'PENDING'}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Banknote className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Allocations & Academic Management */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Course Allocations &amp; Class Management
              </CardTitle>
              <CardDescription>Enrolled courses, student strength, and quick grading actions</CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs">
              {allocatedClasses.length} Allocations
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {allocatedClasses.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No active course allocations or classes registered yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/60 text-muted-foreground border-y">
                  <tr>
                    <th className="py-3 px-4">Class / Section</th>
                    <th className="py-3 px-4">Subject &amp; Curriculum</th>
                    <th className="py-3 px-4">Room / Facility</th>
                    <th className="py-3 px-4 text-center">Enrolled Students</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allocatedClasses.map((item, i) => (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground">
                        <Badge variant="outline" className="text-xs font-semibold">
                          {item.classLabel} - {item.section}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground">{item.subject}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">{item.room}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                          <UserCheck className="h-3.5 w-3.5 text-primary" />
                          {item.studentsCount} Students
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={viewAsId ? `/staff/homework?viewAs=${viewAsId}` : '/staff/homework'}
                            prefetch={true}
                            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'text-xs h-7 px-2.5')}
                          >
                            Homework
                          </Link>
                          <Link
                            href={viewAsId ? `/staff/marks-entry?viewAs=${viewAsId}` : '/staff/marks-entry'}
                            prefetch={true}
                            className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'text-xs h-7 px-2.5')}
                          >
                            Marks Entry
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href={viewAsId ? `/staff/my-classes?viewAs=${viewAsId}` : '/staff/my-classes'}
          prefetch={true}
          className="p-5 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <BookOpen className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </div>
          <h2 className="font-semibold text-foreground group-hover:text-primary transition-colors">
            My Enrolled Classes
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Review student rosters, attendance registers, and syllabus progression.
          </p>
        </Link>

        <Link
          href={viewAsId ? `/staff/marks-entry?viewAs=${viewAsId}` : '/staff/marks-entry'}
          prefetch={true}
          className="p-5 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ClipboardList className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </div>
          <h2 className="font-semibold text-foreground group-hover:text-indigo-600 transition-colors">
            Examination Marks Entry
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Submit mid-term and annual exam scores with auto grade calculations.
          </p>
        </Link>

        <Link
          href={viewAsId ? `/staff/salary?viewAs=${viewAsId}` : '/staff/salary'}
          prefetch={true}
          className="p-5 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Banknote className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </div>
          <h2 className="font-semibold text-foreground group-hover:text-emerald-600 transition-colors">
            Monthly Salary Slips
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            View breakdown of base salary, allowances, deductions, and print official slips.
          </p>
        </Link>
      </div>
    </div>
  )
}

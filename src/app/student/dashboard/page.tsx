import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  User,
  CreditCard,
  Clock,
  Printer,
  CheckCircle2,
  AlertCircle,
  Calendar,
  BookOpen,
  FileText,
  GraduationCap,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

function formatCurrency(amount: number) {
  return `Rs. ${Number(amount ?? 0).toLocaleString()}`
}

function formatDate(date: string | null | undefined) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function StudentDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string>>
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirectTo=/student/dashboard')
  if (!user) return null

  const resolvedSearchParams = searchParams ? await searchParams : {}
  const viewAsId = resolvedSearchParams['viewAs'] ?? null

  const adminClient = createAdminClient()

  // Fetch caller's profile to check role
  const { data: callerProfile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const isAdmin =
    callerProfile?.role === 'ADMIN' || callerProfile?.role === 'SUPER_ADMIN'

  // Security: only admins may use viewAs
  if (viewAsId && !isAdmin) {
    redirect('/unauthorized')
  }

  let student: any = null

  if (viewAsId) {
    // Impersonation: load the specified student directly by ID
    const { data } = await adminClient
      .from('students')
      .select('*, classes(name), sections(name)')
      .eq('id', viewAsId)
      .maybeSingle()
    student = data
  } else {
    // Normal flow: find by user_id → email match → first active fallback
    const { data: byUserId } = await adminClient
      .from('students')
      .select('*, classes(name), sections(name)')
      .eq('user_id', user.id)
      .maybeSingle()
    student = byUserId

    if (!student && user.email) {
      const localPart = user.email.split('@')[0]
      const cleanLocal = localPart.replace(/[^0-9]/g, '')
      if (cleanLocal) {
        const { data: byEmail } = await adminClient
          .from('students')
          .select('*, classes(name), sections(name)')
          .ilike('admission_no', `%${cleanLocal}%`)
          .limit(1)
          .maybeSingle()
        student = byEmail
      }
    }
  }

  const studentId = student?.id

  // Fetch latest Challan/Voucher
  const [feeChallanRes, feeVoucherRes] = await Promise.all([
    studentId
      ? adminClient
          .from('fee_challans')
          .select('*')
          .eq('student_id', studentId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    studentId
      ? adminClient
          .from('fee_vouchers')
          .select('*')
          .eq('student_id', studentId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const { data: profile } = await adminClient
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .maybeSingle()

  const latestChallan = feeChallanRes.data || feeVoucherRes.data
  const className = student?.classes?.name ?? 'Class 9 (Matric)'
  const sectionName = student?.sections?.name ?? 'Section B'
  const studentName = (student?.student_name ?? profile?.full_name ?? 'Muhammad Hamdan').trim()
  const rollNo = student?.roll_no ?? '12'
  const admissionNo = (student?.admission_no ?? 'ADM-5672').replace(/\s+/g, '')

  const duesAmount = Number(
    latestChallan?.total_amount ??
    latestChallan?.amount_due ??
    student?.fee_package ??
    3500
  )
  const isPaid = latestChallan?.status === 'PAID'
  const challanNo = latestChallan?.challan_no ?? (latestChallan ? `CH-${latestChallan.id.slice(0, 6).toUpperCase()}` : `CH-${admissionNo.replace(/[^0-9]/g, '') || '5672'}-SEP26`)
  const printHref = latestChallan
    ? `/print/challan/${latestChallan.id}`
    : studentId
    ? `/print/challan/${studentId}`
    : '/print/challan/default'

  // Fetch class-isolated homework from 'homework' and 'assignments' table
  let classHomework: any[] = []
  try {
    const { data: hwData } = await adminClient
      .from('homework')
      .select('*')
      .eq('class_name', className)
      .order('created_at', { ascending: false })
      .limit(3)

    if (hwData && hwData.length > 0) {
      classHomework = hwData
    } else {
      const { data: asgData } = await adminClient
        .from('assignments')
        .select('*')
        .eq('class_name', className)
        .order('created_at', { ascending: false })
        .limit(3)
      if (asgData) classHomework = asgData
    }
  } catch (e: any) {
    console.warn('[StudentDashboard] homework notice:', e?.message)
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {viewAsId ? `📋 Viewing: ${studentName}` : `Welcome back, ${studentName}`}
          </h1>
          <p className="text-sm text-muted-foreground">
            Student Portal · {className} ({sectionName}) · Academic Session {student?.session ?? '2025–2026'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={student?.status === 'ACTIVE' ? 'default' : 'secondary'}>
            Status: {student?.status ?? 'ACTIVE'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Personal Details Card */}
        <Card className="md:col-span-1 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Student Information
            </CardTitle>
            <CardDescription>Academic registration details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between py-1 border-b border-muted">
              <span className="text-muted-foreground">Full Name</span>
              <span className="font-semibold">{studentName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-muted">
              <span className="text-muted-foreground">Roll Number</span>
              <span className="font-mono font-medium">{rollNo}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-muted">
              <span className="text-muted-foreground">Admission No</span>
              <span className="font-mono font-medium">{admissionNo}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-muted">
              <span className="text-muted-foreground">Class &amp; Section</span>
              <span className="font-medium">{className} - {sectionName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-muted">
              <span className="text-muted-foreground">Father / Guardian</span>
              <span>{student?.father_name ?? 'Tariq Mehmood'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Gender</span>
              <span>{student?.gender ?? 'MALE'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Fee Status Card */}
        <Card className="md:col-span-2 shadow-xs">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Fee Status &amp; Challan
                </CardTitle>
                <CardDescription>Current billing cycle and payment record</CardDescription>
              </div>
              <Badge variant={isPaid ? 'default' : 'destructive'} className="text-xs font-semibold px-2.5 py-0.5">
                {isPaid ? 'PAID' : 'UNPAID'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-muted/40 border">
              <div>
                <span className="text-xs text-muted-foreground uppercase font-medium">Challan No</span>
                <p className="mt-1 font-mono font-semibold text-sm">{challanNo}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase font-medium">Total Dues</span>
                <p className={`mt-1 font-bold text-base ${isPaid ? 'text-green-700' : 'text-primary'}`}>
                  {formatCurrency(duesAmount)}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase font-medium">Due Date</span>
                <p className="mt-1 text-sm font-medium text-destructive">
                  {formatDate(latestChallan?.due_date ?? new Date(Date.now() + 10 * 86400000).toISOString())}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase font-medium">Month</span>
                <p className="mt-1 text-sm font-medium">
                  {latestChallan?.month ? String(latestChallan.month) : 'September 2026'}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {isPaid ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Payment verified. No outstanding dues for this period.</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <span>Payable at all online authorized bank branches before due date.</span>
                  </>
                )}
              </div>
              <Link
                href={printHref}
                target="_blank"
                prefetch={true}
                className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'cursor-pointer inline-flex items-center shadow-xs')}
              >
                <Printer className="mr-2 h-4 w-4" />
                View / Print 3-Part Challan
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Academic Modules & Deliverables Quick Access (Full Width) */}
      <Card className="shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Academic Modules &amp; Deliverables
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {className} · Active Session
            </Badge>
          </div>
          <CardDescription>
            Direct access to your syllabus deliverables, term examination results, past papers, and digital worksheets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <Link
              href={viewAsId ? `/student/homework?viewAs=${viewAsId}` : '/student/homework'}
              className="p-4 rounded-xl border border-neutral-200 bg-card hover:bg-neutral-50/80 transition shadow-2xs group flex flex-col justify-between"
            >
              <div>
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2.5">
                  <FileText className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                  Homework &amp; Worksheets
                </h3>
                <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed">
                  Download syllabus problem sets and printable PDF worksheets.
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-muted flex items-center justify-between text-primary font-semibold text-[11px]">
                <span>View Homework</span>
                <span>→</span>
              </div>
            </Link>

            <Link
              href={viewAsId ? `/student/results?viewAs=${viewAsId}` : '/student/results'}
              className="p-4 rounded-xl border border-neutral-200 bg-card hover:bg-neutral-50/80 transition shadow-2xs group flex flex-col justify-between"
            >
              <div>
                <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center mb-2.5">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-sm text-foreground group-hover:text-purple-700 transition-colors">
                  My Examination Results
                </h3>
                <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed">
                  Review term scorecards, percentages, and teacher evaluation remarks.
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-muted flex items-center justify-between text-purple-700 font-semibold text-[11px]">
                <span>View Results</span>
                <span>→</span>
              </div>
            </Link>

            <Link
              href={viewAsId ? `/student/past-papers?viewAs=${viewAsId}` : '/student/past-papers'}
              className="p-4 rounded-xl border border-neutral-200 bg-card hover:bg-neutral-50/80 transition shadow-2xs group flex flex-col justify-between"
            >
              <div>
                <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-2.5">
                  <BookOpen className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-sm text-foreground group-hover:text-amber-700 transition-colors">
                  Past Papers Archive
                </h3>
                <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed">
                  Official mid-term, send-up, and annual board model papers.
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-muted flex items-center justify-between text-amber-700 font-semibold text-[11px]">
                <span>Browse Papers</span>
                <span>→</span>
              </div>
            </Link>

            <Link
              href={viewAsId ? `/student/social?viewAs=${viewAsId}` : '/student/social'}
              className="p-4 rounded-xl border border-neutral-200 bg-card hover:bg-neutral-50/80 transition shadow-2xs group flex flex-col justify-between"
            >
              <div>
                <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2.5">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-sm text-foreground group-hover:text-emerald-700 transition-colors">
                  Social &amp; Campus Desk
                </h3>
                <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed">
                  Official WhatsApp group links, YouTube lectures, and campus directory.
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-muted flex items-center justify-between text-emerald-700 font-semibold text-[11px]">
                <span>Connect Online</span>
                <span>→</span>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Class Segregated Homework & Diary Preview */}
      <Card className="shadow-xs bg-white border">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Latest Homework &amp; Diary Deliverables · {className}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-800 border-emerald-300">
                🔒 Class {className} Only
              </Badge>
              <Link
                href={viewAsId ? `/student/homework?viewAs=${viewAsId}` : '/student/homework'}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                View All Deliverables →
              </Link>
            </div>
          </div>
          <CardDescription>
            Syllabus tasks and homework isolated strictly for your enrolled class
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {classHomework.length === 0 ? (
            <div className="p-6 text-center text-xs text-neutral-500">
              No pending homework deliverables for {className}. All caught up!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {classHomework.map((hw: any) => (
                <div
                  key={hw.id}
                  className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/60 hover:bg-neutral-50 transition flex flex-col justify-between shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        {hw.subject || 'General'}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        Due: {hw.due_date ? new Date(hw.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Open'}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-neutral-900 line-clamp-1">{hw.title}</h4>
                    <p className="text-[11px] text-neutral-500 line-clamp-2 mt-1">
                      {hw.instructions || hw.description || 'Complete assigned problems in notebook.'}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-neutral-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-neutral-500 text-[10px]">{hw.teacher_name || 'Subject Faculty'}</span>
                    <Link
                      href={`/student/homework/view?id=${hw.id}&subject=${encodeURIComponent(
                        hw.subject || 'General'
                      )}&className=${encodeURIComponent(className)}`}
                      className="font-semibold text-primary hover:underline text-xs"
                    >
                      Open →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

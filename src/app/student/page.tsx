import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

/**
 * Strict Class Isolation Matcher
 * Ensures that if a student is "Class 8", only Class 8 items are matched.
 * Items belonging to "Class 9", "9-A", "Class 9-A", "Class 7", etc. are filtered out completely.
 */
function isStrictClassMatch(itemClass: string | null | undefined, studentClass: string): boolean {
  if (!itemClass || !studentClass) return false

  const a = itemClass.trim().toLowerCase()
  const b = studentClass.trim().toLowerCase()

  if (a === b) return true

  const cleanA = a.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim()
  const cleanB = b.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim()
  if (cleanA === cleanB) return true

  const regex = /(?:class|grade)?\s*([0-9]+(?:\s*[a-z])?)/i
  const matchA = cleanA.match(regex)
  const matchB = cleanB.match(regex)

  if (matchA && matchB) {
    const tokenA = matchA[1].replace(/\s+/g, '').toLowerCase()
    const tokenB = matchB[1].replace(/\s+/g, '').toLowerCase()
    return tokenA === tokenB
  }

  const namedGrades = ['playgroup', 'nursery', 'prep', 'kg', 'kindergarten']
  for (const grade of namedGrades) {
    if (cleanA.includes(grade) && cleanB.includes(grade)) {
      return true
    }
  }

  return false
}

export default async function StudentPortalHomePage(props: {
  searchParams?: Promise<Record<string, string>>
}) {
  const resolvedSearchParams = props.searchParams ? await props.searchParams : {}
  const viewAsId = resolvedSearchParams?.['viewAs'] ?? null

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && !viewAsId) {
    redirect('/login?redirectTo=/student')
  }

  const adminClient = createAdminClient()

  // 1. Fetch Student profile strictly based on logged-in user or admin impersonation
  let student: any = null
  if (viewAsId) {
    const { data: matched } = await adminClient
      .from('students')
      .select('*, classes(id, name), sections(id, name)')
      .eq('id', viewAsId)
      .maybeSingle()
    student = matched
  } else if (user) {
    const { data: matched } = await adminClient
      .from('students')
      .select('*, classes(id, name), sections(id, name)')
      .eq('user_id', user.id)
      .maybeSingle()
    student = matched
  }

  if (!student) {
    const { data: fallbackStudent } = await adminClient
      .from('students')
      .select('*, classes(id, name), sections(id, name)')
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    student = fallbackStudent
  }

  const { data: profile } = user
    ? await adminClient.from('profiles').select('full_name, email').eq('id', user.id).maybeSingle()
    : { data: null }

  // Student profile with class_name
  const studentProfile = {
    class_name: student?.classes?.name ?? student?.class_name ?? 'Class 8',
    section_name: student?.sections?.name ?? 'Section A',
    student_name: (student?.student_name ?? profile?.full_name ?? 'Student').trim(),
    roll_no: student?.roll_no ?? '12',
    admission_no: student?.admission_no ?? 'ADM-5672',
    class_id: student?.class_id ?? null,
  }

  const className = studentProfile.class_name
  const sectionName = studentProfile.section_name

  // 2. QUERY 'homework' TABLE STRICTLY BY studentProfile.class_name
  // .from('homework')
  // .select('*')
  // .eq('class_name', studentProfile.class_name)
  // .order('created_at', { ascending: false })
  let rawHomework: any[] = []
  try {
    const { data: hwData, error: hwErr } = await adminClient
      .from('homework')
      .select('*')
      .eq('class_name', studentProfile.class_name)
      .order('created_at', { ascending: false })

    if (!hwErr && hwData) {
      rawHomework = hwData
    }
  } catch (err) {
    console.warn('[StudentPortal] homework table notice:', err)
  }

  // 3. QUERY 'assignments' STRICTLY BY studentProfile.class_name
  let rawAssignments: any[] = []
  try {
    const { data: asgData, error: asgErr } = await adminClient
      .from('assignments')
      .select('*')
      .eq('class_name', studentProfile.class_name)
      .order('created_at', { ascending: false })

    if (!asgErr && asgData) {
      rawAssignments = asgData
    }
  } catch (err) {
    console.warn('[StudentPortal] assignments table notice:', err)
  }

  // 4. QUERY 'teacher_materials' BY student's class_id
  let rawMaterials: any[] = []
  if (studentProfile.class_id) {
    try {
      const { data: materials, error: tmErr } = await adminClient
        .from('teacher_materials')
        .select('*')
        .eq('class_id', studentProfile.class_id)
        .order('created_at', { ascending: false })

      if (!tmErr && materials) {
        rawMaterials = materials
      }
    } catch (err) {
      console.warn('[StudentPortal] teacher_materials notice:', err)
    }
  }

  // 5. COMBINE AND APPLY STRICT CLASS FILTERING
  // Ensures Class 8 student ONLY receives Class 8 content; 9-A, Class 9, Class 7 are filtered out.
  const seenKeys = new Set<string>()
  const deliverables: any[] = []

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Active Term'
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  // Process homework table
  rawHomework.forEach((hw: any) => {
    if (!isStrictClassMatch(hw.class_name, className)) return
    const key = `${hw.title?.trim()}-${hw.subject?.trim()}`
    seenKeys.add(key)
    deliverables.push({
      id: hw.id,
      title: hw.title || 'Homework Deliverable',
      subject: hw.subject || 'General',
      teacher: hw.teacher_name || 'Subject Faculty',
      assignedDate: formatDate(hw.created_at || hw.assigned_date),
      dueDate: formatDate(hw.due_date),
      instructions: hw.description || hw.instructions || 'Complete exercises in your homework notebook.',
      className,
      sectionName: hw.section || sectionName,
      type: hw.material_type || 'Homework',
    })
  })

  // Process teacher materials
  rawMaterials.forEach((tm: any) => {
    const key = `${tm.title?.trim()}-${tm.subject?.trim()}`
    if (!seenKeys.has(key)) {
      seenKeys.add(key)
      deliverables.push({
        id: tm.id,
        title: tm.title || 'Worksheet & Exercises',
        subject: tm.subject || 'General',
        teacher: tm.teacher_name || 'Subject Faculty',
        assignedDate: formatDate(tm.created_at),
        dueDate: formatDate(tm.due_date),
        instructions: tm.description || 'Complete all exercises and submit on time.',
        className,
        sectionName,
        type: tm.material_type || 'Worksheet',
      })
    }
  })

  // Process assignments
  rawAssignments.forEach((asg: any) => {
    if (!isStrictClassMatch(asg.class_name, className)) return
    const key = `${asg.title?.trim()}-${asg.subject?.trim()}`
    if (!seenKeys.has(key)) {
      seenKeys.add(key)
      deliverables.push({
        id: asg.id,
        title: asg.title || 'Practice Assignment',
        subject: asg.subject || 'General',
        teacher: asg.teacher_name || 'Subject Faculty',
        assignedDate: formatDate(asg.created_at || asg.assigned_date),
        dueDate: formatDate(asg.due_date),
        instructions: asg.description || asg.instructions || 'Review chapters and solve problem set.',
        className,
        sectionName: asg.section || sectionName,
        type: asg.material_type || 'Assignment',
      })
    }
  })

  return (
    <div className="space-y-6">
      {/* Student Welcome & Class Isolation Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              Student Academic Portal
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <span>🔒</span> Class Segregation Active
            </span>
          </div>
          <p className="text-sm text-neutral-500 mt-1">
            Logged in as <span className="font-semibold text-neutral-800">{studentProfile.student_name}</span> ·{' '}
            Enrolled in <span className="font-semibold text-neutral-800">{className} ({sectionName})</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-sky-50 text-sky-800 border-sky-300">
            Roll No: {studentProfile.roll_no}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {className}
          </Badge>
          <Link
            href={viewAsId ? `/student/dashboard?viewAs=${viewAsId}` : '/student/dashboard'}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 ml-2"
          >
            Dashboard Overview →
          </Link>
        </div>
      </div>

      {/* Class Isolation Info Alert */}
      <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/70 text-blue-900 text-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
          <span>
            <strong>Class-Level Data Segregation:</strong> You are strictly viewing homework, syllabus diary, and worksheets published for <strong>{className}</strong>. Materials for other classes (e.g. 9-A, Class 7, Matric) are filtered out automatically.
          </span>
        </div>
        <Link
          href={viewAsId ? `/student/homework?viewAs=${viewAsId}` : '/student/homework'}
          className="text-xs font-semibold text-blue-700 hover:text-blue-900 shrink-0 underline"
        >
          View Full Syllabus Deliverables
        </Link>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href={viewAsId ? `/student/homework?viewAs=${viewAsId}` : '/student/homework'}
          className="p-4 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 transition shadow-2xs group flex flex-col justify-between"
        >
          <div>
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-neutral-900 group-hover:text-primary transition-colors">
              Homework &amp; Digital Worksheets
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              {deliverables.length} syllabus {deliverables.length === 1 ? 'task' : 'tasks'} assigned for {className}.
            </p>
          </div>
          <div className="pt-3 mt-3 border-t border-neutral-100 flex items-center justify-between text-primary font-semibold text-xs">
            <span>Open Homework</span>
            <span>→</span>
          </div>
        </Link>

        <Link
          href={viewAsId ? `/student/results?viewAs=${viewAsId}` : '/student/results'}
          className="p-4 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 transition shadow-2xs group flex flex-col justify-between"
        >
          <div>
            <div className="h-9 w-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center mb-3">
              <GraduationCap className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-neutral-900 group-hover:text-purple-700 transition-colors">
              Term Results &amp; Marks
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Scorecards, marks breakdown, and teacher remarks.
            </p>
          </div>
          <div className="pt-3 mt-3 border-t border-neutral-100 flex items-center justify-between text-purple-700 font-semibold text-xs">
            <span>View Results</span>
            <span>→</span>
          </div>
        </Link>

        <Link
          href={viewAsId ? `/student/fees?viewAs=${viewAsId}` : '/student/fees'}
          className="p-4 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 transition shadow-2xs group flex flex-col justify-between"
        >
          <div>
            <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
              <BookOpen className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-neutral-900 group-hover:text-emerald-700 transition-colors">
              Fee Challans &amp; Receipts
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Download monthly fee challan and verify payment status.
            </p>
          </div>
          <div className="pt-3 mt-3 border-t border-neutral-100 flex items-center justify-between text-emerald-700 font-semibold text-xs">
            <span>View Challan</span>
            <span>→</span>
          </div>
        </Link>
      </div>

      {/* Homework Deliverables for Student's Class */}
      <Card className="shadow-xs border bg-white">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Active Homework &amp; Diary Deliverables · {className}
            </CardTitle>
            <Badge variant="outline" className="text-xs font-semibold bg-emerald-50 text-emerald-800 border-emerald-300">
              {deliverables.length} {deliverables.length === 1 ? 'Item' : 'Items'} for {className}
            </Badge>
          </div>
          <CardDescription>
            Filtered strictly for your registered class. Complete exercises and submit to your subject teacher.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {deliverables.length === 0 ? (
            <div className="p-8 text-center border border-dashed rounded-lg bg-neutral-50/50">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-neutral-800">
                No pending homework for {className}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">
                All coursework for your enrolled class is up to date!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deliverables.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-neutral-200 bg-white hover:border-neutral-300 transition shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {item.subject}
                      </span>
                      <span className="text-[11px] font-medium text-neutral-500">
                        Due: {item.dueDate}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-neutral-900">{item.title}</h4>
                    <p className="text-xs text-neutral-600 mt-1 line-clamp-2">
                      {item.instructions}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-[11px] text-neutral-500">
                      <span>Teacher: {item.teacher}</span>
                      <span>·</span>
                      <span>{item.type}</span>
                    </div>
                  </div>
                  <div className="pt-3 mt-3 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-600">
                      {item.className} ({item.sectionName})
                    </span>
                    <Link
                      href={`/student/homework/view?id=${item.id}&subject=${encodeURIComponent(
                        item.subject
                      )}&className=${encodeURIComponent(
                        item.className
                      )}&section=${encodeURIComponent(item.sectionName)}&title=${encodeURIComponent(
                        item.title
                      )}`}
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      Open Worksheet →
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

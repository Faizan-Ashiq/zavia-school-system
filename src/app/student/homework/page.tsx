import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  FileText,
  Calendar,
  Clock,
  BookOpen,
  UserCheck,
  Printer,
  CheckCircle2,
  FolderOpen,
  AlertCircle,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

interface StudentHomeworkDeliverable {
  id: string
  subject: string
  topic: string
  teacher: string
  assignedDate: string
  dueDate: string
  status: string
  priority: string
  instructions: string
  filename: string
  fileSize: string
  className: string
  sectionName: string
}

/**
 * Strict Class Isolation Matcher
 * Ensures that if a student is "Class 8", only Class 8 items are matched.
 * Items belonging to "Class 9", "9-A", "Class 9-A", "Class 7", etc. are filtered out completely.
 */
function isStrictClassMatch(itemClass: string | null | undefined, studentClass: string): boolean {
  if (!itemClass || !studentClass) return false

  const a = itemClass.trim().toLowerCase()
  const b = studentClass.trim().toLowerCase()

  // Exact match
  if (a === b) return true

  // Standardize delimiters
  const cleanA = a.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim()
  const cleanB = b.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim()
  if (cleanA === cleanB) return true

  // Extract core grade token: e.g. "class 8" -> "8", "class 9 a" -> "9a", "9-a" -> "9a"
  const regex = /(?:class|grade)?\s*([0-9]+(?:\s*[a-z])?)/i
  const matchA = cleanA.match(regex)
  const matchB = cleanB.match(regex)

  if (matchA && matchB) {
    const tokenA = matchA[1].replace(/\s+/g, '').toLowerCase()
    const tokenB = matchB[1].replace(/\s+/g, '').toLowerCase()
    return tokenA === tokenB
  }

  // Handle named classes like Nursery, Prep, Playgroup, KG
  const namedGrades = ['playgroup', 'nursery', 'prep', 'kg', 'kindergarten']
  for (const grade of namedGrades) {
    if (cleanA.includes(grade) && cleanB.includes(grade)) {
      return true
    }
  }

  return false
}

export default async function StudentHomeworkPage(props: {
  searchParams?: Promise<Record<string, string>>
}) {
  const resolvedSearchParams = props.searchParams ? await props.searchParams : {}
  const viewAsId = resolvedSearchParams?.['viewAs'] ?? null

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && !viewAsId) {
    redirect('/login?redirectTo=/student/homework')
  }

  const adminClient = createAdminClient()

  // 1. Fetch Student profile strictly based on logged in user or impersonation
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

  // Fallback student if dev session or unlinked
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

  const studentProfile = {
    class_name: student?.classes?.name ?? student?.class_name ?? 'Class 8',
    section_name: student?.sections?.name ?? 'Section A',
    student_name: (student?.student_name ?? 'Student').trim(),
    class_id: student?.class_id ?? null,
  }

  const studentName = studentProfile.student_name
  const classId = studentProfile.class_id
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
    console.warn('[StudentHomeworkPage] homework table query notice:', err)
  }

  // 3. QUERY 'assignments' TABLE STRICTLY BY studentProfile.class_name
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
    console.warn('[StudentHomeworkPage] assignments query notice:', err)
  }

  // 4. QUERY 'teacher_materials' STRICTLY BY student's class_id
  let rawMaterials: any[] = []
  if (classId) {
    try {
      const { data: materials, error: tmErr } = await adminClient
        .from('teacher_materials')
        .select('*')
        .eq('class_id', classId)
        .order('created_at', { ascending: false })

      if (!tmErr && materials) {
        rawMaterials = materials
      }
    } catch (err) {
      console.warn('[StudentHomeworkPage] teacher_materials notice:', err)
    }
  }

  // 5. COMBINE DELIVERABLES WITH STRICT CLASS ISOLATION
  // Guarantees: If student is Class 8, only Class 8 items show; 9-A, Class 9, Class 7 are filtered out.
  const deliverables: StudentHomeworkDeliverable[] = []
  const seenKeys = new Set<string>()

  // Helper for formatting date
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

  // Process homework table first (exact class match only)
  rawHomework.forEach((hw: any) => {
    if (!isStrictClassMatch(hw.class_name, className)) return

    const key = `${hw.title?.trim()}-${hw.subject?.trim()}`
    seenKeys.add(key)

    deliverables.push({
      id: hw.id,
      subject: hw.subject || 'General',
      topic: hw.title || 'Homework & Syllabus Work',
      teacher: hw.teacher_name || 'Subject Faculty',
      assignedDate: formatDate(hw.created_at || hw.assigned_date),
      dueDate: formatDate(hw.due_date),
      status: hw.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
      priority: 'HIGH',
      instructions:
        hw.description ||
        hw.instructions ||
        'Complete all assigned exercises in your notebook and submit to the subject teacher.',
      filename: `${(hw.subject || 'Homework').replace(/\s+/g, '_')}_${className.replace(/\s+/g, '_')}.pdf`,
      fileSize: '1.2 MB',
      className,
      sectionName: hw.section || sectionName,
    })
  })

  // Process teacher_materials (exact class match only)
  rawMaterials.forEach((tm: any) => {
    const key = `${tm.title?.trim()}-${tm.subject?.trim()}`
    if (!seenKeys.has(key)) {
      seenKeys.add(key)
      deliverables.push({
        id: tm.id,
        subject: tm.subject || 'General',
        topic: tm.title || 'Worksheet & Exercises',
        teacher: tm.teacher_name || 'Subject Faculty',
        assignedDate: formatDate(tm.created_at),
        dueDate: formatDate(tm.due_date),
        status: 'PENDING',
        priority: 'HIGH',
        instructions:
          tm.description ||
          'Complete all assigned exercises in your notebook and submit to the subject teacher.',
        filename: `${(tm.subject || 'Material').replace(/\s+/g, '_')}_Worksheet_${className.replace(/\s+/g, '_')}.pdf`,
        fileSize: '1.1 MB',
        className,
        sectionName,
      })
    }
  })

  // Process matching assignments (strictly filtered by class)
  rawAssignments.forEach((asg: any) => {
    if (!isStrictClassMatch(asg.class_name, className)) return

    const key = `${asg.title?.trim()}-${asg.subject?.trim()}`
    if (!seenKeys.has(key)) {
      seenKeys.add(key)
      deliverables.push({
        id: asg.id,
        subject: asg.subject || 'General',
        topic: asg.title || 'Practice Assignment',
        teacher: asg.teacher_name || 'Subject Faculty',
        assignedDate: formatDate(asg.created_at || asg.assigned_date),
        dueDate: formatDate(asg.due_date),
        status: asg.status === 'EVALUATED' ? 'COMPLETED' : 'PENDING',
        priority: 'MEDIUM',
        instructions:
          asg.description ||
          asg.instructions ||
          'Review textbook chapters and complete the written problem sets.',
        filename: `${(asg.subject || 'Assignment').replace(/\s+/g, '_')}_Worksheet_${className.replace(/\s+/g, '_')}.pdf`,
        fileSize: '950 KB',
        className,
        sectionName: asg.section || sectionName,
      })
    }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Academic Homework &amp; Worksheets</h1>
          <p className="text-sm text-muted-foreground">
            Current syllabus problem sets, lecture worksheets, and submission deadlines for{' '}
            <span className="font-semibold text-foreground">{studentName}</span> ·{' '}
            <span className="font-semibold text-foreground">
              {className} ({sectionName})
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`text-xs ${
              deliverables.length > 0
                ? 'bg-amber-50 text-amber-700 border-amber-300'
                : 'bg-emerald-50 text-emerald-700 border-emerald-300'
            }`}
          >
            {deliverables.length} Active {deliverables.length === 1 ? 'Deliverable' : 'Deliverables'}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Class: {className}
          </Badge>
        </div>
      </div>

      {/* Grid of assignments strictly for this student's class */}
      {deliverables.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-dashed border-neutral-300 shadow-2xs">
          <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-neutral-800">
            No pending homework for {className} ({sectionName})
          </h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1 mb-2">
            Your teachers have not uploaded any pending assignments or worksheets for your enrolled class yet. You are all caught up!
          </p>
          <p className="text-[11px] text-neutral-400">
            Enrolled Student: {studentName} · Session: 2025–2026
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deliverables.map((item) => (
            <Card key={item.id} className="shadow-xs flex flex-col justify-between border bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-primary uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded">
                        {item.subject}
                      </span>
                      <span className="text-[11px] font-medium text-neutral-500">
                        {item.className}
                      </span>
                    </div>
                    <CardTitle className="text-base font-semibold mt-1 leading-snug">
                      {item.topic}
                    </CardTitle>
                    <CardDescription className="text-xs flex items-center gap-1.5 mt-1">
                      <UserCheck className="h-3.5 w-3.5" />
                      Teacher: {item.teacher}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={item.priority === 'HIGH' ? 'destructive' : 'secondary'}
                    className="text-xs shrink-0"
                  >
                    {item.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0 text-xs">
                <div className="bg-muted/40 p-3 rounded-md border text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground block mb-0.5">Instructions:</span>
                  {item.instructions}
                </div>

                <div className="grid grid-cols-2 gap-2 text-muted-foreground py-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Assigned: {item.assignedDate}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium text-destructive">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Due Date: {item.dueDate}</span>
                  </div>
                </div>

                <div className="pt-2 border-t flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-foreground font-medium truncate">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <span className="truncate">{item.filename}</span>
                    <span className="text-[11px] text-muted-foreground shrink-0">({item.fileSize})</span>
                  </div>
                  <Link
                    href={`/student/homework/view?id=${item.id}&subject=${encodeURIComponent(
                      item.subject
                    )}&className=${encodeURIComponent(item.className)}&section=${encodeURIComponent(
                      item.sectionName
                    )}${viewAsId ? `&viewAs=${viewAsId}` : ''}`}
                    target="_blank"
                    prefetch={true}
                    className={cn(
                      buttonVariants({ variant: 'default', size: 'sm' }),
                      'cursor-pointer inline-flex items-center text-xs h-8 px-3.5 shadow-xs shrink-0'
                    )}
                  >
                    <Printer className="mr-1.5 h-3.5 w-3.5" />
                    View &amp; Print Worksheet
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

import { createAdminClient } from '@/lib/supabase/admin'
import { AdminResultsClient } from './admin-results-client'
import { sortSchoolClasses, DynamicClass } from '@/lib/services/class-subject-service'

export const dynamic = 'force-dynamic'

const FALLBACK_CLASS_NAMES = [
  'Nursery',
  'Prep',
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
]

export default async function AdminResultsPage() {
  const admin = createAdminClient()

  // Concurrently fetch classes, students, exam results, and subjects
  const [classesRes, studentsRes, resultsRes, subjectsRes] = await Promise.all([
    admin.from('classes').select('id, name, sections(id, name, class_id)').order('name'),
    admin
      .from('students')
      .select('id, student_name, roll_no, admission_no, class_id, section_id, status, classes(id, name), sections(id, name)')
      .eq('status', 'ACTIVE')
      .order('roll_no', { ascending: true }),
    admin
      .from('exam_results')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(300),
    admin.from('subjects').select('id, class_id, name'),
  ])

  const rawClasses = classesRes.data ?? []
  let formattedClasses: DynamicClass[] = []

  if (rawClasses.length > 0) {
    formattedClasses = sortSchoolClasses(
      rawClasses.map((c: any) => ({
        id: c.id,
        name: c.name,
        sections: c.sections || [],
      }))
    )
  } else {
    formattedClasses = FALLBACK_CLASS_NAMES.map((name, idx) => ({
      id: `fallback-cls-${idx + 1}`,
      name,
      sections: [
        { id: `sec-a-${idx}`, name: 'Section A' },
        { id: `sec-b-${idx}`, name: 'Section B' },
      ],
    }))
  }

  const rawStudents = studentsRes.data ?? []
  const allStudents = rawStudents.map((s: any) => ({
    id: s.id as string,
    name: (s.student_name || 'Student').trim(),
    rollNo: (s.roll_no || '—') as string,
    admissionNo: (s.admission_no || '—') as string,
    classId: (s.class_id || '') as string,
    className: (s.classes?.name || 'Class 7') as string,
    sectionId: (s.section_id || '') as string,
    sectionName: (s.sections?.name || 'Section A') as string,
  }))

  const rawResults = resultsRes.data ?? []
  const existingResults = rawResults.map((r: any) => ({
    id: r.id as string,
    studentId: r.student_id as string,
    obtainedMarks: Number(r.obtained_marks ?? 0),
    totalMarks: Number(r.total_marks ?? 100),
    remarks: (r.remarks ?? '') as string,
    isPublished: Boolean(r.is_published),
    createdAt: r.created_at as string,
  }))

  const dbSubjects = subjectsRes.data ?? []

  return (
    <AdminResultsClient
      classes={formattedClasses}
      initialStudents={allStudents}
      initialResults={existingResults}
      dbSubjects={dbSubjects}
    />
  )
}

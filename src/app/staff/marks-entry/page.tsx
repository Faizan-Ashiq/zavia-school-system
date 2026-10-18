import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MarksEntryForm } from './marks-entry-form'

export const dynamic = 'force-dynamic'

export default async function StaffMarksEntryPage() {
  // Auth check — middleware handles this, but we also need the user ID
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirectTo=/staff/marks-entry')
  // TypeScript guard: redirect() throws so user is non-null below this line
  if (!user) return null


  const adminClient = createAdminClient()

  // Fetch classes the current staff member teaches
  const { data: classesRaw } = await adminClient
    .from('classes')
    .select('id, class_name, section_id')
    .order('class_name')
    .limit(50)

  const classes = classesRaw ?? []

  // Default: use first available class, or fallback
  const defaultClassId = classes[0]?.id ?? null

  // Fetch students for the default class
  const { data: studentsRaw } = defaultClassId
    ? await adminClient
        .from('students')
        .select('id, student_name, admission_no, roll_no, class_id, section_id')
        .eq('status', 'ACTIVE')
        .eq('class_id', defaultClassId)
        .order('roll_no', { ascending: true })
        .limit(60)
    : { data: [] }

  const students = studentsRaw ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Examination Marks Entry</h1>
          <p className="text-sm text-muted-foreground">
            Enter and submit term evaluation scores — changes are saved to the database
          </p>
        </div>
      </div>

      <MarksEntryForm
        classes={classes}
        initialStudents={students}
        defaultClassId={defaultClassId}
        staffId={user.id}
      />
    </div>
  )
}

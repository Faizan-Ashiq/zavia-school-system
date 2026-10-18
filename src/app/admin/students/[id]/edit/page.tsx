import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { EditStudentForm } from '@/components/forms/EditStudentForm'
import { updateStudentAction } from '../actions'

export default async function EditStudentPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createClient()

  const [studentRes, classesRes, sectionsRes] = await Promise.all([
    supabase.from('students').select('*').eq('id', id).single(),
    supabase.from('classes').select('id, name').order('name'),
    supabase.from('sections').select('id, name, class_id').order('name'),
  ])

  if (studentRes.error || !studentRes.data) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/admin/students/${id}`}
          prefetch={true}
          aria-label="Back to student"
          className="inline-flex items-center justify-center size-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Edit Student: {studentRes.data.student_name}</h1>
      </div>

      <div className="max-w-2xl">
        <EditStudentForm
          student={studentRes.data}
          classes={classesRes.data ?? []}
          sections={sectionsRes.data ?? []}
          onSubmitAction={updateStudentAction}
        />
      </div>
    </div>
  )
}

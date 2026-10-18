import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export default async function StudentPrintRedirectPage(props: {
  searchParams: Promise<{ id?: string; student?: string }>
}) {
  const { id, student } = await props.searchParams

  if (id) {
    redirect(`/print/challan/${id}`)
  }

  if (student) {
    redirect(`/print/challan/${student}`)
  }

  // Find active student
  const adminClient = createAdminClient()
  const { data: activeStudent } = await adminClient
    .from('students')
    .select('id')
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (activeStudent) {
    redirect(`/print/challan/${activeStudent.id}`)
  }

  redirect('/print/challan/default')
}

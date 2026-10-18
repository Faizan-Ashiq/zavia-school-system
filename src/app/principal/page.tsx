import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPrincipalHomeworkOverviewAction } from '@/app/staff/assignments/actions'
import { PrincipalHomeworkManager } from './principal-homework-manager'

export const dynamic = 'force-dynamic'

/**
 * Principal Portal: Institutional Homework & Academic Oversight
 * Provides unrestricted visibility across all classes, subjects, and teaching faculty
 * with real-time Teacher Name and Class filters.
 */
export default async function PrincipalHomeworkPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/principal')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', user.id)
    .maybeSingle()

  const roleUpper = profile?.role?.toUpperCase() ?? ''
  if (!profile || (roleUpper !== 'ADMIN' && roleUpper !== 'SUPER_ADMIN')) {
    redirect('/unauthorized')
  }

  // Fetch full visibility homework data, classes list, and teachers list
  const res = await getPrincipalHomeworkOverviewAction()

  return (
    <PrincipalHomeworkManager
      initialAssignments={res.assignments || []}
      classes={res.classes || []}
      teachers={res.teachers || []}
    />
  )
}

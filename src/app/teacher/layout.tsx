import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PortalShell, type NavItem } from '@/components/layout/portal-shell'

const navItems: NavItem[] = [
  { label: 'My Homework', href: '/teacher', iconName: 'file-text' },
  { label: 'My Classes', href: '/staff/my-classes', iconName: 'book-open' },
  { label: 'Marks Entry', href: '/staff/marks-entry', iconName: 'clipboard-list' },
  { label: 'Dashboard', href: '/staff/dashboard', iconName: 'layout-dashboard' },
  { label: 'Staff Leaves', href: '/staff/leaves', iconName: 'calendar-clock' },
  { label: 'Salary Slips', href: '/staff/salary', iconName: 'banknote' },
]

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/teacher')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', user.id)
    .maybeSingle()

  const roleUpper = profile?.role?.toUpperCase() ?? ''
  const allowedRoles = ['STAFF', 'TEACHER', 'FACULTY', 'ADMIN', 'SUPER_ADMIN']
  if (!allowedRoles.includes(roleUpper)) {
    redirect('/unauthorized')
  }

  return (
    <PortalShell
      portalLabel="Teacher Portal"
      navItems={navItems}
      userName={profile?.full_name || 'Subject Teacher'}
      userEmail={profile?.email || user.email || 'teacher@zaviaschool.edu.pk'}
      isSuperAdmin={roleUpper === 'SUPER_ADMIN'}
      portalPrefix="/teacher"
    >
      {children}
    </PortalShell>
  )
}

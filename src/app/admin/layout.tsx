import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PortalShell, type NavItem } from '@/components/layout/portal-shell'

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', iconName: 'layout-dashboard' },
  { label: 'Students & Admissions', href: '/admin/students', iconName: 'users' },
  { label: 'Fee Challans', href: '/admin/fees', iconName: 'receipt' },
  { label: 'Staff Directory', href: '/admin/staff', iconName: 'contact' },
  { label: 'Results', href: '/admin/results', iconName: 'graduation-cap' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Middleware should have already redirected, but guard here too
  // so Server Components never render unauthenticated content.
  if (!user) {
    redirect('/login?redirectTo=/admin/dashboard')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', user.id)
    .maybeSingle()

  const roleUpper = profile?.role?.toUpperCase() ?? ''

  // Wrong role — middleware catches this, but be defensive
  if (!profile || (roleUpper !== 'ADMIN' && roleUpper !== 'SUPER_ADMIN')) {
    redirect('/unauthorized')
  }

  const isSuperAdmin = roleUpper === 'SUPER_ADMIN'

  return (
    <PortalShell
      portalLabel="Campus Admin"
      navItems={navItems}
      userName={profile?.full_name || 'Admin Officer'}
      userEmail={profile?.email || user.email || 'admin@zaviaschool.edu.pk'}
      isSuperAdmin={isSuperAdmin}
      portalPrefix="/admin"
    >
      {children}
    </PortalShell>
  )
}

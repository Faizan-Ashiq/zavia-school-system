import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PortalShell, type NavItem } from '@/components/layout/portal-shell'
import { PrincipalCommandBar } from './command-bar'

const navItems: NavItem[] = [
  { label: 'Executive Overview', href: '/principal/dashboard', iconName: 'layout-dashboard' },
  { label: 'Homework Oversight', href: '/principal', iconName: 'file-text' },
  { label: 'Student Registry & Academics', href: '/principal/students', iconName: 'graduation-cap' },
  { label: 'Faculty & Staff HR', href: '/principal/staff', iconName: 'users' },
  { label: 'Institutional Financials', href: '/principal/finance', iconName: 'wallet' },
  { label: 'Payroll Approvals', href: '/principal/payroll', iconName: 'receipt' },
  { label: 'Exams & Performance', href: '/principal/results', iconName: 'book-open' },
  { label: 'Master Settings', href: '/principal/settings', iconName: 'settings' },
]

export default async function PrincipalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/principal/dashboard')
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

  return (
    <PortalShell
      portalLabel="Super Admin"
      navItems={navItems}
      userName={profile?.full_name || 'Executive Board'}
      userEmail={profile?.email || user.email || 'executive@zaviaschool.edu.pk'}
      isSuperAdmin={true}
      portalPrefix="/principal"
      topCommandBar={<PrincipalCommandBar />}
    >
      {children}
    </PortalShell>
  )
}

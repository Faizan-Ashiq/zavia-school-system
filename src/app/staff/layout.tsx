import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PortalShell, type NavItem } from '@/components/layout/portal-shell'
import { ImpersonationBanner } from '@/components/layout/impersonation-banner'

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/staff/dashboard', iconName: 'layout-dashboard' },
  { label: 'My Classes', href: '/staff/my-classes', iconName: 'book-open' },
  { label: 'Marks Entry', href: '/staff/marks-entry', iconName: 'clipboard-list' },
  { label: 'Homework', href: '/staff/homework', iconName: 'file-text' },
  { label: 'Leaves', href: '/staff/leaves', iconName: 'calendar-clock' },
  { label: 'Salary Slips', href: '/staff/salary', iconName: 'banknote' },
]

/** Read ?viewAs=<id> or ?viewAsStaffId=<id> from the incoming request URL */
async function getViewAsParam(): Promise<string | null> {
  try {
    const hdrs = await headers()
    const url = hdrs.get('x-url') ?? hdrs.get('x-next-url') ?? hdrs.get('referer') ?? ''
    if (!url) return null
    const searchParams = new URL(url, 'http://localhost').searchParams
    return searchParams.get('viewAs') ?? searchParams.get('viewAsStaffId')
  } catch {
    return null
  }
}

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/staff/dashboard')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    redirect('/unauthorized')
  }

  const roleUpper = profile.role?.toUpperCase() ?? ''
  const isAdmin = roleUpper === 'ADMIN' || roleUpper === 'SUPER_ADMIN'
  const viewAsId = await getViewAsParam()

  // Only Admin/Super Admin may use viewAs
  if (viewAsId && !isAdmin) {
    redirect('/unauthorized')
  }

  // Non-admin with no viewAs must be STAFF role
  const allowedRoles = ['STAFF', 'TEACHER', 'FACULTY', 'ADMIN', 'SUPER_ADMIN']
  if (!viewAsId && !allowedRoles.includes(roleUpper)) {
    redirect('/unauthorized')
  }

  const isSuperAdmin = roleUpper === 'SUPER_ADMIN'
  let impersonatedName: string | null = null
  let impersonatedRole: string = 'Teacher'

  if (viewAsId && isAdmin) {
    const adminClient = createAdminClient()
    const { data: impStaff } = await adminClient
      .from('staff')
      .select('full_name, designation')
      .eq('id', viewAsId)
      .maybeSingle()

    impersonatedName = impStaff?.full_name ?? 'Unknown Staff Member'
    impersonatedRole = impStaff?.designation ?? 'Teacher'
  }

  const userName = profile.full_name || (viewAsId ? 'Principal' : 'Faculty Member')
  const userEmail = profile.email || user.email || 'faculty@zaviaschool.edu.pk'

  // Build nav items with viewAs param preserved when impersonating
  const effectiveNavItems: NavItem[] = viewAsId
    ? navItems.map((item) => ({
        ...item,
        href: `${item.href}?viewAs=${viewAsId}`,
      }))
    : navItems

  return (
    <PortalShell
      portalLabel={viewAsId ? 'Staff Portal (Impersonation)' : (isSuperAdmin ? 'Faculty (Super Admin)' : 'Faculty')}
      navItems={effectiveNavItems}
      userName={userName}
      userEmail={userEmail}
      isSuperAdmin={!viewAsId && isSuperAdmin}
      portalPrefix="/staff"
      impersonationBanner={
        viewAsId && impersonatedName ? (
          <ImpersonationBanner
            personName={impersonatedName}
            roleLabel={impersonatedRole}
            exitHref="/principal/staff"
          />
        ) : null
      }
    >
      {children}
    </PortalShell>
  )
}

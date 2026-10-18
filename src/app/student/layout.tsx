import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PortalShell, type NavItem } from '@/components/layout/portal-shell'
import { ImpersonationBanner } from '@/components/layout/impersonation-banner'

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/student/dashboard', iconName: 'layout-dashboard' },
  { label: 'My Results', href: '/student/results', iconName: 'graduation-cap' },
  { label: 'Fee Vouchers', href: '/student/fees', iconName: 'receipt' },
  { label: 'Homework', href: '/student/homework', iconName: 'file-text' },
  { label: 'Past Papers', href: '/student/past-papers', iconName: 'archive' },
  { label: 'Social & Contacts', href: '/student/social', iconName: 'share-2' },
]

/** Read ?viewAs=<id> or ?viewAsStudentId=<id> from the incoming request URL */
async function getViewAsParam(): Promise<string | null> {
  try {
    const hdrs = await headers()
    // Next.js exposes x-next-url or x-url in server components
    const url = hdrs.get('x-url') ?? hdrs.get('x-next-url') ?? hdrs.get('referer') ?? ''
    if (!url) return null
    const searchParams = new URL(url, 'http://localhost').searchParams
    return searchParams.get('viewAs') ?? searchParams.get('viewAsStudentId')
  } catch {
    return null
  }
}

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/student/dashboard')
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

  // Impersonation mode: only Admin/Super Admin may pass viewAs
  if (viewAsId && !isAdmin) {
    redirect('/unauthorized')
  }

  // Non-admin with no viewAs → must be STUDENT role
  if (!viewAsId && roleUpper !== 'STUDENT') {
    redirect('/unauthorized')
  }

  let userName: string
  let userEmail: string
  let impersonatedName: string | null = null

  if (viewAsId && isAdmin) {
    // Fetch the impersonated student's name
    const adminClient = createAdminClient()
    const { data: impStudent } = await adminClient
      .from('students')
      .select('student_name')
      .eq('id', viewAsId)
      .maybeSingle()

    impersonatedName = impStudent?.student_name ?? 'Unknown Student'
    // Keep the Admin's real identity in the shell
    userName = profile.full_name || 'Principal'
    userEmail = profile.email || user.email || 'admin@zaviaschool.edu.pk'
  } else {
    userName = profile.full_name || 'Student'
    userEmail = profile.email || user.email || 'student@zaviaschool.edu.pk'
  }

  // Build nav items with viewAs param preserved when impersonating
  const effectiveNavItems: NavItem[] = viewAsId
    ? navItems.map((item) => ({
        ...item,
        href: `${item.href}?viewAs=${viewAsId}`,
      }))
    : navItems

  return (
    <PortalShell
      portalLabel={viewAsId ? 'Student Portal (Impersonation)' : 'Zavia School System — Student Academic'}
      navItems={effectiveNavItems}
      userName={userName}
      userEmail={userEmail}
      portalPrefix="/student"
      impersonationBanner={
        viewAsId && impersonatedName ? (
          <ImpersonationBanner
            personName={impersonatedName}
            roleLabel="Student"
            exitHref="/principal/students"
          />
        ) : null
      }
    >
      {children}
    </PortalShell>
  )
}

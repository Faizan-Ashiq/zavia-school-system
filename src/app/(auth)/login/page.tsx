import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LoginForm } from '@/components/forms/login-form'

export const dynamic = 'force-dynamic'

const ROLE_HOME: Record<string, string> = {
  ADMIN: '/admin/dashboard',
  SUPER_ADMIN: '/principal/dashboard',
  STAFF: '/staff/dashboard',
  TEACHER: '/staff/dashboard',
  STUDENT: '/student/dashboard',
}

export default async function LoginPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const role = profile?.role?.toUpperCase()
    if (role && ROLE_HOME[role]) {
      redirect(ROLE_HOME[role])
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Loader2,
  Building2,
  BookOpen,
  GraduationCap,
  ArrowRight,
  Sparkles,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginValues = z.infer<typeof loginSchema>

const ROLE_HOME: Record<string, string> = {
  ADMIN: '/admin/dashboard',
  SUPER_ADMIN: '/admin/dashboard',
  STAFF: '/staff/dashboard',
  STUDENT: '/student/dashboard',
}

const ROLE_PREFIX: Record<string, string> = {
  ADMIN: '/admin',
  SUPER_ADMIN: '/admin',
  STAFF: '/staff',
  STUDENT: '/student',
}

/**
 * Show the "Demo Quick Access" panel only when the developer flag
 * NEXT_PUBLIC_DEMO_MODE=true is present in the environment.
 * In production this env var should be absent (or set to false).
 */
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo')

  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(values: LoginValues) {
    setFormError(null)
    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (error || !data.user) {
        setFormError('Incorrect email or password. Please try again.')
        setIsSubmitting(false)
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profileError || !profile) {
        setFormError(
          'Your account has no portal access configured. Contact the school office.'
        )
        await supabase.auth.signOut()
        setIsSubmitting(false)
        return
      }

      const home = ROLE_HOME[profile.role] ?? '/unauthorized'
      const prefix = ROLE_PREFIX[profile.role]

      // Only honour the redirectTo if it matches the user's allowed prefix
      const destination =
        redirectTo && prefix && redirectTo.startsWith(prefix)
          ? redirectTo
          : home

      // Hard navigation ensures cookies are sent with the next request
      window.location.href = destination
    } catch {
      setFormError('An unexpected error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-sm shadow-lg border-border">
      <CardHeader>
        <div className="flex items-center gap-2 mb-1">
          <div className="h-7 w-7 rounded-lg overflow-hidden bg-primary/10 border border-primary/20 flex items-center justify-center">
            <img src="/Zavia.jpeg" alt="Zavia School System" className="h-full w-full object-cover" />
          </div>
          <span className="font-bold text-sm tracking-tight">Zavia School System</span>
        </div>
        <CardTitle className="text-xl">Sign in</CardTitle>
        <CardDescription>Enter your credentials to access your portal.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email" className="mb-1.5 block text-xs font-semibold">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@zaviaschool.edu.pk"
              className="text-xs h-9"
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password" className="mb-1.5 block text-xs font-semibold">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="text-xs h-9"
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          {formError && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {formError}
            </p>
          )}

          <Button
            type="submit"
            id="login-submit-btn"
            className="w-full h-9 font-semibold text-xs"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign in
          </Button>
        </form>

        {/* Demo Quick Access — only rendered when NEXT_PUBLIC_DEMO_MODE=true */}
        {DEMO_MODE && (
          <div className="border-t pt-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" /> Demo Quick Access
              </span>
              <span className="text-[10px] text-muted-foreground">Instant 1-Click Preview</span>
            </div>

            <div className="grid grid-cols-1 gap-2 text-xs">
              <Link
                href="/staff/homework"
                prefetch={false}
                className="group flex items-center justify-between p-2.5 rounded-lg bg-sky-50/70 hover:bg-sky-100/80 text-sky-800 border border-sky-200/80 transition-all shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-md bg-sky-500/10 text-sky-600 flex items-center justify-center">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-xs">Login as Teacher / Staff</p>
                    <p className="text-[10px] text-sky-600/80">Homework, Worksheets &amp; Slips</p>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-sky-600 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/admin/dashboard"
                prefetch={false}
                className="group flex items-center justify-between p-2.5 rounded-lg bg-indigo-50/70 hover:bg-indigo-100/80 text-indigo-800 border border-indigo-200/80 transition-all shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-md bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-xs">Login as Principal / Admin</p>
                    <p className="text-[10px] text-indigo-600/80">Full Operational Control</p>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-indigo-600 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/student/dashboard"
                prefetch={false}
                className="group flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/70 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200/80 transition-all shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-xs">Login as Student</p>
                    <p className="text-[10px] text-emerald-600/80">Fee Challans, Worksheets &amp; Results</p>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

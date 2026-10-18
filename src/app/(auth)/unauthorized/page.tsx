import Link from 'next/link'
import { ShieldX, LogIn } from 'lucide-react'

export const metadata = {
  title: 'Unauthorized — Zavia School System',
  description: 'You do not have permission to access this page.',
}

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
          <ShieldX className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Access Denied</h1>
          <p className="text-sm text-muted-foreground">
            You don&apos;t have permission to view this page. Please sign in with an account that
            has the appropriate portal access.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <LogIn className="h-4 w-4" />
            Sign in with different account
          </Link>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Key } from 'lucide-react'
import { provisionStudentAccount } from './actions'

export function ProvisionAccountButton({ studentId }: { studentId: string }) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ success?: boolean; error?: string; email?: string; password?: string } | null>(null)

  function handleProvision() {
    startTransition(async () => {
      const res = await provisionStudentAccount(studentId)
      setResult(res)
    })
  }

  return (
    <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
      <div>
        <h3 className="font-semibold text-lg">Student Login Portal</h3>
        <p className="text-sm text-muted-foreground">This student does not have access to the student portal yet.</p>
      </div>
      
      {result?.error ? (
        <div className="text-sm font-medium text-destructive">{result.error}</div>
      ) : result?.success ? (
        <div className="space-y-2 text-sm">
          <div className="font-medium text-green-600 dark:text-green-400">Account provisioned successfully!</div>
          <div className="rounded bg-background p-3 border">
            <p><span className="font-semibold">Email:</span> {result.email}</p>
            <p><span className="font-semibold">Password:</span> {result.password}</p>
            <p className="text-xs text-muted-foreground mt-2">Please share these credentials securely with the student/guardian. They must change their password upon first login.</p>
          </div>
        </div>
      ) : (
        <Button onClick={handleProvision} disabled={isPending}>
          {isPending ? 'Provisioning...' : (
            <>
              <Key className="mr-2 h-4 w-4" />
              Enable Student Login
            </>
          )}
        </Button>
      )}
    </div>
  )
}

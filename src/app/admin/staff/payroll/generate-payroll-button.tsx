'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { generatePayrollAction } from '../actions'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

interface GeneratePayrollButtonProps {
  month: number
  year: number
  hasPayroll: boolean
}

export function GeneratePayrollButton({ month, year, hasPayroll }: GeneratePayrollButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  if (hasPayroll) return null

  function handleGenerate() {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const res = await generatePayrollAction(month, year)
      if (res.error) {
        setError(res.error)
      } else {
        setSuccess(`Payroll generated for ${res.count} staff members.`)
        router.refresh()
      }
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={handleGenerate} disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <FileText className="mr-2 h-4 w-4" />
            Generate {MONTH_NAMES[month - 1]} {year} Payroll
          </>
        )}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
      {success && <span className="text-xs text-green-600">{success}</span>}
    </div>
  )
}

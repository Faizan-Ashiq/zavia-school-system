'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Printer, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { generateSingleStudentChallanAction } from '@/app/admin/fees/actions'

interface StudentChallanButtonProps {
  studentId: string
  voucherId?: string | null
}

export function StudentChallanButton({ studentId, voucherId: initialVoucherId }: StudentChallanButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [currentVoucherId, setCurrentVoucherId] = useState<string | null>(initialVoucherId ?? null)
  const [error, setError] = useState<string | null>(null)

  function handleGenerate() {
    setError(null)
    startTransition(async () => {
      const res = await generateSingleStudentChallanAction(studentId)
      if (res.error) {
        setError(res.error)
      } else if (res.challanId || res.voucherId) {
        const id = (res.challanId || res.voucherId)!
        setCurrentVoucherId(id)
        router.refresh()
        window.open(`/admin/fees/challan/${id}/print`, '_blank')
      }
    })
  }

  if (currentVoucherId) {
    return (
      /* @ts-expect-error React 19 type mismatch */
      <Button asChild variant="outline" size="sm">
        <Link href={`/admin/fees/challan/${currentVoucherId}/print`} target="_blank">
          <Printer className="mr-2 h-4 w-4" />
          Print Challan
        </Link>
      </Button>
    )
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <Button onClick={handleGenerate} disabled={isPending} variant="outline" size="sm">
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Printer className="mr-2 h-4 w-4" />
            Generate Challan for this Student
          </>
        )}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  )
}

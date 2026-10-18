'use client'

import { useTransition } from 'react'
import { Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { approveLeaveAction, rejectLeaveAction } from '../actions'

export function LeaveActions({ leaveId, currentStatus }: { leaveId: string; currentStatus: string }) {
  const [isPending, startTransition] = useTransition()

  if (currentStatus !== 'PENDING') return null

  function handleApprove() {
    startTransition(async () => {
      await approveLeaveAction(leaveId)
    })
  }

  function handleReject() {
    startTransition(async () => {
      await rejectLeaveAction(leaveId)
    })
  }

  return (
    <div className="flex justify-end gap-2">
      <Button
        variant="outline"
        size="sm"
        className="text-green-600 hover:text-green-700 hover:border-green-600"
        onClick={handleApprove}
        disabled={isPending}
        aria-label="Approve leave request"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
        Approve
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="text-destructive hover:text-destructive hover:border-destructive"
        onClick={handleReject}
        disabled={isPending}
        aria-label="Reject leave request"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="mr-1 h-4 w-4" />}
        Reject
      </Button>
    </div>
  )
}

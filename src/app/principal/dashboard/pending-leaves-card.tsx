'use client'

import React, { useState, useTransition } from 'react'
import { CalendarClock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { updateLeaveStatusAction } from '@/app/actions/leaves'

export interface PendingLeaveItem {
  id: string
  name: string
  role: string
  type: string
  dates: string
  days: number
  reason: string
  created_at?: string
}

export function PendingLeavesCard({ initialLeaves }: { initialLeaves: PendingLeaveItem[] }) {
  const [leaves, setLeaves] = useState<PendingLeaveItem[]>(initialLeaves)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Sync state if initialLeaves changes on server revalidation
  React.useEffect(() => {
    setLeaves(initialLeaves)
  }, [initialLeaves])

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3500)
  }

  const handleLeaveApprove = (id: string, name: string) => {
    setProcessingId(id)
    const original = [...leaves]
    // Optimistic removal
    setLeaves((prev) => prev.filter((l) => l.id !== id))

    startTransition(async () => {
      try {
        const res = await updateLeaveStatusAction(id, 'APPROVED')
        if (res && res.success) {
          showToast('success', `Leave approved for ${name}`)
        } else {
          setLeaves(original)
          showToast('error', res?.error || 'Failed to approve leave.')
        }
      } catch (err: any) {
        setLeaves(original)
        showToast('error', err?.message || 'Error approving leave.')
      } finally {
        setProcessingId(null)
      }
    })
  }

  const handleLeaveReject = (id: string, name: string) => {
    setProcessingId(id)
    const original = [...leaves]
    // Optimistic removal
    setLeaves((prev) => prev.filter((l) => l.id !== id))

    startTransition(async () => {
      try {
        const res = await updateLeaveStatusAction(id, 'REJECTED')
        if (res && res.success) {
          showToast('success', `Leave request rejected for ${name}`)
        } else {
          setLeaves(original)
          showToast('error', res?.error || 'Failed to reject leave.')
        }
      } catch (err: any) {
        setLeaves(original)
        showToast('error', err?.message || 'Error rejecting leave.')
      } finally {
        setProcessingId(null)
      }
    })
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[999999] px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold border animate-in fade-in slide-in-from-top-2 flex items-center gap-2 ${
            toast.type === 'success'
              ? 'bg-neutral-900 text-white border-neutral-700'
              : 'bg-rose-900 text-white border-rose-700'
          }`}
        >
          <span>{toast.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      <Card className="shadow-xs border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-indigo-600" />
              <CardTitle className="text-lg">Pending Staff Leaves</CardTitle>
            </div>
            <Badge variant={leaves.length > 0 ? 'default' : 'secondary'} className="text-xs">
              {leaves.length} Pending
            </Badge>
          </div>
          <CardDescription>Review and authorize faculty leave requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaves.length === 0 ? (
              <div className="text-sm text-slate-500 text-center py-8 border rounded-lg border-dashed bg-slate-50/50">
                No pending leave applications at this time.
              </div>
            ) : (
              leaves.map((leave) => {
                const isProcessing = processingId === leave.id && isPending
                return (
                  <div
                    key={leave.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border bg-slate-50/60 hover:bg-slate-100/80 transition-colors gap-3"
                  >
                    <div className="space-y-1">
                      <p className="font-semibold text-sm text-slate-900">
                        {leave.name}{' '}
                        <span className="text-xs text-slate-500 font-normal">({leave.role})</span>
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px] font-bold">
                          {leave.type}
                        </Badge>
                        <span className="text-xs font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {leave.dates} ({leave.days}d)
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 italic mt-1">&quot;{leave.reason}&quot;</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <Button
                        onClick={() => handleLeaveReject(leave.id, leave.name)}
                        disabled={isProcessing}
                        size="sm"
                        variant="outline"
                        className="h-8 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 cursor-pointer gap-1"
                        title="Reject Leave Application"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5" />
                        )}
                        Reject
                      </Button>
                      <Button
                        onClick={() => handleLeaveApprove(leave.id, leave.name)}
                        disabled={isProcessing}
                        size="sm"
                        className="h-8 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer gap-1 shadow-2xs"
                        title="Approve Leave Application"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3.5 w-3.5" />
                        )}
                        Approve
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

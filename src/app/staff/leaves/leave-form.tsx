'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarClock, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { submitLeaveApplication } from '@/app/actions/leaves'

type ToastState = { type: 'success' | 'error'; message: string } | null

export function LeaveForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<ToastState>(null)

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 5000)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    startTransition(async () => {
      try {
        const result = await submitLeaveApplication(formData)
        if (result && result.success) {
          showToast('success', result.message || 'Leave application submitted successfully. Forwarded to Principal office.')
          form.reset()
          router.refresh()
        } else {
          showToast('error', result?.error || 'Failed to submit leave application. Please try again.')
        }
      } catch (err: any) {
        showToast('error', err?.message || 'An unexpected network error occurred.')
      }
    })
  }

  return (
    <Card className="lg:col-span-1 shadow-xs border">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" />
          Submit Leave Request
        </CardTitle>
        <CardDescription>Forward application to Principal office</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Inline Toast */}
        {toast && (
          <div
            className={`mb-4 flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium ${
              toast.type === 'success'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                : 'border-destructive/30 bg-destructive/10 text-destructive'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label htmlFor="leaveType" className="font-semibold block mb-1">
              Leave Type
            </label>
            <select
              id="leaveType"
              name="leaveType"
              className="w-full px-3 py-2 text-xs border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option value="CASUAL">Casual Leave (Short Duration)</option>
              <option value="MEDICAL">Medical Leave (Doctor Slip)</option>
              <option value="DUTY">Academic / Exam Duty</option>
              <option value="EMERGENCY">Emergency Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="startDate" className="font-semibold block mb-1">
                From Date
              </label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                required
                className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="font-semibold block mb-1">
                To Date
              </label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                required
                className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reason" className="font-semibold block mb-1">
              Reason / Substitute Arrangement
            </label>
            <textarea
              id="reason"
              name="reason"
              rows={3}
              required
              minLength={5}
              maxLength={1000}
              placeholder="Specify reason for leave and class substitute teacher arrangement..."
              className="w-full px-3 py-2 text-xs border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <Button
            type="submit"
            variant="default"
            disabled={isPending}
            className="w-full text-xs h-9 font-semibold gap-1.5 cursor-pointer"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            {isPending ? 'Submitting...' : 'Submit Application'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

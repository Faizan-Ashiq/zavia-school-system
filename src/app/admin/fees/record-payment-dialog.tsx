'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { recordFeePaymentAction } from './actions'

export function RecordPaymentDialog({
  voucherId,
  amountDue,
  studentName,
  challanNo,
  open,
  onOpenChange,
}: {
  voucherId: string
  amountDue: number
  studentName: string
  challanNo: string
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [amount, setAmount] = useState(String(amountDue))
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  function handleRecord() {
    setError(null)
    const paidAmt = Number(amount)
    if (!paidAmt || paidAmt <= 0) {
      setError('Please enter a valid amount')
      return
    }

    startTransition(async () => {
      const res = await recordFeePaymentAction(voucherId, paidAmt, paymentMethod, date)
      if (res?.error) {
        setError(res.error)
      } else {
        onOpenChange(false)
        router.refresh()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Recording payment for {studentName} (Challan {challanNo})
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {error && <div className="text-sm text-destructive font-medium">{error}</div>}
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">Amount</Label>
            <Input id="amount" type="number" className="col-span-3" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="method" className="text-right">Method</Label>
            <div className="col-span-3">
              <Select value={paymentMethod} onValueChange={(v) => v && setPaymentMethod(v)}>
                <SelectTrigger id="method">
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="ONLINE">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">Date</Label>
            <Input id="date" type="date" className="col-span-3" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
          <Button onClick={handleRecord} disabled={isPending}>
            {isPending ? 'Saving...' : 'Record Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

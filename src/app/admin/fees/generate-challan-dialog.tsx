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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { generateMonthlyChallansAction } from './actions'

export function GenerateChallanDialog({ classes }: { classes: { id: string; name: string }[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  const [month, setMonth] = useState(String(currentMonth))
  const [year, setYear] = useState(String(currentYear))
  const [classId, setClassId] = useState('ALL')
  const [dueDate, setDueDate] = useState('')

  function handleGenerate() {
    setError(null)
    if (!dueDate) {
      setError('Please select a due date')
      return
    }

    startTransition(async () => {
      const res = await generateMonthlyChallansAction(month, Number(year), dueDate, classId)
      if (res?.error) {
        setError(res.error)
      } else {
        setOpen(false)
        router.refresh()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground font-medium text-sm h-8 px-3 hover:bg-primary/90 transition-colors cursor-pointer outline-none">
        Generate Monthly Challans
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate Challans</DialogTitle>
          <DialogDescription>
            Create fee vouchers for all active students in the selected class and month.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {error && <div className="text-sm text-destructive font-medium">{error}</div>}
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="month" className="text-right">Month</Label>
            <div className="col-span-3">
              <Select value={month} onValueChange={(v) => v && setMonth(v)}>
                <SelectTrigger id="month">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <SelectItem key={m} value={String(m)}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="year" className="text-right">Year</Label>
            <Input id="year" type="number" className="col-span-3" value={year} onChange={(e) => setYear(e.target.value)} />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="class" className="text-right">Class</Label>
            <div className="col-span-3">
              <Select value={classId} onValueChange={(v) => v && setClassId(v)}>
                <SelectTrigger id="class">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Classes</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="due_date" className="text-right">Due Date</Label>
            <Input id="due_date" type="date" className="col-span-3" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
          <Button onClick={handleGenerate} disabled={isPending}>
            {isPending ? 'Generating...' : 'Generate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

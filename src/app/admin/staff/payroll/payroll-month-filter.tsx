'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const now = new Date()
const YEARS = [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2]

interface PayrollMonthFilterProps {
  currentMonth: number
  currentYear: number
}

export function PayrollMonthFilter({ currentMonth, currentYear }: PayrollMonthFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleChange(key: 'month' | 'year', value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, value)
    router.push(`/admin/staff/payroll?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <select
        className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        value={currentMonth}
        onChange={(e) => handleChange('month', e.target.value)}
        aria-label="Select month"
      >
        {MONTH_NAMES.map((name, i) => (
          <option key={name} value={i + 1}>{name}</option>
        ))}
      </select>

      <select
        className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        value={currentYear}
        onChange={(e) => handleChange('year', e.target.value)}
        aria-label="Select year"
      >
        {YEARS.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  )
}

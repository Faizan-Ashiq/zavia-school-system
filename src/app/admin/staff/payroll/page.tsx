import Link from 'next/link'
import { Printer } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PayrollMonthFilter } from './payroll-month-filter'
import { GeneratePayrollButton } from './generate-payroll-button'

function formatCurrency(amount: number) {
  return `Rs. ${Number(amount ?? 0).toLocaleString()}`
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

interface PayrollPageProps {
  searchParams: Promise<{ month?: string; year?: string }>
}

export default async function PayrollPage({ searchParams }: PayrollPageProps) {
  const params = await searchParams
  const now = new Date()
  const month = Number(params.month ?? now.getMonth() + 1)
  const year = Number(params.year ?? now.getFullYear())

  // Use service-role client to bypass RLS — same reason as staff/page.tsx
  const adminClient = createAdminClient()

  // Fetch both payroll records and active staff concurrently
  const [payrollRes, staffRes] = await Promise.all([
    adminClient
      .from('staff_payroll')
      .select('*')
      .eq('month', month)
      .eq('year', year),
    adminClient
      .from('staff_profiles')
      .select('*')
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  const payrollList = payrollRes.data ?? []
  const activeStaffList = staffRes.data ?? []
  const hasPayroll = payrollList.length > 0

  // Collect all staff IDs to fetch profiles and staff details
  const allStaffIds = Array.from(
    new Set([
      ...payrollList.map((r) => r.staff_id),
      ...activeStaffList.map((s) => s.id),
    ].filter(Boolean))
  )

  const [{ data: allStaffProfiles }, { data: profilesRaw }] = await Promise.all([
    allStaffIds.length > 0
      ? adminClient.from('staff_profiles').select('*').in('id', allStaffIds)
      : Promise.resolve({ data: [] }),
    allStaffIds.length > 0
      ? adminClient.from('profiles').select('id, full_name, email').in('id', allStaffIds)
      : Promise.resolve({ data: [] }),
  ])

  const profileMap: Record<string, { full_name: string | null; email: string | null }> = {}
  for (const p of profilesRaw ?? []) {
    profileMap[p.id] = { full_name: p.full_name, email: p.email }
  }

  const staffMap: Record<string, any> = {}
  for (const s of allStaffProfiles ?? []) {
    staffMap[s.id] = s
  }

  // Totals
  const totalNet = payrollList.reduce((sum, r) => sum + Number(r.net_salary ?? 0), 0)
  const totalBase = payrollList.reduce((sum, r) => sum + Number(r.base_salary ?? 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Monthly Payroll</h2>
          <p className="text-sm text-muted-foreground">
            {MONTH_NAMES[month - 1]} {year}
            {hasPayroll ? ` · ${payrollList.length} records generated` : ' · No payroll generated yet'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <PayrollMonthFilter currentMonth={month} currentYear={year} />
          <GeneratePayrollButton month={month} year={year} hasPayroll={hasPayroll} />
        </div>
      </div>

      {hasPayroll && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Staff Processed</p>
              <p className="mt-1 text-2xl font-semibold">{payrollList.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Base Salary</p>
              <p className="mt-1 text-xl font-semibold">{formatCurrency(totalBase)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Net Payable</p>
              <p className="mt-1 text-xl font-semibold text-green-700">{formatCurrency(totalNet)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Paid / Pending</p>
              <p className="mt-1 text-xl font-semibold">
                {payrollList.filter((r) => r.status === 'PAID').length} / {payrollList.filter((r) => r.status === 'PENDING').length}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Employee</th>
                  <th className="px-4 py-3 font-medium">Designation</th>
                  <th className="px-4 py-3 font-medium text-right">Base Salary</th>
                  {hasPayroll && (
                    <>
                      <th className="px-4 py-3 font-medium text-right">Allowances</th>
                      <th className="px-4 py-3 font-medium text-right">Deductions</th>
                    </>
                  )}
                  <th className="px-4 py-3 font-medium text-right">
                    {hasPayroll ? 'Net Payable' : 'Estimated Net'}
                  </th>
                  {hasPayroll && <th className="px-4 py-3 font-medium">Status</th>}
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {hasPayroll ? (
                  payrollList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                        No payroll records found.
                      </td>
                    </tr>
                  ) : (
                    payrollList.map((record) => {
                      const staffProfile = staffMap[record.staff_id] || (record as any).staff_profiles || {}
                      const profile = profileMap[record.staff_id] || staffProfile?.profiles || {}
                      const member = {
                        ...staffProfile,
                        ...profile,
                        full_name: profile?.full_name || staffProfile?.full_name || null,
                        name: staffProfile?.name || null,
                      }
                      const totalAllowances = Number(record.total_allowances ?? 0)
                      const totalDeductions = Number(record.total_deductions ?? 0)
                      const netSalary = Number(record.net_salary ?? 0)

                      return (
                        <tr key={record.id} className="border-b last:border-0 hover:bg-muted/40">
                          <td className="px-4 py-3">
                            <div className="font-medium">{member.full_name || member.name || 'Staff Member'}</div>
                            <div className="text-xs text-muted-foreground">{member.email || staffProfile?.contact_number || staffProfile?.phone || ''}</div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{staffProfile?.designation ?? '—'}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(Number(record.base_salary ?? 0))}</td>
                          <td className="px-4 py-3 text-right text-green-700">
                            {totalAllowances > 0 ? `+${formatCurrency(totalAllowances)}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-right text-destructive">
                            {totalDeductions > 0 ? `-${formatCurrency(totalDeductions)}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-green-700">
                            {formatCurrency(netSalary)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={record.status === 'PAID' ? 'default' : 'secondary'}>
                              {record.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/print/payslip/${record.id}`}
                              prefetch={true}
                              target="_blank"
                              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'inline-flex items-center text-xs h-7 px-2.5')}
                            >
                              <Printer className="mr-1.5 h-3.5 w-3.5" />
                              Print Slip
                            </Link>
                          </td>
                        </tr>
                      )
                    })
                  )
                ) : (
                  activeStaffList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                        No active staff members found.
                      </td>
                    </tr>
                  ) : (
                    activeStaffList.map((s) => {
                      const profile = profileMap[s.id] || (s as any).profiles || {}
                      const member = {
                        ...s,
                        ...profile,
                        full_name: profile?.full_name || s?.full_name || null,
                        name: s?.name || null,
                      }
                      return (
                        <tr key={s.id} className="border-b last:border-0 hover:bg-muted/40">
                          <td className="px-4 py-3">
                            <div className="font-medium">{member.full_name || member.name || 'Staff Member'}</div>
                            <div className="text-xs text-muted-foreground">{member.email || s.contact_number || s.phone || ''}</div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{s.designation ?? '—'}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(Number(s.base_salary ?? 0))}</td>
                          <td className="px-4 py-3 text-right font-bold text-green-700">
                            {formatCurrency(Number(s.base_salary ?? 0))}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/print/payslip/${s.id}`}
                              prefetch={true}
                              target="_blank"
                              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'inline-flex items-center text-xs h-7 px-2.5')}
                            >
                              <Printer className="mr-1.5 h-3.5 w-3.5" />
                              Print Slip
                            </Link>
                          </td>
                        </tr>
                      )
                    })
                  )
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

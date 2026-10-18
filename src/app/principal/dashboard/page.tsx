import React from 'react'
import { ShieldCheck, Users, Wallet, Receipt } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PendingLeavesCard, type PendingLeaveItem } from './pending-leaves-card'
import { PendingConcessionsCard } from './pending-concessions-card'

export const dynamic = 'force-dynamic'

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export default async function PrincipalDashboardPage() {
  const adminClient = createAdminClient()

  let studentCount = 0
  let staffCount = 0
  let feeCollectionRate = 0
  let outstandingCount = 0
  let payrollLiability = 0
  let pendingLeavesList: PendingLeaveItem[] = []

  // 1. Fetch live pending staff leaves
  try {
    const { data: leavesRaw, error: leavesErr } = await adminClient
      .from('staff_leaves')
      .select('id, staff_id, user_id, leave_type, start_date, end_date, from_date, to_date, total_days, duration_days, reason, status, created_at')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })

    if (!leavesErr && leavesRaw && leavesRaw.length > 0) {
      const staffIds = Array.from(
        new Set(leavesRaw.map((l) => l.staff_id || l.user_id).filter(Boolean))
      )

      const [{ data: staffRows }, { data: profilesRows }] = await Promise.all([
        staffIds.length > 0
          ? adminClient
              .from('staff')
              .select('id, user_id, full_name, designation, department')
              .or(`id.in.(${staffIds.join(',')}),user_id.in.(${staffIds.join(',')})`)
          : Promise.resolve({ data: [] }),
        staffIds.length > 0
          ? adminClient
              .from('profiles')
              .select('id, full_name, email, role')
              .in('id', staffIds)
          : Promise.resolve({ data: [] }),
      ])

      const staffMap = new Map<string, { name: string; role: string }>()

      if (staffRows) {
        staffRows.forEach((s) => {
          const roleLabel = s.designation || s.department || 'Faculty Teacher'
          if (s.id) staffMap.set(s.id, { name: s.full_name || 'Teacher', role: roleLabel })
          if (s.user_id) staffMap.set(s.user_id, { name: s.full_name || 'Teacher', role: roleLabel })
        })
      }

      if (profilesRows) {
        profilesRows.forEach((p) => {
          if (!staffMap.has(p.id)) {
            staffMap.set(p.id, { name: p.full_name || 'Faculty Member', role: p.role || 'Staff' })
          }
        })
      }

      pendingLeavesList = leavesRaw.map((l) => {
        const idKey = l.staff_id || l.user_id || ''
        const staffInfo = staffMap.get(idKey)
        const sDate = l.start_date || l.from_date
        const eDate = l.end_date || l.to_date
        const dCount = Number(l.total_days || l.duration_days || 1)

        return {
          id: String(l.id),
          name: staffInfo?.name || 'Faculty Teacher',
          role: staffInfo?.role || 'Subject Teacher',
          type: l.leave_type || 'CASUAL',
          dates: `${formatDate(sDate)} – ${formatDate(eDate)}`,
          days: dCount,
          reason: l.reason || 'Personal / Duty Leave',
          created_at: l.created_at,
        }
      })
    }
  } catch (err) {
    console.error('[PrincipalDashboard] Error querying live pending leaves:', err)
  }

  // 2. Fetch live counts and financials
  try {
    const [studentsRes, staffRes, challansRes, staffSalaryRes] = await Promise.all([
      adminClient.from('students').select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
      adminClient.from('staff').select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
      adminClient.from('fee_challans').select('amount_due, amount_paid, paid_amount, status'),
      adminClient.from('staff').select('base_salary').eq('status', 'ACTIVE'),
    ])

    if (typeof studentsRes.count === 'number') {
      studentCount = studentsRes.count
    }

    if (typeof staffRes.count === 'number') {
      staffCount = staffRes.count
    }

    if (challansRes.data && challansRes.data.length > 0) {
      let totalDue = 0
      let totalPaid = 0
      let unpaidCount = 0

      challansRes.data.forEach((c) => {
        const due = Number(c.amount_due ?? 0)
        const paid = Number(c.paid_amount ?? c.amount_paid ?? 0)
        totalDue += due
        totalPaid += paid
        if (['UNPAID', 'OVERDUE', 'PARTIAL', 'PENDING'].includes(c.status ?? '')) {
          unpaidCount++
        }
      })

      if (totalDue > 0) {
        feeCollectionRate = Math.round((totalPaid / totalDue) * 100)
      }
      outstandingCount = unpaidCount
    }

    if (staffSalaryRes.data && staffSalaryRes.data.length > 0) {
      const sumSalary = staffSalaryRes.data.reduce((acc, row) => acc + Number(row.base_salary ?? 0), 0)
      payrollLiability = sumSalary
    }
  } catch (err) {
    console.error('[PrincipalDashboard] Error querying metrics:', err)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Executive Overview &amp; Control Desk</h1>
          <p className="mt-1 text-sm text-slate-500">
            Live institutional intelligence, approvals queue, and executive financial monitoring.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Enrolled Students */}
        <Card className="border-indigo-100 shadow-xs transition hover:shadow-md group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase text-slate-600 group-hover:text-indigo-600 transition-colors">
              Total Enrolled Students
            </CardTitle>
            <Users className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentCount.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">Active verified students</p>
          </CardContent>
        </Card>

        {/* Active Staff */}
        <Card className="border-teal-100 shadow-xs transition hover:shadow-md group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase text-slate-600 group-hover:text-teal-600 transition-colors">
              Active Faculty &amp; Staff
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staffCount}</div>
            <p className="text-xs text-slate-500 mt-1">Academic &amp; Administrative Wing</p>
          </CardContent>
        </Card>

        {/* Monthly Fee Collection */}
        <Card className="border-emerald-100 shadow-xs transition hover:shadow-md group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase text-slate-600 group-hover:text-emerald-600 transition-colors">
              Fee Collection Rate
            </CardTitle>
            <Wallet className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{feeCollectionRate}%</div>
            <p className="text-xs text-slate-500 mt-1">{outstandingCount} Unsettled Challans</p>
          </CardContent>
        </Card>

        {/* Monthly Payroll Liability */}
        <Card className="border-rose-100 shadow-xs transition hover:shadow-md group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase text-slate-600 group-hover:text-rose-600 transition-colors">
              Monthly Payroll Commitment
            </CardTitle>
            <Receipt className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(payrollLiability)}</div>
            <p className="text-xs text-rose-600 mt-1">Active Faculty Salary Register</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Pending Staff Leave Applications Queue */}
        <PendingLeavesCard initialLeaves={pendingLeavesList} />

        {/* Fee Concession Requests */}
        <PendingConcessionsCard />
      </div>
    </div>
  )
}

import Link from 'next/link'
import { UserPlus, Receipt, CalendarClock, Users, GraduationCap, Wallet, AlertTriangle } from 'lucide-react'

import { createAdminClient } from '@/lib/supabase/admin'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
}

const LEAVE_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDING: 'outline',
  APPROVED: 'default',
  REJECTED: 'destructive',
}

interface AdmissionItem {
  id: string
  student_name: string
  admission_no: string
  created_at: string
  className: string
}

interface LeaveItem {
  id: string
  staffName: string
  leave_type: string
  start_date: string
  end_date: string
  status: string
  created_at: string
}

export default async function AdminDashboardPage() {
  const adminClient = createAdminClient()

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  let studentCount = 0
  let staffCount = 0
  let feesCollected = 0
  let outstandingBalance = 0
  let recentAdmissions: AdmissionItem[] = []
  let recentLeaves: LeaveItem[] = []

  // 1. Fetch Student Count
  try {
    const { count, error } = await adminClient
      .from('students')
      .select('id', { count: 'exact', head: true })
    if (!error && typeof count === 'number') {
      studentCount = count
    }
  } catch (err) {
    console.error('Failed to fetch student count:', err)
  }

  // 2. Fetch Staff Count
  try {
    const { count, error } = await adminClient
      .from('staff')
      .select('id', { count: 'exact', head: true })
    if (!error && typeof count === 'number') {
      staffCount = count
    } else {
      // Fallback: check profiles with STAFF role
      const { count: profCount } = await adminClient
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .in('role', ['STAFF', 'TEACHER'])
      if (typeof profCount === 'number') {
        staffCount = profCount
      }
    }
  } catch (err) {
    console.error('Failed to fetch staff count:', err)
  }

  // 3. Fetch Fee Metrics (Try fee_challans first, fallback to fee_vouchers)
  try {
    const { data: challans, error: challansErr } = await adminClient
      .from('fee_challans')
      .select('amount_due, discount_applied, amount_paid, paid_amount, status, created_at, paid_at')

    if (!challansErr && challans && challans.length > 0) {
      challans.forEach((row) => {
        const paid = Number(row.paid_amount ?? row.amount_paid ?? 0)
        const due = Number(row.amount_due ?? 0)
        const discount = Number(row.discount_applied ?? 0)

        // Collected
        if (row.paid_at && new Date(row.paid_at) >= startOfMonth) {
          feesCollected += paid
        } else if (paid > 0 && (!row.created_at || new Date(row.created_at) >= startOfMonth)) {
          feesCollected += paid
        }

        // Outstanding
        if (['UNPAID', 'PARTIAL', 'OVERDUE', 'PENDING'].includes(row.status ?? '')) {
          const rem = due - discount - paid
          outstandingBalance += Math.max(rem, 0)
        }
      })
    } else {
      // Fallback to fee_vouchers
      const { data: vouchers } = await adminClient
        .from('fee_vouchers')
        .select('amount_due, discount_applied, amount_paid, status, created_at, paid_at')
      if (vouchers && vouchers.length > 0) {
        vouchers.forEach((row) => {
          const paid = Number(row.amount_paid ?? 0)
          const due = Number(row.amount_due ?? 0)
          const discount = Number(row.discount_applied ?? 0)

          if (row.paid_at && new Date(row.paid_at) >= startOfMonth) {
            feesCollected += paid
          } else if (paid > 0 && (!row.created_at || new Date(row.created_at) >= startOfMonth)) {
            feesCollected += paid
          }

          if (['UNPAID', 'PARTIAL', 'OVERDUE', 'PENDING'].includes(row.status ?? '')) {
            const rem = due - discount - paid
            outstandingBalance += Math.max(rem, 0)
          }
        })
      }
    }
  } catch (err) {
    console.error('Failed to fetch fee metrics:', err)
  }

  // 4. Fetch Recent Admissions
  try {
    const [studentsRes, classesRes] = await Promise.all([
      adminClient
        .from('students')
        .select('id, student_name, admission_no, created_at, class_id')
        .order('created_at', { ascending: false })
        .limit(5),
      adminClient.from('classes').select('id, name'),
    ])

    const classMap = new Map<string, string>()
    if (classesRes.data) {
      classesRes.data.forEach((c) => classMap.set(c.id, c.name))
    }

    if (studentsRes.data && studentsRes.data.length > 0) {
      recentAdmissions = studentsRes.data.map((s) => ({
        id: s.id,
        student_name: s.student_name ?? 'Unnamed Student',
        admission_no: s.admission_no ?? '—',
        created_at: s.created_at,
        className: (s.class_id && classMap.get(s.class_id)) || 'General Class',
      }))
    }
  } catch (err) {
    console.error('Failed to fetch recent admissions:', err)
  }

  // 5. Fetch Recent Leaves
  try {
    const { data: leavesData } = await adminClient
      .from('staff_leaves')
      .select('id, staff_id, leave_type, start_date, end_date, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (leavesData && leavesData.length > 0) {
      const staffIds = leavesData.map((l) => l.staff_id).filter(Boolean)
      const { data: staffRows } = await adminClient
        .from('staff')
        .select('id, full_name')
        .in('id', staffIds.length > 0 ? staffIds : ['__none__'])

      const staffMap = new Map<string, string>()
      if (staffRows) {
        staffRows.forEach((st) => staffMap.set(st.id, st.full_name))
      }

      recentLeaves = leavesData.map((l) => ({
        id: l.id,
        staffName: (l.staff_id && staffMap.get(l.staff_id)) || 'Staff Member',
        leave_type: l.leave_type || 'Casual Leave',
        start_date: l.start_date,
        end_date: l.end_date,
        status: l.status || 'PENDING',
        created_at: l.created_at,
      }))
    }
  } catch (err) {
    console.error('Failed to fetch recent leaves:', err)
  }

  const stats = [
    {
      label: 'Total Enrolled Students',
      value: studentCount.toLocaleString(),
      icon: Users,
    },
    {
      label: 'Total Teaching Staff',
      value: staffCount.toLocaleString(),
      icon: GraduationCap,
    },
    {
      label: 'Fees Collected This Month',
      value: formatCurrency(feesCollected),
      icon: Wallet,
    },
    {
      label: 'Outstanding Balance',
      value: formatCurrency(outstandingBalance),
      icon: AlertTriangle,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Executive Dashboard</h1>
          <p className="text-sm text-muted-foreground">Comprehensive institutional overview and quick administrative workflows.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-xs">
            System Online · Academic Session 2025–2026
          </Badge>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="shadow-xs">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold tracking-tight">{stat.value}</p>
              </div>
              <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <stat.icon className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/students/new"
          prefetch={true}
          className={cn(buttonVariants({ variant: 'default' }), 'cursor-pointer inline-flex items-center shadow-xs')}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          New Admission
        </Link>
        <Link
          href="/admin/fees"
          prefetch={true}
          className={cn(buttonVariants({ variant: 'outline' }), 'cursor-pointer inline-flex items-center shadow-xs')}
        >
          <Receipt className="mr-2 h-4 w-4" />
          Generate Fee Challans
        </Link>
        <Link
          href="/admin/staff/leaves"
          prefetch={true}
          className={cn(buttonVariants({ variant: 'outline' }), 'cursor-pointer inline-flex items-center shadow-xs')}
        >
          <CalendarClock className="mr-2 h-4 w-4" />
          Staff Leaves Queue
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent admissions */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Recent Admissions</span>
              <Link href="/admin/students" className="text-xs text-primary hover:underline font-normal">
                View All →
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {recentAdmissions.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">No recent admissions found.</p>
            ) : (
              recentAdmissions.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between border-b py-2.5 text-sm last:border-0"
                >
                  <div>
                    <p className="font-medium text-foreground">{student.student_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Roll/Adm: <span className="font-mono">{student.admission_no}</span> · {student.className}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">{formatDate(student.created_at)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent leave requests */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Recent Leave Requests</span>
              <Link href="/admin/staff/leaves" className="text-xs text-primary hover:underline font-normal">
                View Queue →
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {recentLeaves.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">No pending leave requests.</p>
            ) : (
              recentLeaves.map((leave) => (
                <div
                  key={leave.id}
                  className="flex items-center justify-between border-b py-2.5 text-sm last:border-0"
                >
                  <div>
                    <p className="font-medium text-foreground">{leave.staffName}</p>
                    <p className="text-xs text-muted-foreground">
                      {leave.leave_type} · {formatDate(leave.start_date)} – {formatDate(leave.end_date)}
                    </p>
                  </div>
                  <Badge variant={LEAVE_BADGE_VARIANT[leave.status] ?? 'outline'} className="text-xs">
                    {leave.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

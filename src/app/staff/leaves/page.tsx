import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  CalendarClock,
  Calendar,
} from 'lucide-react'
import { LeaveForm } from './leave-form'

export const dynamic = 'force-dynamic'

function formatDate(date: string) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function statusClass(status: string) {
  if (status === 'APPROVED') return 'bg-emerald-600 text-white'
  if (status === 'REJECTED') return 'bg-destructive text-white'
  return '' // PENDING uses default badge style
}

export default async function StaffLeavesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirectTo=/staff/leaves')

  const adminClient = createAdminClient()

  // Find linked staff record ID
  const { data: staffMember } = await adminClient
    .from('staff')
    .select('id')
    .or(`user_id.eq.${user.id},id.eq.${user.id}`)
    .maybeSingle()

  const staffId = staffMember?.id ?? user.id
  const targetIds = Array.from(new Set([user.id, staffId]))

  // Fetch staff member's leave history
  const { data: leavesRaw, error } = await adminClient
    .from('staff_leaves')
    .select('*')
    .in('staff_id', targetIds)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[StaffLeavesPage] Failed to fetch leaves:', error.message)
  }

  const leavesList = leavesRaw ?? []

  // Compute quota summary from real data
  const approvedCasual = leavesList.filter(
    (l) => l.leave_type === 'CASUAL' && l.status === 'APPROVED'
  ).reduce((acc, l) => acc + (l.total_days ?? 1), 0)

  const approvedMedical = leavesList.filter(
    (l) => l.leave_type === 'MEDICAL' && l.status === 'APPROVED'
  ).reduce((acc, l) => acc + (l.total_days ?? 1), 0)

  const approvedDuty = leavesList.filter(
    (l) => l.leave_type === 'DUTY' && l.status === 'APPROVED'
  ).reduce((acc, l) => acc + (l.total_days ?? 1), 0)

  const CASUAL_QUOTA = 10
  const MEDICAL_QUOTA = 8
  const DUTY_QUOTA = 5

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leave Management &amp; Applications</h1>
          <p className="text-sm text-muted-foreground">
            Apply for duty leaves, track approval status, and monitor annual leave balances
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300">
            Current Term: Autumn 2026
          </Badge>
        </div>
      </div>

      {/* Leave Quota Cards — live from DB */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase font-medium text-muted-foreground">Casual Leaves</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-primary">
                {Math.max(0, CASUAL_QUOTA - approvedCasual)} Remaining
              </span>
              <Badge variant="secondary" className="text-xs">Quota: {CASUAL_QUOTA}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{approvedCasual} Day(s) Consumed</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase font-medium text-muted-foreground">Medical Leaves</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-emerald-600">
                {Math.max(0, MEDICAL_QUOTA - approvedMedical)} Remaining
              </span>
              <Badge variant="secondary" className="text-xs">Quota: {MEDICAL_QUOTA}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{approvedMedical} Day(s) Consumed</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase font-medium text-muted-foreground">Duty / Academic</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-indigo-600">
                {Math.max(0, DUTY_QUOTA - approvedDuty)} Available
              </span>
              <Badge variant="secondary" className="text-xs">Quota: {DUTY_QUOTA}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Special Duty Leaves</p>
          </CardContent>
        </Card>
      </div>

      {/* Application Form & History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submit Form */}
        <LeaveForm />

        {/* Leave Requests History — real DB data */}
        <Card className="lg:col-span-2 shadow-xs border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Leave Application History
                </CardTitle>
                <CardDescription>
                  {leavesList.length > 0
                    ? `${leavesList.length} application(s) on record`
                    : 'No leave applications yet'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {leavesList.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-sm">
                You haven&apos;t submitted any leave applications yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted/60 text-muted-foreground border-y">
                    <tr>
                      <th className="py-3 px-4">Leave Type</th>
                      <th className="py-3 px-4">Dates</th>
                      <th className="py-3 px-4">Days</th>
                      <th className="py-3 px-4">Reason</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {leavesList.map((l) => (
                      <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-xs font-semibold">
                            {l.leave_type}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-foreground whitespace-nowrap">
                          {formatDate(l.start_date)} – {formatDate(l.end_date)}
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          {l.total_days ?? 1}d
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground max-w-xs truncate">
                          {l.reason}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            variant={
                              l.status === 'APPROVED'
                                ? 'default'
                                : l.status === 'REJECTED'
                                ? 'destructive'
                                : 'secondary'
                            }
                            className={`text-xs ${statusClass(l.status)}`}
                          >
                            {l.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

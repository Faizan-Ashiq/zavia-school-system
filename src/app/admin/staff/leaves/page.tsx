import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LeaveActions } from './leave-actions'

function formatDate(date: string) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function calcDays(start: string, end: string) {
  if (!start || !end) return 0
  const s = new Date(start)
  const e = new Date(end)
  return Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1)
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDING: 'outline',
  APPROVED: 'default',
  REJECTED: 'destructive',
}

const TAB_OPTIONS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const
type TabOption = typeof TAB_OPTIONS[number]

interface LeavesPageProps {
  searchParams: Promise<{ status?: string; staff?: string }>
}

export default async function LeavesQueuePage({ searchParams }: LeavesPageProps) {
  const params = await searchParams
  const activeTab: TabOption = (TAB_OPTIONS.includes(params.status as TabOption) ? params.status : 'ALL') as TabOption
  const staffFilter = params.staff

  // Use service-role client to bypass RLS — same reason as staff/page.tsx
  const adminClient = createAdminClient()

  let query = adminClient
    .from('staff_leaves')
    .select('*')
    .order('created_at', { ascending: false })

  if (activeTab !== 'ALL') {
    query = query.eq('status', activeTab)
  }

  if (staffFilter) {
    query = query.eq('staff_id', staffFilter)
  }

  const { data: leaves } = await query

  const leavesList = leaves ?? []
  const pendingCount = leavesList.filter((l) => l.status === 'PENDING').length

  const staffIds = Array.from(new Set(leavesList.map((l) => l.staff_id).filter(Boolean)))

  const [{ data: staffProfilesRaw }, { data: profilesRaw }] = await Promise.all([
    staffIds.length > 0
      ? adminClient.from('staff_profiles').select('*').in('id', staffIds)
      : Promise.resolve({ data: [] }),
    staffIds.length > 0
      ? adminClient.from('profiles').select('id, full_name, email').in('id', staffIds)
      : Promise.resolve({ data: [] }),
  ])

  const profileMap: Record<string, { full_name: string | null; email: string | null }> = {}
  for (const p of profilesRaw ?? []) {
    profileMap[p.id] = { full_name: p.full_name, email: p.email }
  }

  const staffMap: Record<string, any> = {}
  for (const s of staffProfilesRaw ?? []) {
    staffMap[s.id] = s
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/staff"
          prefetch={true}
          aria-label="Back to staff directory"
          className="inline-flex items-center justify-center size-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff Leaves Queue</h1>
          {pendingCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {pendingCount} pending request{pendingCount === 1 ? '' : 's'} awaiting decision
            </p>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 border-b">
        {TAB_OPTIONS.map((tab) => {
          const isActive = activeTab === tab
          const href = tab === 'ALL'
            ? staffFilter ? `/admin/staff/leaves?staff=${staffFilter}` : '/admin/staff/leaves'
            : staffFilter ? `/admin/staff/leaves?status=${tab}&staff=${staffFilter}` : `/admin/staff/leaves?status=${tab}`
          return (
            <Link
              key={tab}
              href={href}
              prefetch={true}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'ALL' ? 'All Requests' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </Link>
          )
        })}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Applicant</th>
                  <th className="px-4 py-3 font-medium">Leave Type</th>
                  <th className="px-4 py-3 font-medium">Date Range</th>
                  <th className="px-4 py-3 font-medium">Days</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leavesList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                      No leave requests found{activeTab !== 'ALL' ? ` with status: ${activeTab}` : ''}.
                    </td>
                  </tr>
                ) : (
                  leavesList.map((leave) => {
                    const staff = staffMap[leave.staff_id] || (leave as any).staff_profiles || {}
                    const profile = profileMap[leave.staff_id] || staff?.profiles || {}
                    const member = {
                      ...staff,
                      ...profile,
                      full_name: profile?.full_name || staff?.full_name || null,
                      name: staff?.name || null,
                    }
                    const applicantName = member.full_name ?? member.name ?? 'Staff Member'
                    const designation = staff?.designation || member.designation || 'Faculty'
                    const days = calcDays(leave.start_date, leave.end_date)

                    return (
                      <tr key={leave.id} className="border-b last:border-0 hover:bg-muted/40">
                        <td className="px-4 py-3">
                          <div className="font-medium">{applicantName}</div>
                          <div className="text-xs text-muted-foreground">{designation}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{leave.leave_type}</Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span>{formatDate(leave.start_date)}</span>
                          <span className="text-muted-foreground mx-1">–</span>
                          <span>{formatDate(leave.end_date)}</span>
                        </td>
                        <td className="px-4 py-3 text-center font-medium">{days}</td>
                        <td className="px-4 py-3 max-w-xs">
                          <p className="truncate" title={leave.reason ?? ''}>
                            {leave.reason || '—'}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={STATUS_VARIANT[leave.status] ?? 'outline'}>
                            {leave.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <LeaveActions leaveId={leave.id} currentStatus={leave.status} />
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

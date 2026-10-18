import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GenerateChallanDialog } from './generate-challan-dialog'
import { VoucherRowActions } from './voucher-row-actions'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(date: string) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB')
}

export default async function FeesPage(props: { searchParams: Promise<{ student?: string; month?: string; year?: string; status?: string }> }) {
  const searchParams = await props.searchParams
  const supabase = await createClient()

  // Build the vouchers query (filters are applied before execution)
  let voucherQuery = supabase
    .from('fee_vouchers')
    .select('id, challan_no, month, year, due_date, amount_due, amount_paid, discount_applied, status, student_id, students(student_name, admission_no, classes(name), sections(name))')
    .order('created_at', { ascending: false })
    .limit(100)

  if (searchParams.student) voucherQuery = voucherQuery.eq('student_id', searchParams.student)
  if (searchParams.month) voucherQuery = voucherQuery.eq('month', searchParams.month)
  if (searchParams.year) voucherQuery = voucherQuery.eq('year', searchParams.year)
  if (searchParams.status) voucherQuery = voucherQuery.eq('status', searchParams.status)

  // Parallelize: classes for the dropdown + filtered vouchers
  const [{ data: classes }, { data: vouchers }] = await Promise.all([
    supabase.from('classes').select('id, name').order('name'),
    voucherQuery,
  ])

  // Calculate stats
  let totalInvoiced = 0
  let totalCollected = 0
  let totalPending = 0

  vouchers?.forEach(v => {
    totalInvoiced += Number(v.amount_due) || 0
    totalCollected += Number(v.amount_paid) || 0
    if (['UNPAID', 'PARTIAL', 'OVERDUE'].includes(v.status)) {
      totalPending += (Number(v.amount_due) || 0) - (Number(v.amount_paid) || 0)
    }
  })

  const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fee Management</h1>
          <p className="text-muted-foreground">Manage monthly challans and record payments.</p>
        </div>
        <GenerateChallanDialog classes={classes ?? []} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoiced</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInvoiced)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalCollected)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending / Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(totalPending)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{collectionRate}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">Challan No</th>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Class</th>
                  <th className="px-4 py-3 font-medium">Due Date</th>
                  <th className="px-4 py-3 font-medium">Amount Due</th>
                  <th className="px-4 py-3 font-medium">Paid</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vouchers?.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      No vouchers found.
                    </td>
                  </tr>
                ) : (
                  vouchers?.map((v) => {
                    const student = v.students as unknown as { student_name: string; admission_no: string; classes: { name: string } | null; sections: { name: string } | null }
                    const className = student?.classes?.name ?? '—'
                    const sectionName = student?.sections?.name ?? '—'
                    
                    return (
                      <tr key={v.id} className="border-b last:border-0 hover:bg-muted/40">
                        <td className="px-4 py-3 font-medium">{v.challan_no}</td>
                        <td className="px-4 py-3">
                          <div>{student?.student_name}</div>
                          <div className="text-xs text-muted-foreground">{student?.admission_no}</div>
                        </td>
                        <td className="px-4 py-3">{className} - {sectionName}</td>
                        <td className="px-4 py-3">{formatDate(v.due_date)}</td>
                        <td className="px-4 py-3">{formatCurrency(v.amount_due)}</td>
                        <td className="px-4 py-3">{formatCurrency(v.amount_paid || 0)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={v.status === 'PAID' ? 'default' : v.status === 'OVERDUE' ? 'destructive' : 'secondary'}>
                            {v.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <VoucherRowActions voucher={v} studentName={student?.student_name} />
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

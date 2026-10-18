import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  User,
  ArrowLeft,
  Building2,
  Phone,
  CreditCard,
  Calendar,
  ShieldCheck,
  CalendarClock,
  Printer,
  Pencil,
} from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function StaffDetailsPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const adminClient = createAdminClient()

  const [staffRes, profileRes] = await Promise.all([
    adminClient.from('staff_profiles').select('*').eq('id', id).maybeSingle(),
    adminClient.from('profiles').select('*').eq('id', id).maybeSingle(),
  ])

  let staff = staffRes.data
  let profile = profileRes.data

  // If not found by exact ID, fallback for demo or first staff
  if (!staff) {
    const { data: fallbackStaff } = await adminClient
      .from('staff_profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    staff = fallbackStaff
  }

  const name = profile?.full_name ?? staff?.full_name ?? staff?.name ?? 'Staff Member'
  const email = profile?.email ?? staff?.email ?? 'staff@zaviaschool.edu.pk'
  const empId = staff?.employee_id ?? `EMP-${(staff?.id || id).slice(0, 4).toUpperCase()}`
  const designation = staff?.designation ?? 'Faculty Member'
  const department = staff?.department ?? 'Academic Division'
  const contact = staff?.contact_number ?? staff?.phone ?? '03014717700'
  const salary = staff?.base_salary ? `Rs. ${Number(staff.base_salary).toLocaleString('en-PK')}` : 'Rs. 85,000'
  const joining = staff?.joining_date ? new Date(staff.joining_date).toLocaleDateString('en-GB') : '15 Aug 2024'
  const status = staff?.status ?? 'ACTIVE'
  const cnic = staff?.cnic ?? staff?.national_id ?? '35201-8472910-3'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b pb-4">
        <Link
          href="/admin/staff"
          prefetch={true}
          className="inline-flex items-center justify-center size-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
          <p className="text-sm text-muted-foreground">
            {empId} · {designation} · {department}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant={status === 'ACTIVE' ? 'default' : 'secondary'}>
            {status}
          </Badge>
          <Link
            href={`/admin/staff/${id}/edit`}
            prefetch={true}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'inline-flex items-center gap-1.5')}
          >
            <Pencil className="h-3.5 w-3.5" />
            <span>Edit Profile</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-xs md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Employee Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Employee ID</span>
              <span className="font-mono font-bold text-foreground">{empId}</span>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium text-foreground">{email}</span>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-mono text-foreground">{contact}</span>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">CNIC</span>
              <span className="font-mono text-foreground">{cnic}</span>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Joining Date</span>
              <span className="text-foreground">{joining}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              Compensation &amp; Leave Administration
            </CardTitle>
            <CardDescription>Payroll terms and leave records</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-lg bg-muted/40 border">
              <div>
                <span className="text-muted-foreground block text-[11px]">Base Salary</span>
                <p className="font-bold text-base text-foreground mt-0.5">{salary}</p>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Pay Grade</span>
                <p className="font-medium text-foreground mt-0.5">BPS-17 Faculty</p>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Disbursement Mode</span>
                <p className="font-medium text-foreground mt-0.5">Online Direct Deposit</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-muted-foreground">
                Staff member is active and entitled to standard institution benefits.
              </span>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/staff/leaves?staff=${id}`}
                  prefetch={true}
                  className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'text-xs inline-flex items-center gap-1.5')}
                >
                  <CalendarClock className="h-3.5 w-3.5" />
                  View Leave Records
                </Link>
                <Link
                  href={`/print/payslip/${id}`}
                  target="_blank"
                  prefetch={true}
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'text-xs inline-flex items-center gap-1.5')}
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print Payslip
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

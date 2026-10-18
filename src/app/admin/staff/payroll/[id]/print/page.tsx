import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SalarySlipTemplate } from '@/components/printable/SalarySlipTemplate'
import { PrintButton } from './print-button'

export const dynamic = 'force-dynamic'

export default async function PrintSalarySlipPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const adminClient = createAdminClient()

  // 1. Try to fetch as a payroll record by payroll ID
  const { data: payrollById } = await adminClient
    .from('staff_payroll')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  let payrollRecord = payrollById

  // If not found by payroll ID, check if id is a staff_id in staff_payroll (get latest)
  if (!payrollRecord) {
    const { data: latestForStaff } = await adminClient
      .from('staff_payroll')
      .select('*')
      .eq('staff_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestForStaff) {
      payrollRecord = latestForStaff
    }
  }

  const staffId = payrollRecord?.staff_id ?? id

  // 2. Fetch staff profile and auth profile concurrently
  const [{ data: staffProfile }, { data: profile }] = await Promise.all([
    adminClient.from('staff_profiles').select('*').eq('id', staffId).maybeSingle(),
    adminClient.from('profiles').select('*').eq('id', staffId).maybeSingle(),
  ])

  // Fallback demo payroll if not found in database
  const effectivePayroll = payrollRecord || {
    id: `pay-${id}`,
    staff_id: staffId,
    month: 9,
    year: 2026,
    month_year: 'September 2026',
    base_salary: Number(staffProfile?.base_salary || 85000),
    basic_salary: Number(staffProfile?.base_salary || 85000),
    medical_allowance: 4000,
    conveyance_allowance: 5000,
    house_rent_allowance: 3000,
    allowances: 12000,
    total_allowances: 12000,
    deductions: 4500,
    total_deductions: 4500,
    leave_deduction: 0,
    net_salary: Number(staffProfile?.base_salary || 85000) + 12000 - 4500,
    status: 'PAID',
    payment_date: '2026-09-01',
    generated_at: new Date().toISOString(),
  }

  const member = {
    ...staffProfile,
    ...profile,
    full_name: profile?.full_name || staffProfile?.full_name || staffProfile?.name || 'Engr. Tariq Mehmood',
    name: staffProfile?.name || 'Engr. Tariq Mehmood',
    designation: staffProfile?.designation || 'Senior Faculty (Mathematics)',
    department: staffProfile?.department || 'Secondary Wing',
    employee_id: staffProfile?.employee_id || `EMP-${staffId.slice(0, 5).toUpperCase()}`,
  }

  const employeeName = member.full_name || 'Staff Member'

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col print:bg-white print:min-h-0 print:p-0">
      <div className="bg-white p-4 border-b no-print flex items-center justify-between shadow-sm print:hidden">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/staff/payroll"
            aria-label="Back to payroll"
            prefetch={true}
            className="inline-flex items-center justify-center size-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-semibold text-base sm:text-lg">Salary Slip: {employeeName}</h1>
        </div>
        <PrintButton />
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-8 flex justify-center items-start print:p-0 print:overflow-visible">
        {/* A4 portrait layout approx ratio */}
        <div className="w-full max-w-2xl bg-white shadow-xl overflow-hidden print:shadow-none print:w-full print:max-w-none">
          <SalarySlipTemplate
            payroll={effectivePayroll}
            staff={staffProfile || member}
            member={member}
          />
        </div>
      </div>
    </div>
  )
}

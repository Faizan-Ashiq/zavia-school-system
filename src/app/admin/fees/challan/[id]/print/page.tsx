import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { FeeChallanTemplate } from '@/components/printable/FeeChallanTemplate'
import { PrintButton } from './print-button'

export default async function PrintChallanPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const adminClient = createAdminClient()

  let voucher: any = null
  let student: any = null

  // 1. Try querying fee_challans first
  const { data: challanRecord } = await adminClient
    .from('fee_challans')
    .select('*, students(*, classes(name), sections(name))')
    .eq('id', id)
    .maybeSingle()

  if (challanRecord) {
    voucher = challanRecord
    student = challanRecord.students
  }

  // 2. Try querying fee_vouchers if not found in fee_challans
  if (!voucher) {
    const { data: voucherRecord } = await adminClient
      .from('fee_vouchers')
      .select('*, students(*, classes(name), sections(name))')
      .eq('id', id)
      .maybeSingle()

    if (voucherRecord) {
      voucher = voucherRecord
      student = voucherRecord.students
    }
  }

  // 3. Fallback: check if id is student_id in fee_challans or fee_vouchers
  if (!voucher) {
    const [fcRes, fvRes] = await Promise.all([
      adminClient
        .from('fee_challans')
        .select('*, students(*, classes(name), sections(name))')
        .eq('student_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      adminClient
        .from('fee_vouchers')
        .select('*, students(*, classes(name), sections(name))')
        .eq('student_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    voucher = fcRes.data ?? fvRes.data
    student = voucher?.students
  }

  // 4. If voucher found but student not embedded via join, fetch student directly
  if (voucher && !student && voucher.student_id) {
    const { data: directStudent } = await adminClient
      .from('students')
      .select('*, classes(name), sections(name)')
      .eq('id', voucher.student_id)
      .maybeSingle()
    student = directStudent
  }

  // 5. If still no voucher, but id is student_id directly: generate on-the-fly voucher
  if (!voucher) {
    const { data: directStudent } = await adminClient
      .from('students')
      .select('*, classes(name), sections(name)')
      .eq('id', id)
      .maybeSingle()
    if (directStudent) {
      student = directStudent
      const admNum = (student.admission_no ?? '5672').replace(/[^0-9]/g, '') || '5672'
      voucher = {
        id: `draft-${student.id.slice(0, 8)}`,
        student_id: student.id,
        challan_no: `CH-${admNum}-SEP26`,
        month: 9,
        year: 2026,
        due_date: new Date(Date.now() + 10 * 86400000).toISOString(),
        tuition_fee: Number(student.fee_package || 3500),
        exam_fee: 0,
        lab_fee: 0,
        computer_fee: 0,
        total_amount: Number(student.fee_package || 3500),
        amount_due: Number(student.fee_package || 3500),
        amount_paid: 0,
        status: 'UNPAID',
        created_at: new Date().toISOString(),
      }
    }
  }

  if (!voucher || !student) {
    notFound()
  }

  const challanNo = voucher.challan_no ?? `CH-${voucher.id.slice(0, 6).toUpperCase()}`

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col print:bg-white print:min-h-0 print:p-0">
      <div className="bg-white p-4 border-b no-print flex items-center justify-between shadow-sm print:hidden">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/fees"
            aria-label="Back to fees"
            prefetch={true}
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-semibold text-lg">3-Part Bank Challan: {challanNo}</h1>
        </div>
        <PrintButton />
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-8 flex justify-center items-start print:p-0 print:overflow-visible">
        {/* A4 Landscape layout container */}
        <div className="w-full max-w-6xl aspect-[297/210] bg-white shadow-xl overflow-hidden print:shadow-none print:w-full print:max-w-none print:aspect-auto">
          <FeeChallanTemplate voucher={voucher} student={student} />
        </div>
      </div>
    </div>
  )
}

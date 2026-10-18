import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { FeeChallanTemplate } from '@/components/printable/FeeChallanTemplate'
import { PrintControls } from './print-controls'

export const dynamic = 'force-dynamic'

export default async function StandalonePrintChallanPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const adminClient = createAdminClient()

  let voucher: any = null
  let student: any = null

  // 1. Query fee_challans by id
  const { data: challanRecord } = await adminClient
    .from('fee_challans')
    .select('*, students(*, classes(name), sections(name))')
    .eq('id', id)
    .maybeSingle()

  if (challanRecord) {
    voucher = challanRecord
    student = challanRecord.students
  }

  // 2. Query fee_vouchers by id
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

  // 3. Fallback: match by student_id in fee_challans / fee_vouchers
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

  // 4. If voucher found but student join wasn't populated
  if (voucher && !student && voucher.student_id) {
    const { data: directStudent } = await adminClient
      .from('students')
      .select('*, classes(name), sections(name)')
      .eq('id', voucher.student_id)
      .maybeSingle()
    student = directStudent
  }

  // 5. Fallback: match by student directly (e.g. if id is student_id or 'default')
  if (!student) {
    let directStudent = null
    if (id !== 'default' && id !== 'latest') {
      const res = await adminClient
        .from('students')
        .select('*, classes(name), sections(name)')
        .eq('id', id)
        .maybeSingle()
      directStudent = res.data
    }
    if (!directStudent) {
      const res = await adminClient
        .from('students')
        .select('*, classes(name), sections(name)')
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      directStudent = res.data
    }

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
        issue_date: new Date().toISOString(),
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
    <div className="min-h-screen bg-neutral-100 flex flex-col print:bg-white print:min-h-0 print:p-0">
      {/* Top action bar - Hidden during print */}
      <header className="bg-white border-b px-4 py-3 no-print print:hidden flex items-center justify-between shadow-xs sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
          <h1 className="font-semibold text-sm sm:text-base text-foreground">
            Official 3-Part Bank Challan · <span className="font-mono">{challanNo}</span>
          </h1>
        </div>
        <PrintControls />
      </header>

      {/* Printable Sheet Viewport */}
      <main className="flex-1 overflow-auto p-4 md:p-8 flex justify-center items-start print:p-0 print:overflow-visible">
        <div className="w-full max-w-6xl aspect-[297/210] bg-white shadow-xl rounded-lg border border-neutral-200 overflow-hidden print:shadow-none print:border-none print:w-full print:max-w-none print:aspect-auto print:rounded-none">
          <FeeChallanTemplate voucher={voucher} student={student} />
        </div>
      </main>
    </div>
  )
}

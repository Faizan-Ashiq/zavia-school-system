'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// ── Schemas ──────────────────────────────────────────────────────────────────

const generateChallansSchema = z.object({
  month: z.string().regex(/^\d{1,2}$/).transform(Number).refine((n) => n >= 1 && n <= 12, {
    message: 'Month must be between 1 and 12.',
  }),
  year: z.number().int().min(2000).max(2100),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be YYYY-MM-DD.'),
  classId: z.string().optional(),
})

const recordPaymentSchema = z.object({
  voucherId: z.string().uuid('Invalid voucher ID.'),
  amountPaid: z
    .number({ invalid_type_error: 'Amount must be a number.' })
    .positive('Amount paid must be greater than zero.')
    .max(1_000_000, 'Amount seems unreasonably high.'),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE'], {
    errorMap: () => ({ message: 'Invalid payment method.' }),
  }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Payment date must be YYYY-MM-DD.'),
})

const applyLateFeeSchema = z.object({
  voucherId: z.string().uuid('Invalid voucher ID.'),
  lateFeeAmount: z
    .number({ invalid_type_error: 'Late fee must be a number.' })
    .min(0, 'Late fee cannot be negative.')
    .max(100_000),
})

// ── Actions ───────────────────────────────────────────────────────────────────

async function assertAdminCaller() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { supabase: null, user: null, error: 'Authentication required.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['ADMIN', 'SUPER_ADMIN'].includes(profile.role)) {
    return { supabase: null, user: null, error: 'Only Admin can perform this action.' }
  }

  return { supabase, user, error: null }
}

export async function generateMonthlyChallansAction(
  month: string,
  year: number,
  dueDate: string,
  classId?: string
) {
  try {
    const { supabase, error: authError } = await assertAdminCaller()
    if (authError || !supabase) return { error: authError ?? 'Unauthorized' }

    const parsed = generateChallansSchema.safeParse({ month, year, dueDate, classId })
    if (!parsed.success) {
      return { error: parsed.error.errors[0]?.message ?? 'Validation failed.' }
    }

    const { month: monthNumber, year: validYear, dueDate: validDueDate, classId: validClassId } = parsed.data

    let query = supabase.from('students').select('id, fee_package').eq('status', 'ACTIVE')
    if (validClassId && validClassId !== 'ALL') {
      query = query.eq('class_id', validClassId)
    }

    const { data: students, error: fetchError } = await query

    if (fetchError || !students) {
      return { error: 'Failed to fetch students.' }
    }

    if (students.length === 0) {
      return { error: 'No active students found for generation.' }
    }

    const monthName = MONTH_NAMES[monthNumber - 1] || 'September'
    const monthStr = `${monthName} ${validYear}`
    const mStr = String(monthNumber).padStart(2, '0')
    const ts = Date.now().toString().slice(-4)

    // Build rows for both tables
    const vouchers = students.map((s, index) => {
      const seq = String(index + 1).padStart(3, '0')
      const challanNo = `FEE-${validYear}${mStr}-${seq}-${ts}`
      const feePackage = Number(s.fee_package) || 0

      return {
        student_id: s.id,
        challan_no: challanNo,
        month: monthNumber,
        year: validYear,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: validDueDate,
        tuition_fee: feePackage,
        arrears: 0,
        discount_applied: 0,
        amount_due: feePackage,
        late_fee: 0,
        amount_paid: 0,
        status: 'UNPAID',
      }
    })

    const challans = students.map((s, index) => {
      const seq = String(index + 1).padStart(3, '0')
      const challanNo = `FEE-${validYear}${mStr}-${seq}-${ts}`
      const feePackage = Number(s.fee_package) || 0

      return {
        student_id: s.id,
        challan_no: challanNo,
        month: monthStr,
        tuition_fee: feePackage,
        arrears: 0,
        total_amount: feePackage,
        due_date: validDueDate,
        status: 'UNPAID',
        discount: 0,
        fine: 0,
      }
    })

    const [{ error: voucherError }] = await Promise.all([
      supabase.from('fee_vouchers').insert(vouchers),
      supabase.from('fee_challans').insert(challans),
    ])

    if (voucherError) {
      return { error: 'Failed to generate challans: ' + voucherError.message }
    }

    revalidatePath('/admin/fees')
    return { success: true, count: vouchers.length }
  } catch (err) {
    console.error('[generateMonthlyChallansAction] Error:', err)
    return { error: 'An unexpected error occurred.' }
  }
}

export async function generateSingleStudentChallanAction(studentId: string) {
  try {
    const { supabase, error: authError } = await assertAdminCaller()
    if (authError || !supabase) return { error: authError ?? 'Unauthorized' }

    const idParsed = z.string().uuid().safeParse(studentId)
    if (!idParsed.success) return { error: 'Invalid student ID.' }

    const { data: student, error: fetchError } = await supabase
      .from('students')
      .select('id, fee_package')
      .eq('id', studentId)
      .single()

    if (fetchError || !student) {
      return { error: 'Student not found.' }
    }

    const now = new Date()
    const monthNumber = now.getMonth() + 1
    const year = now.getFullYear()
    const monthName = MONTH_NAMES[now.getMonth()]
    const mStr = String(monthNumber).padStart(2, '0')
    const seq = String(Math.floor(100 + Math.random() * 900))
    const challanNo = `FEE-${year}${mStr}-${seq}-${Date.now().toString().slice(-4)}`

    const dueDateObj = new Date()
    dueDateObj.setDate(dueDateObj.getDate() + 10)
    const dueDate = dueDateObj.toISOString().split('T')[0]

    const feePackage = Number(student.fee_package) || 0

    const { data: insertedChallan } = await supabase
      .from('fee_challans')
      .insert({
        student_id: student.id,
        challan_no: challanNo,
        month: `${monthName} ${year}`,
        tuition_fee: feePackage,
        arrears: 0,
        total_amount: feePackage,
        due_date: dueDate,
        status: 'UNPAID',
        discount: 0,
        fine: 0,
      })
      .select('id')
      .maybeSingle()

    const { data: insertedVoucher, error: insertError } = await supabase
      .from('fee_vouchers')
      .insert({
        student_id: student.id,
        challan_no: challanNo,
        month: monthNumber,
        year,
        issue_date: now.toISOString().split('T')[0],
        due_date: dueDate,
        tuition_fee: feePackage,
        arrears: 0,
        discount_applied: 0,
        amount_due: feePackage,
        late_fee: 0,
        amount_paid: 0,
        status: 'UNPAID',
      })
      .select('id')
      .maybeSingle()

    const finalId = insertedChallan?.id ?? insertedVoucher?.id

    if (!finalId && insertError) {
      return { error: 'Failed to generate fee challan: ' + (insertError?.message || '') }
    }

    revalidatePath(`/admin/students/${studentId}`)
    revalidatePath('/admin/fees')
    return {
      success: true,
      challanId: finalId,
      voucherId: insertedVoucher?.id ?? finalId,
    }
  } catch (err) {
    console.error('[generateSingleStudentChallanAction] Error:', err)
    return { error: 'An unexpected error occurred.' }
  }
}

export async function generateStudentChallan(studentId: string) {
  return generateSingleStudentChallanAction(studentId)
}

export async function recordFeePaymentAction(
  voucherId: string,
  amountPaid: number,
  paymentMethod: string,
  date: string
) {
  try {
    const { supabase, error: authError } = await assertAdminCaller()
    if (authError || !supabase) return { error: authError ?? 'Unauthorized' }

    const parsed = recordPaymentSchema.safeParse({ voucherId, amountPaid, paymentMethod, date })
    if (!parsed.success) {
      return { error: parsed.error.errors[0]?.message ?? 'Validation failed.' }
    }

    const { data: voucher, error: fetchError } = await supabase
      .from('fee_vouchers')
      .select('amount_due, amount_paid, late_fee')
      .eq('id', parsed.data.voucherId)
      .single()

    if (fetchError || !voucher) {
      return { error: 'Voucher not found.' }
    }

    const newPaid = Number(voucher.amount_paid || 0) + parsed.data.amountPaid
    const totalDue = Number(voucher.amount_due) + Number(voucher.late_fee || 0)
    const status = newPaid >= totalDue ? 'PAID' : 'PARTIAL'

    const { error: updateError } = await supabase
      .from('fee_vouchers')
      .update({
        amount_paid: newPaid,
        paid_at: new Date(parsed.data.date).toISOString(),
        payment_method: parsed.data.paymentMethod,
        status,
      })
      .eq('id', parsed.data.voucherId)

    if (updateError) {
      console.error('[recordFeePaymentAction] Error:', updateError)
      return { error: 'Failed to record payment.' }
    }

    revalidatePath('/admin/fees')
    revalidatePath('/student/fees')
    return { success: true }
  } catch (err) {
    console.error('[recordFeePaymentAction] Unexpected error:', err)
    return { error: 'An unexpected error occurred.' }
  }
}

/**
 * Apply (or update) a late fee to an existing voucher.
 * Called automatically or manually from the fee management UI.
 */
export async function applyLateFeeAction(voucherId: string, lateFeeAmount: number) {
  try {
    const { supabase, error: authError } = await assertAdminCaller()
    if (authError || !supabase) return { error: authError ?? 'Unauthorized' }

    const parsed = applyLateFeeSchema.safeParse({ voucherId, lateFeeAmount })
    if (!parsed.success) {
      return { error: parsed.error.errors[0]?.message ?? 'Validation failed.' }
    }

    // Fetch current voucher
    const { data: voucher, error: fetchError } = await supabase
      .from('fee_vouchers')
      .select('amount_due, late_fee, status')
      .eq('id', parsed.data.voucherId)
      .single()

    if (fetchError || !voucher) {
      return { error: 'Voucher not found.' }
    }

    if (voucher.status === 'PAID') {
      return { error: 'Cannot apply late fee to a PAID voucher.' }
    }

    const { error: updateError } = await supabase
      .from('fee_vouchers')
      .update({
        late_fee: parsed.data.lateFeeAmount,
      })
      .eq('id', parsed.data.voucherId)

    if (updateError) {
      console.error('[applyLateFeeAction] Error:', updateError)
      return { error: 'Failed to apply late fee.' }
    }

    // Mirror to fee_challans if linked by challan_no
    // Best-effort — we don't return an error if this step fails
    await supabase
      .from('fee_challans')
      .update({ fine: parsed.data.lateFeeAmount })
      .eq('id', parsed.data.voucherId)
      .neq('status', 'PAID')

    revalidatePath('/admin/fees')
    return { success: true }
  } catch (err) {
    console.error('[applyLateFeeAction] Unexpected error:', err)
    return { error: 'An unexpected error occurred.' }
  }
}

/**
 * Toggle fee status between PAID and UNPAID (for manual corrections).
 */
export async function toggleFeeStatusAction(voucherId: string, newStatus: 'PAID' | 'UNPAID') {
  try {
    const { supabase, error: authError } = await assertAdminCaller()
    if (authError || !supabase) return { error: authError ?? 'Unauthorized' }

    const idParsed = z.string().uuid().safeParse(voucherId)
    if (!idParsed.success) return { error: 'Invalid voucher ID.' }

    const statusParsed = z.enum(['PAID', 'UNPAID']).safeParse(newStatus)
    if (!statusParsed.success) return { error: 'Invalid status value.' }

    const { error } = await supabase
      .from('fee_vouchers')
      .update({ status: statusParsed.data })
      .eq('id', idParsed.data)

    if (error) {
      console.error('[toggleFeeStatusAction] Error:', error)
      return { error: 'Failed to update fee status.' }
    }

    revalidatePath('/admin/fees')
    revalidatePath('/student/fees')
    return { success: true }
  } catch (err) {
    console.error('[toggleFeeStatusAction] Unexpected error:', err)
    return { error: 'An unexpected error occurred.' }
  }
}

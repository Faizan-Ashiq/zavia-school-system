'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export async function addStaffAction(formData: FormData) {
  const adminAuthClient = createAdminClient()

  const fullName = (formData.get('full_name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim()
  const contactNumber = (formData.get('contact_number') as string)?.trim()
  const whatsappNumber = (formData.get('whatsapp_number') as string)?.trim() || null
  const cnic = (formData.get('cnic') as string)?.trim() || null
  const designation = formData.get('designation') as string
  const department = (formData.get('department') as string) || null
  const baseSalary = Number(formData.get('base_salary') ?? 0)
  const joiningDate = formData.get('joining_date') as string
  const status = (formData.get('status') as string) || 'ACTIVE'

  if (!fullName || !email) {
    return { error: 'Full name and email are required.' }
  }

  // 1. Provision Auth Account
  const password = 'Staff@123'
  const { data: authData, error: authError } = await adminAuthClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: fullName },
  })

  if (authError || !authData.user) {
    return { error: 'Failed to provision auth account: ' + (authError?.message || 'Unknown error') }
  }

  const userId = authData.user.id

  // 2. Upsert profile
  const { error: profileError } = await adminAuthClient
    .from('profiles')
    .upsert({
      id: userId,
      email,
      full_name: fullName,
      role: 'STAFF',
    })

  if (profileError) {
    await adminAuthClient.auth.admin.deleteUser(userId)
    return { error: 'Failed to create profile: ' + profileError.message }
  }

  // 3. Insert staff_profiles record
  const { error: staffError } = await adminAuthClient
    .from('staff_profiles')
    .insert({
      id: userId,
      designation,
      department,
      base_salary: baseSalary,
      joining_date: joiningDate,
      contact_number: contactNumber,
      whatsapp_number: whatsappNumber,
      cnic,
      status,
    })

  if (staffError) {
    await adminAuthClient.auth.admin.deleteUser(userId)
    return { error: 'Failed to create staff record: ' + staffError.message }
  }

  revalidatePath('/admin/staff')
  return { success: true }
}

export async function approveLeaveAction(leaveId: string) {
  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('staff_leaves')
    .update({
      status: 'APPROVED',
    })
    .eq('id', leaveId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/staff/leaves')
  return { success: true }
}

export async function rejectLeaveAction(leaveId: string) {
  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('staff_leaves')
    .update({
      status: 'REJECTED',
    })
    .eq('id', leaveId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/staff/leaves')
  return { success: true }
}

export async function updateLeaveStatusAction(leaveId: string, status: string) {
  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('staff_leaves')
    .update({
      status,
    })
    .eq('id', leaveId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/staff/leaves')
  return { success: true }
}

export async function generatePayrollAction(month: number, year: number) {
  const adminClient = createAdminClient()

  // Fetch all active staff
  const { data: staffList, error: staffError } = await adminClient
    .from('staff_profiles')
    .select('id, base_salary')
    .eq('status', 'ACTIVE')

  if (staffError || !staffList) {
    return { error: 'Failed to fetch staff: ' + (staffError?.message || '') }
  }

  if (staffList.length === 0) {
    return { error: 'No active staff members found.' }
  }

  // Check if payroll already exists for this month/year
  const { data: existing } = await adminClient
    .from('staff_payroll')
    .select('id')
    .eq('month', month)
    .eq('year', year)
    .limit(1)
    .maybeSingle()

  if (existing) {
    return { error: `Payroll for this month has already been generated.` }
  }

  // Fetch approved UNPAID leaves for this month to calculate deductions
  const monthStart = new Date(year, month - 1, 1).toISOString().split('T')[0]
  const monthEnd = new Date(year, month, 0).toISOString().split('T')[0]

  const { data: unpaidLeaves } = await adminClient
    .from('staff_leaves')
    .select('staff_id, start_date, end_date')
    .eq('status', 'APPROVED')
    .eq('leave_type', 'UNPAID')
    .gte('start_date', monthStart)
    .lte('end_date', monthEnd)

  // Calculate leave deductions per staff member
  const leaveDeductionMap: Record<string, number> = {}
  for (const leave of unpaidLeaves ?? []) {
    const start = new Date(leave.start_date)
    const end = new Date(leave.end_date)
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)
    leaveDeductionMap[leave.staff_id] = (leaveDeductionMap[leave.staff_id] ?? 0) + days
  }

  const payrollRows = staffList.map((s) => {
    const baseSalary = Number(s.base_salary ?? 0)
    const dailyRate = baseSalary / 26 // 26 working days
    const unpaidDays = leaveDeductionMap[s.id] ?? 0
    const leaveDeduction = Math.round(dailyRate * unpaidDays)

    const medicalAllowance = 0
    const conveyanceAllowance = 0
    const houseRentAllowance = 0
    const totalAllowances = medicalAllowance + conveyanceAllowance + houseRentAllowance
    const totalDeductions = leaveDeduction
    const netSalary = baseSalary + totalAllowances - totalDeductions

    const MONTH_NAMES = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ]
    const monthName = MONTH_NAMES[month - 1] || 'September'

    return {
      staff_id: s.id,
      employee_id: (s as any).employee_id ?? `EMP-${s.id.slice(0, 5).toUpperCase()}`,
      month_year: `${monthName} ${year}`,
      month,
      year,
      base_salary: baseSalary,
      basic_salary: baseSalary,
      medical_allowance: medicalAllowance,
      conveyance_allowance: conveyanceAllowance,
      house_rent_allowance: houseRentAllowance,
      allowances: totalAllowances,
      total_allowances: totalAllowances,
      deductions: totalDeductions,
      total_deductions: totalDeductions,
      leave_deduction: leaveDeduction,
      net_salary: netSalary,
      status: 'PENDING',
      generated_at: new Date().toISOString(),
    }
  })

  const { error: insertError } = await adminClient
    .from('staff_payroll')
    .insert(payrollRows)

  if (insertError) {
    return { error: 'Failed to generate payroll: ' + insertError.message }
  }

  revalidatePath('/admin/staff/payroll')
  return { success: true, count: payrollRows.length }
}

export async function markPayrollPaidAction(payrollId: string) {
  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('staff_payroll')
    .update({ status: 'PAID', paid_at: new Date().toISOString() })
    .eq('id', payrollId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/staff/payroll')
  return { success: true }
}

export async function approveLeave(leaveId: string) {
  return approveLeaveAction(leaveId)
}

export async function rejectLeave(leaveId: string) {
  return rejectLeaveAction(leaveId)
}

export async function generateMonthlyPayroll(month: number, year: number) {
  return generatePayrollAction(month, year)
}


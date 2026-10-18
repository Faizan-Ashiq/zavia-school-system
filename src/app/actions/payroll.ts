'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function approvePayrollBatch(month: number, year: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('staff_payroll')
    .update({ status: 'PAID' })
    .eq('month', month)
    .eq('year', year)
    .eq('status', 'UNPAID')

  if (error) {
    console.error('Failed to approve payroll batch', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/principal/payroll')
  return { success: true }
}

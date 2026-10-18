'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const adjustSalarySchema = z.object({
  staffId: z.string().uuid('Invalid staff ID.'),
  baseSalary: z
    .number({ invalid_type_error: 'Salary must be a number.' })
    .min(0, 'Salary cannot be negative.')
    .max(10_000_000, 'Salary value seems unreasonably high.'),
})

export async function adjustStaffSalaryAction(staffId: string, baseSalary: number) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Authentication required.' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['ADMIN', 'SUPER_ADMIN'].includes(profile.role)) {
      return { success: false, error: 'Only Admin can adjust staff compensation.' }
    }

    const parsed = adjustSalarySchema.safeParse({ staffId, baseSalary })
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? 'Validation failed.' }
    }

    const { error } = await supabase
      .from('staff')
      .update({
        base_salary: parsed.data.baseSalary,
        updated_at: new Date().toISOString(),
      })
      .eq('id', parsed.data.staffId)

    if (error) {
      console.error('[adjustStaffSalaryAction] Supabase error:', error)
      return { success: false, error: 'Failed to update salary. Please try again.' }
    }

    revalidatePath('/principal/staff')
    revalidatePath('/admin/staff')
    return { success: true }
  } catch (err) {
    console.error('[adjustStaffSalaryAction] Unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred.' }
  }
}

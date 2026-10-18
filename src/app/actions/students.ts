'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Pakistani phone number: 03xx-xxxxxxx or +92-xxx-xxxxxxx or plain 11-digit
const pkPhone = z
  .string()
  .regex(
    /^(\+92|0)[0-9]{10}$|^0[0-9]{3}-[0-9]{7}$/,
    'Enter a valid Pakistani phone number (e.g. 03001234567 or 0300-1234567).'
  )
  .optional()
  .or(z.literal(''))

const updateStudentSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters.').max(100),
  rollNo: z.string().max(20).optional().or(z.literal('')),
  phone: pkPhone,
  status: z.enum(['ACTIVE', 'INACTIVE', 'GRADUATED', 'EXPELLED', 'ON_LEAVE'], {
    errorMap: () => ({ message: 'Invalid status value.' }),
  }),
})

export async function updateStudent(studentId: string, formData: FormData) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Authentication required.' }

    // Validate student ID
    const idParsed = z.string().uuid('Invalid student ID.').safeParse(studentId)
    if (!idParsed.success) return { success: false, error: 'Invalid student ID.' }

    // Validate fields
    const parsed = updateStudentSchema.safeParse({
      fullName: formData.get('fullName'),
      rollNo: formData.get('rollNo'),
      phone: formData.get('phone'),
      status: formData.get('status'),
    })

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message
      return { success: false, error: firstError ?? 'Validation failed.' }
    }

    const { fullName, rollNo, phone, status } = parsed.data

    const { error } = await supabase
      .from('students')
      .update({
        student_name: fullName,
        roll_no: rollNo || null,
        phone: phone || null,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', idParsed.data)

    if (error) {
      console.error('[updateStudent] Supabase error:', error)
      return { success: false, error: 'Failed to update student. Please try again.' }
    }

    revalidatePath('/admin/students')
    revalidatePath(`/admin/students/${idParsed.data}`)
    return { success: true }
  } catch (err) {
    console.error('[updateStudent] Unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred.' }
  }
}

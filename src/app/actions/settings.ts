'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const pkPhone = z
  .string()
  .regex(
    /^(\+92|0)[0-9]{10}$|^0[0-9]{3}-[0-9]{7}$|^\+92-[0-9]{3}-[0-9]{7}$/,
    'Enter a valid Pakistani phone number.'
  )
  .optional()
  .or(z.literal(''))

const ibanRegex = /^PK[0-9]{2}[A-Z0-9]{20}$/

const settingsSchema = z.object({
  title: z
    .string()
    .min(2, 'School name must be at least 2 characters.')
    .max(200, 'School name is too long.'),
  email: z.string().email('Enter a valid email address.').optional().or(z.literal('')),
  whatsapp: pkPhone,
  bankName: z.string().max(100).optional().or(z.literal('')),
  iban: z
    .string()
    .regex(ibanRegex, 'IBAN must be in Pakistani format (e.g. PK36SCBL0000001123456702).')
    .optional()
    .or(z.literal('')),
})

export async function saveSchoolSettings(formData: FormData) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Authentication required.' }

    // Only SUPER_ADMIN may change school settings
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['ADMIN', 'SUPER_ADMIN'].includes(profile.role)) {
      return { success: false, error: 'Only Admin can change school settings.' }
    }

    const parsed = settingsSchema.safeParse({
      title: formData.get('title'),
      email: formData.get('email'),
      whatsapp: formData.get('whatsapp'),
      bankName: formData.get('bankName'),
      iban: formData.get('iban'),
    })

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message
      return { success: false, error: firstError ?? 'Validation failed.' }
    }

    const { title, email, whatsapp, bankName, iban } = parsed.data

    const { error } = await supabase.from('school_settings').upsert({
      id: 1,
      title,
      contact_email: email || null,
      whatsapp_helpline: whatsapp || null,
      bank_name: bankName || null,
      bank_iban: iban || null,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error('[saveSchoolSettings] Supabase error:', error)
      return { success: false, error: 'Failed to save settings. Please try again.' }
    }

    revalidatePath('/principal/settings')
    revalidatePath('/admin/settings')
    return { success: true }
  } catch (err) {
    console.error('[saveSchoolSettings] Unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred.' }
  }
}

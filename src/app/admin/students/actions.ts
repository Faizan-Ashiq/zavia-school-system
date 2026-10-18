'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { StudentAdmissionValues, SubmitResult } from '@/components/forms/StudentAdmissionForm'

function generateRegCode(session: string) {
  const yearPart = session.split('-')[0] ?? new Date().getFullYear().toString()
  const random = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `REG-${yearPart}-${random}`
}

export async function createStudentAction(
  values: StudentAdmissionValues,
  photo: File | null
): Promise<SubmitResult> {
  // Verify the caller is actually an admin before doing anything
  // privileged — this action uses the service-role client below, which
  // bypasses RLS, so this check is the only gate protecting it.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (callerProfile?.role !== 'ADMIN') {
    return { error: 'Only admins can admit students.' }
  }

  const admin = createAdminClient()
  const regCode = generateRegCode(values.session)

  // Photo upload (optional). Requires a 'student-photos' Storage bucket
  // to exist — see the note at the bottom of this file.
  let photoUrl: string | null = null
  if (photo) {
    const path = `${values.session}/${regCode}.jpg`
    const { error: uploadError } = await admin.storage
      .from('student-photos')
      .upload(path, photo, { contentType: photo.type, upsert: true })

    if (uploadError) {
      return { error: `Photo upload failed: ${uploadError.message}` }
    }

    const { data: publicUrl } = admin.storage.from('student-photos').getPublicUrl(path)
    photoUrl = publicUrl.publicUrl
  }

  // No auth account / profile is created here — the admission form
  // doesn't collect a login email, and `students.user_id` is nullable
  // for exactly this reason. Portal-login provisioning (creating the
  // auth user + profiles row) is a separate, deliberate action to add
  // to the student profile page later.
  const { error: insertError } = await admin.from('students').insert({
    session: values.session,
    reg_code: regCode,
    admission_no: values.admission_no,
    roll_no: values.roll_no || null,
    student_name: values.student_name,
    b_form: values.b_form || null,
    gender: values.gender,
    dob: values.dob,
    religion: values.religion,
    medium: values.medium,
    father_name: values.father_name,
    father_cnic: values.father_cnic,
    father_whatsapp: values.father_whatsapp,
    student_whatsapp: values.student_whatsapp || null,
    address_1: values.address_1,
    address_2: values.address_2 || null,
    class_id: values.class_id,
    section_id: values.section_id,
    fee_package: values.fee_package,
    discount_type: values.discount_type,
    discount_amount: values.discount_amount,
    photo_url: photoUrl,
    status: 'ACTIVE',
  })

  if (insertError) {
    if (insertError.code === '23505') {
      return { error: 'That admission number is already in use — please double-check and try again.' }
    }
    return { error: `Could not save the student: ${insertError.message}` }
  }

  revalidatePath('/admin/students')
  redirect('/admin/students')
}

import { provisionStudentAccount as provisionAccount, updateStudentAction as updateStudent } from './[id]/actions'

export async function provisionStudentAccount(studentId: string) {
  return provisionAccount(studentId)
}

export async function updateStudentAction(studentId: string, values: any) {
  return updateStudent(studentId, values)
}

// ---------------------------------------------------------------------
// Prerequisite: a 'student-photos' Storage bucket must exist in
// Supabase before this action can upload photos. Create it in the
// Supabase dashboard (Storage → New bucket → "student-photos", public
// read) or via SQL:
//
//   insert into storage.buckets (id, name, public)
//   values ('student-photos', 'student-photos', true);
//
// The upload above uses the service-role client, so it bypasses
// storage RLS regardless — but the bucket must still exist.
// ---------------------------------------------------------------------

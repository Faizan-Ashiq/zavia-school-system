'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function provisionStudentAccount(studentId: string) {
  const supabase = createAdminClient()

  // 1. Fetch the student
  const { data: student, error: fetchError } = await supabase
    .from('students')
    .select('user_id, admission_no, student_name')
    .eq('id', studentId)
    .single()

  if (fetchError || !student) {
    return { error: 'Student not found or database error.' }
  }

  if (student.user_id) {
    return { error: 'Student already has a provisioned account.' }
  }

  // 2. Create the user in Supabase Auth
  const sanitizedCode = (student.admission_no || 'student')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
  const safeLocal = sanitizedCode.length > 0 ? sanitizedCode : `student${studentId.slice(0, 6)}`
  const pseudoEmail = `${safeLocal}@school.internal`
  const defaultPassword = 'Student@123'

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: pseudoEmail,
    password: defaultPassword,
    email_confirm: true,
    user_metadata: {
      name: student.student_name,
    },
  })

  if (authError || !authData.user) {
    return { error: `Failed to create auth user: ${authError?.message}` }
  }

  const userId = authData.user.id

  // 3. Update the student record
  const { error: updateError } = await supabase
    .from('students')
    .update({ user_id: userId })
    .eq('id', studentId)

  if (updateError) {
    // Rollback auth user creation if linking fails
    await supabase.auth.admin.deleteUser(userId)
    return { error: `Failed to link user to student: ${updateError.message}` }
  }

  // 4. Upsert the profile
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ 
      id: userId, 
      role: 'STUDENT', 
      name: student.student_name, 
      email: pseudoEmail 
    })

  if (profileError) {
    return { error: `Failed to set profile role: ${profileError.message}` }
  }

  revalidatePath(`/admin/students/${studentId}`)
  
  return { success: true, email: pseudoEmail, password: defaultPassword }
}

export async function updateStudentAction(studentId: string, values: any) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('students')
    .update(values)
    .eq('id', studentId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/students/${studentId}`)
  revalidatePath('/admin/students')
  return { success: true }
}

export async function generateStudentChallanAction(studentId: string) {
  const { generateSingleStudentChallanAction } = await import('@/app/admin/fees/actions')
  return generateSingleStudentChallanAction(studentId)
}


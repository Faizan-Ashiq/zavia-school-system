'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

const leaveSchema = z.object({
  leaveType: z.string().min(1, 'Please select a leave type.'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD format.'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD format.'),
  reason: z
    .string()
    .min(3, 'Reason must be at least 3 characters.')
    .max(1000, 'Reason must not exceed 1000 characters.'),
})

export interface ProcessLeaveParams {
  userId: string
  leaveType: string
  startDate: string
  endDate: string
  reason: string
}

export async function processLeaveSubmission({
  userId,
  leaveType,
  startDate,
  endDate,
  reason,
}: ProcessLeaveParams) {
  const adminClient = createAdminClient()

  // 1. Calculate duration
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (end < start) {
    return { success: false, error: 'End date cannot be before start date.' }
  }

  const diffTime = Math.abs(end.getTime() - start.getTime())
  const totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1)
  const normalizedType = leaveType.toUpperCase()

  // 2. Resolve Staff ID
  const { data: staffMember } = await adminClient
    .from('staff')
    .select('id')
    .or(`user_id.eq.${userId},id.eq.${userId}`)
    .maybeSingle()

  const staffId = staffMember?.id ?? userId

  // 3. Robust insertion attempts
  const attempts: Array<() => Promise<any>> = [
    // Attempt A: standard staff_leaves with staffId + total_days + start_date
    async () =>
      await adminClient.from('staff_leaves').insert({
        staff_id: staffId,
        leave_type: normalizedType,
        start_date: startDate,
        end_date: endDate,
        total_days: totalDays,
        reason,
        status: 'PENDING',
      }).select(),

    // Attempt B: staff_leaves with userId as staff_id
    async () =>
      await adminClient.from('staff_leaves').insert({
        staff_id: userId,
        leave_type: normalizedType,
        start_date: startDate,
        end_date: endDate,
        total_days: totalDays,
        reason,
        status: 'PENDING',
      }).select(),

    // Attempt C: staff_leaves with from_date / to_date
    async () =>
      await adminClient.from('staff_leaves').insert({
        staff_id: staffId,
        leave_type: normalizedType,
        from_date: startDate,
        to_date: endDate,
        total_days: totalDays,
        reason,
        status: 'PENDING',
      }).select(),

    // Attempt D: staff_leaves with duration_days
    async () =>
      await adminClient.from('staff_leaves').insert({
        staff_id: staffId,
        leave_type: normalizedType,
        start_date: startDate,
        end_date: endDate,
        duration_days: totalDays,
        reason,
        status: 'PENDING',
      }).select(),

    // Attempt E: staff_leaves minimal
    async () =>
      await adminClient.from('staff_leaves').insert({
        staff_id: staffId,
        leave_type: normalizedType,
        start_date: startDate,
        end_date: endDate,
        reason,
        status: 'PENDING',
      }).select(),

    // Attempt F: fallback to 'leaves' table
    async () =>
      await adminClient.from('leaves').insert({
        staff_id: staffId,
        user_id: userId,
        leave_type: normalizedType,
        start_date: startDate,
        end_date: endDate,
        total_days: totalDays,
        reason,
        status: 'PENDING',
      }).select(),

    // Attempt G: fallback to 'leaves' with from_date/to_date
    async () =>
      await adminClient.from('leaves').insert({
        user_id: userId,
        leave_type: normalizedType,
        from_date: startDate,
        to_date: endDate,
        reason,
        status: 'PENDING',
      }).select(),
  ]

  let lastError: any = null
  let insertedData: any = null

  for (const attempt of attempts) {
    try {
      const res = await attempt()
      if (!res.error) {
        insertedData = res.data
        lastError = null
        break
      } else {
        lastError = res.error
      }
    } catch (e) {
      lastError = e
    }
  }

  if (lastError && !insertedData) {
    console.error('[processLeaveSubmission] All insert attempts failed:', lastError)
    return {
      success: false,
      error: lastError?.message || 'Failed to submit leave application. Please try again.',
    }
  }

  // Revalidate caches
  try {
    revalidatePath('/staff/leaves')
    revalidatePath('/principal/staff')
    revalidatePath('/principal/dashboard')
    revalidatePath('/admin/staff/leaves')
    revalidatePath('/admin/dashboard')
  } catch {
    // Non-fatal if outside request context
  }

  return {
    success: true,
    data: insertedData,
    message: 'Leave application submitted successfully. Forwarded to Principal office.',
  }
}

export async function submitLeaveApplication(formData: FormData) {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'You must be signed in to submit a leave application.' }
    }

    // Parse input fields with multiple name aliases (startDate / from_date, endDate / to_date)
    const leaveType = (formData.get('leaveType') || formData.get('leave_type') || 'CASUAL').toString()
    const startDate = (formData.get('startDate') || formData.get('from_date') || formData.get('start_date') || '').toString()
    const endDate = (formData.get('endDate') || formData.get('to_date') || formData.get('end_date') || '').toString()
    const reason = (formData.get('reason') || formData.get('description') || '').toString()

    const parsed = leaveSchema.safeParse({
      leaveType,
      startDate,
      endDate,
      reason,
    })

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message
      return { success: false, error: firstError ?? 'Validation failed. Please check form fields.' }
    }

    return await processLeaveSubmission({
      userId: user.id,
      leaveType: parsed.data.leaveType,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      reason: parsed.data.reason,
    })
  } catch (err: any) {
    console.error('[submitLeaveApplication] Error:', err)
    return {
      success: false,
      error: err?.message || 'An unexpected error occurred. Please try again.',
    }
  }
}

// ── Leave approval (Principal / Admin only) ──────────────────────────────────

const approvalSchema = z.object({
  leaveId: z.string().min(1, 'Invalid leave ID.'),
  status: z.enum(['APPROVED', 'REJECTED']),
})

export async function updateLeaveStatusAction(leaveId: string, status: 'APPROVED' | 'REJECTED') {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required.' }
    }

    // Verify caller has approval rights
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const roleUpper = profile?.role?.toUpperCase() ?? ''
    if (!profile || !['ADMIN', 'SUPER_ADMIN'].includes(roleUpper)) {
      return { success: false, error: 'Only Admin or Super Admin can approve leaves.' }
    }

    const parsed = approvalSchema.safeParse({ leaveId, status })
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? 'Validation failed.' }
    }

    const adminClient = createAdminClient()
    let { error } = await adminClient
      .from('staff_leaves')
      .update({ status: parsed.data.status })
      .eq('id', parsed.data.leaveId)

    if (error) {
      // Fallback to leaves table if staff_leaves failed
      const fallback = await adminClient
        .from('leaves')
        .update({ status: parsed.data.status })
        .eq('id', parsed.data.leaveId)
      error = fallback.error
    }

    if (error) {
      console.error('[updateLeaveStatusAction] Supabase error:', error)
      return { success: false, error: 'Failed to update leave status.' }
    }

    revalidatePath('/staff/leaves')
    revalidatePath('/principal/staff')
    revalidatePath('/principal/dashboard')
    revalidatePath('/admin/staff/leaves')
    revalidatePath('/admin/dashboard')

    return { success: true, message: `Leave status marked as ${parsed.data.status}.` }
  } catch (err: any) {
    console.error('[updateLeaveStatusAction] Unexpected error:', err)
    return { success: false, error: err?.message || 'An unexpected error occurred.' }
  }
}

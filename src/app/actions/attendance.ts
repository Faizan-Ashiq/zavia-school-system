'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ── Schemas ──────────────────────────────────────────────────────────────────

const attendanceRecordSchema = z.object({
  student_id: z.string().uuid('Invalid student ID.'),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'], {
    errorMap: () => ({ message: 'Status must be PRESENT, ABSENT, LATE, or EXCUSED.' }),
  }),
  remarks: z.string().max(500).optional().nullable(),
})

const markAttendanceSchema = z.object({
  class_id: z.string().uuid('Invalid class ID.'),
  section_id: z.string().uuid('Invalid section ID.').optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format.'),
  records: z.array(attendanceRecordSchema).min(1, 'At least one attendance record is required.'),
})

// ── Actions ───────────────────────────────────────────────────────────────────

/**
 * Bulk upsert attendance for a class on a given date.
 * Uses upsert so re-submitting the same date updates existing rows.
 */
export async function markAttendanceAction(payload: {
  class_id: string
  section_id?: string | null
  date: string
  records: { student_id: string; status: string; remarks?: string | null }[]
}) {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required.' }
    }

    // Validate
    const parsed = markAttendanceSchema.safeParse(payload)
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message
      return { success: false, error: firstError ?? 'Validation failed.' }
    }

    const { class_id, section_id, date, records } = parsed.data

    // Build rows
    const rows = records.map((r) => ({
      student_id: r.student_id,
      class_id,
      section_id: section_id ?? null,
      date,
      status: r.status,
      remarks: r.remarks ?? null,
      marked_by: user.id,
    }))

    // Upsert — conflict target depends on your DB unique constraint.
    // Expected: UNIQUE(student_id, date)
    const { error } = await supabase.from('attendance').upsert(rows, {
      onConflict: 'student_id,date',
    })

    if (error) {
      console.error('[markAttendanceAction] Supabase error:', error)
      return { success: false, error: 'Failed to save attendance. Please try again.' }
    }

    revalidatePath('/staff/my-classes')
    revalidatePath('/admin/students')
    revalidatePath(`/principal/students`)

    return { success: true, count: rows.length }
  } catch (err) {
    console.error('[markAttendanceAction] Unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred.' }
  }
}

/**
 * Update a single student's attendance record (e.g. corrections).
 */
const updateAttendanceSchema = z.object({
  attendanceId: z.string().uuid('Invalid attendance record ID.'),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
  remarks: z.string().max(500).optional().nullable(),
})

export async function updateAttendanceRecordAction(
  attendanceId: string,
  status: string,
  remarks?: string | null
) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required.' }
    }

    const parsed = updateAttendanceSchema.safeParse({ attendanceId, status, remarks })
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? 'Validation failed.' }
    }

    const { error } = await supabase
      .from('attendance')
      .update({
        status: parsed.data.status,
        remarks: parsed.data.remarks ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', parsed.data.attendanceId)

    if (error) {
      console.error('[updateAttendanceRecordAction] Supabase error:', error)
      return { success: false, error: 'Failed to update attendance record.' }
    }

    revalidatePath('/staff/my-classes')
    return { success: true }
  } catch (err) {
    console.error('[updateAttendanceRecordAction] Unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred.' }
  }
}

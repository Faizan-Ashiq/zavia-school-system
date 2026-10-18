'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

function computeGrade(obtained: number, max: number): string {
  const pct = max > 0 ? (obtained / max) * 100 : 0
  if (pct >= 90) return 'A+'
  if (pct >= 80) return 'A'
  if (pct >= 70) return 'B'
  if (pct >= 60) return 'C'
  if (pct >= 50) return 'D'
  return 'F'
}

export interface SaveMarksPayload {
  exam_id?: string | null
  subject: string
  term: string
  max_marks: number
  class_id: string
  section_id?: string | null
  is_published?: boolean
  entries: {
    student_id: string
    obtained_marks: number
    remarks?: string | null
    grade?: string
    is_passed?: boolean
  }[]
}

/**
 * Bulk upsert/save exam results for a class.
 */
export async function saveMarksAction(payload: SaveMarksPayload) {
  try {
    const admin = createAdminClient()

    const { subject, term, max_marks, entries, is_published = false } = payload

    if (!entries || entries.length === 0) {
      return { success: false, error: 'No marks entries provided to save.' }
    }

    // Process each student entry
    const insertRows = entries.map((e) => {
      const grade = e.grade || computeGrade(e.obtained_marks, max_marks)
      const isPassed = e.is_passed ?? e.obtained_marks >= max_marks * 0.33
      const structuredRemarks = e.remarks
        ? `${e.remarks} | Subject: ${subject} | Term: ${term} | Grade: ${grade}`
        : `Subject: ${subject} | Term: ${term} | Grade: ${grade} | Status: ${isPassed ? 'Passed' : 'Needs Improvement'}`

      return {
        student_id: e.student_id,
        obtained_marks: Number(e.obtained_marks) || 0,
        total_marks: Number(max_marks) || 100,
        remarks: structuredRemarks,
        is_published: Boolean(is_published),
      }
    })

    // Insert new / updated rows
    const { error } = await admin.from('exam_results').insert(insertRows)

    if (error) {
      console.warn('[saveMarksAction] notice:', error.message)
      return { success: false, error: error.message }
    }

    revalidatePath('/staff/marks-entry')
    revalidatePath('/admin/results')
    revalidatePath('/principal/results')
    revalidatePath('/student/results')

    return { success: true, count: insertRows.length }
  } catch (err: any) {
    console.error('[saveMarksAction] Error:', err)
    return { success: false, error: err?.message || 'Failed to save marks.' }
  }
}

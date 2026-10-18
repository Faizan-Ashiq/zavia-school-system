'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export interface SaveAdminResultsPayload {
  classId?: string
  className: string
  sectionName?: string
  subject: string
  term: string
  maxMarks?: number
  isPublished?: boolean
  entries: {
    studentId: string
    obtainedMarks: number
    grade: string
    isPassed: boolean
    remarks?: string
  }[]
}

/**
 * Persists edited marks and grades to exam_results table.
 */
export async function saveAdminResultsAction(payload: SaveAdminResultsPayload) {
  const admin = createAdminClient()

  try {
    const { subject, term, maxMarks = 100, isPublished = false, entries, className } = payload

    if (!entries || entries.length === 0) {
      return { success: false, error: 'No student marks provided.' }
    }

    const rows = entries.map((entry) => ({
      student_id: entry.studentId,
      obtained_marks: Math.max(0, Math.min(maxMarks, Number(entry.obtainedMarks) || 0)),
      total_marks: Number(maxMarks) || 100,
      remarks: `Class: ${className} | Subject: ${subject} | Term: ${term} | Grade: ${entry.grade} | Status: ${
        entry.isPassed ? 'Passed' : 'Needs Improvement'
      }${entry.remarks ? ` | Note: ${entry.remarks}` : ''}`,
      is_published: Boolean(isPublished),
    }))

    const { error } = await admin.from('exam_results').insert(rows)

    if (error) {
      console.warn('[saveAdminResultsAction] Error inserting into exam_results:', error.message)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/results')
    revalidatePath('/principal/results')
    revalidatePath('/student/results')
    revalidatePath('/staff/marks-entry')

    return {
      success: true,
      count: rows.length,
      isPublished: Boolean(isPublished),
    }
  } catch (err: any) {
    console.error('[saveAdminResultsAction] Exception:', err)
    return { success: false, error: err?.message || 'Failed to persist results.' }
  }
}

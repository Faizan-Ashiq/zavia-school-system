'use client'

import StaffAssignmentsPage from '@/app/staff/assignments/page'

/**
 * Teacher Portal Homework Listing Page (Data Isolated)
 * Allows teachers to manage and publish their homework deliverables.
 * Enforces teacher_id filtering so teachers strictly view and delete their own uploads.
 */
export default function TeacherHomeworkPage() {
  return <StaffAssignmentsPage />
}

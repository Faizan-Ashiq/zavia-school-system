'use client'

import { useState, useTransition } from 'react'
import {
  ClipboardList,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { saveMarksAction } from '@/app/actions/marks'

interface StudentRow {
  id: string
  student_name: string
  admission_no: string | null
  roll_no: string | null
  class_id: string
  section_id: string | null
}

interface ClassItem {
  id: string
  class_name: string
  section_id: string | null
}

interface Props {
  classes: ClassItem[]
  initialStudents: StudentRow[]
  defaultClassId: string | null
  staffId: string
}

interface MarkEntry {
  student_id: string
  obtained_marks: number
  remarks: string
}

type ToastState = { type: 'success' | 'error'; message: string } | null

function computeGrade(obtained: number, max: number): string {
  const pct = max > 0 ? (obtained / max) * 100 : 0
  if (pct >= 90) return 'A+'
  if (pct >= 80) return 'A'
  if (pct >= 70) return 'B'
  if (pct >= 60) return 'C'
  if (pct >= 50) return 'D'
  return 'F'
}

export function MarksEntryForm({ classes, initialStudents, defaultClassId, staffId }: Props) {
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<ToastState>(null)

  const [selectedClassId, setSelectedClassId] = useState(defaultClassId ?? '')
  const [subject, setSubject] = useState('Mathematics')
  const [term, setTerm] = useState('Mid-Term 2026')
  const [maxMarks, setMaxMarks] = useState(100)

  // Marks state: map of student_id → entry
  const [entries, setEntries] = useState<Record<string, MarkEntry>>(() => {
    const init: Record<string, MarkEntry> = {}
    initialStudents.forEach((s) => {
      init[s.id] = { student_id: s.id, obtained_marks: 0, remarks: '' }
    })
    return init
  })

  const [students] = useState<StudentRow[]>(initialStudents)

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4500)
  }

  function updateMark(studentId: string, marks: number) {
    setEntries((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], student_id: studentId, obtained_marks: marks },
    }))
  }

  function updateRemarks(studentId: string, remarks: string) {
    setEntries((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], student_id: studentId, remarks },
    }))
  }

  function handleSaveAll() {
    const entryList = Object.values(entries)
    if (entryList.length === 0) {
      showToast('error', 'No student entries to save.')
      return
    }

    const selectedClass = classes.find((c) => c.id === selectedClassId)

    startTransition(async () => {
      const result = await saveMarksAction({
        subject,
        term,
        max_marks: maxMarks,
        class_id: selectedClassId,
        section_id: selectedClass?.section_id ?? null,
        entries: entryList.map((e) => ({
          student_id: e.student_id,
          obtained_marks: e.obtained_marks,
          remarks: e.remarks || null,
        })),
      })

      if (result.success) {
        showToast('success', `Marks saved for ${result.count} students.`)
      } else {
        showToast('error', result.error || 'Failed to save marks.')
      }
    })
  }

  const selectedClass = classes.find((c) => c.id === selectedClassId)

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium ${
            toast.type === 'success'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
              : 'border-destructive/30 bg-destructive/10 text-destructive'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      {/* Controls Bar */}
      <Card className="shadow-xs">
        <CardContent className="p-4 flex flex-wrap items-center gap-4 text-xs">
          {/* Class selector */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-muted-foreground uppercase text-[11px]">Class:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-2 py-1 text-xs border rounded-md bg-background focus:ring-2 focus:ring-primary focus:outline-none"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.class_name}
                </option>
              ))}
              {classes.length === 0 && <option value="">No classes available</option>}
            </select>
          </div>

          {/* Subject */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-muted-foreground uppercase text-[11px]">Subject:</span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="px-2 py-1 text-xs border rounded-md bg-background focus:ring-2 focus:ring-primary focus:outline-none w-40"
            />
          </div>

          {/* Term */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-muted-foreground uppercase text-[11px]">Term:</span>
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="px-2 py-1 text-xs border rounded-md bg-background focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option>Mid-Term 2026</option>
              <option>Final Term 2026</option>
              <option>Annual Exam 2026</option>
            </select>
          </div>

          {/* Max Marks */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-muted-foreground uppercase text-[11px]">Max Marks:</span>
            <input
              type="number"
              value={maxMarks}
              min={1}
              max={10000}
              onChange={(e) => setMaxMarks(Number(e.target.value))}
              className="w-20 px-2 py-1 text-xs border rounded-md bg-background focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <div className="ml-auto">
            <Button
              onClick={handleSaveAll}
              disabled={isPending || students.length === 0}
              size="sm"
              className="inline-flex items-center gap-1.5 shadow-xs"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isPending ? 'Saving…' : 'Save & Publish Marks'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Marks Entry Table */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" />
                Student Examination Scores
              </CardTitle>
              <CardDescription>
                Max Marks: {maxMarks} · Passing Marks: {Math.ceil(maxMarks * 0.33)}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
              {term}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {students.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">
              No active students found for the selected class.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/60 text-muted-foreground border-y">
                  <tr>
                    <th className="py-3 px-4 w-16">Roll</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Admission No</th>
                    <th className="py-3 px-4 w-36">Obtained Marks</th>
                    <th className="py-3 px-4 text-center">Grade</th>
                    <th className="py-3 px-4">Remarks / Feedback</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students.map((student) => {
                    const entry = entries[student.id] ?? {
                      student_id: student.id,
                      obtained_marks: 0,
                      remarks: '',
                    }
                    const grade = computeGrade(entry.obtained_marks, maxMarks)
                    const isPassing = entry.obtained_marks >= maxMarks * 0.33

                    return (
                      <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-foreground">
                          {student.roll_no ?? '—'}
                        </td>
                        <td className="py-3 px-4 font-medium text-foreground">
                          {student.student_name}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                          {student.admission_no ?? '—'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={0}
                              max={maxMarks}
                              value={entry.obtained_marks}
                              onChange={(e) => updateMark(student.id, Number(e.target.value))}
                              className="w-16 px-2 py-1 text-sm font-bold font-mono border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <span className="text-xs text-muted-foreground">/ {maxMarks}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            variant="outline"
                            className="font-bold text-xs border-primary/30 text-primary"
                          >
                            {grade}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={entry.remarks}
                            maxLength={500}
                            onChange={(e) => updateRemarks(student.id, e.target.value)}
                            placeholder="Optional feedback…"
                            className="w-full px-2 py-1 text-xs border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium ${
                              isPassing ? 'text-emerald-600' : 'text-destructive'
                            }`}
                          >
                            {isPassing ? (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5" /> Pass
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-3.5 w-3.5" /> Fail
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

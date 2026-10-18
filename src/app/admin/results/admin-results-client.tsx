'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  GraduationCap,
  Save,
  Send,
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Loader2,
  PlusCircle,
  Layers,
  ArrowRight,
  BookOpen,
} from 'lucide-react'
import { saveAdminResultsAction } from './actions'
import {
  getSubjectsForClass,
  DynamicClass,
  DynamicSubject,
} from '@/lib/services/class-subject-service'

const STANDARD_SECTIONS = [
  'All Sections',
  'Section A',
  'Section B',
  'Section C',
  'Section D',
]

const STANDARD_TERMS = [
  'Mid-Term Examination 2026',
  'Final Term Examination 2026',
  '1st Monthly Assessment',
  '2nd Monthly Assessment',
  'Send-Up / Pre-Board Examination',
]

export interface StudentRecord {
  id: string
  name: string
  rollNo: string
  admissionNo: string
  classId: string
  className: string
  sectionId: string
  sectionName: string
}

export interface ExamResultRecord {
  id: string
  studentId: string
  obtainedMarks: number
  totalMarks: number
  remarks: string
  isPublished: boolean
  createdAt?: string
}

interface Props {
  classes: DynamicClass[]
  initialStudents: StudentRecord[]
  initialResults: ExamResultRecord[]
  dbSubjects?: DynamicSubject[]
}

function computeGrade(obtained: number, max: number = 100): string {
  const pct = max > 0 ? (obtained / max) * 100 : 0
  if (pct >= 90) return 'A+'
  if (pct >= 80) return 'A'
  if (pct >= 70) return 'B'
  if (pct >= 60) return 'C'
  if (pct >= 50) return 'D'
  return 'F'
}

interface EditableStudentRow {
  studentId: string
  rollNo: string
  name: string
  admissionNo: string
  className: string
  sectionName: string
  marks: number
  maxMarks: number
  grade: string
  isPassed: boolean
  remarks: string
  isPublished: boolean
  isDirty?: boolean
}

export function AdminResultsClient({
  classes,
  initialStudents,
  initialResults,
  dbSubjects = [],
}: Props) {
  // Filter States
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id ?? '')
  const [selectedSection, setSelectedSection] = useState<string>('All Sections')
  const [term, setTerm] = useState<string>('Mid-Term Examination 2026')
  const [subject, setSubject] = useState<string>('Mathematics')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Toast & Loading States
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [saving, setSaving] = useState<boolean>(false)

  // Local Editable Marks State Map: studentId -> EditableStudentRow
  const [marksState, setMarksState] = useState<Record<string, EditableStudentRow>>({})

  // Find currently selected class object
  const selectedClassObj = useMemo(() => {
    return classes.find((c) => c.id === selectedClassId || c.name === selectedClassId) || classes[0]
  }, [classes, selectedClassId])

  const selectedClassName = selectedClassObj?.name || 'Class 7'

  // Dynamic Subjects based on selected class
  const availableSubjects = useMemo(() => {
    return getSubjectsForClass(selectedClassName, dbSubjects)
  }, [selectedClassName, dbSubjects])

  // When class changes, adjust subject if current subject is not in list
  useEffect(() => {
    if (availableSubjects.length > 0 && !availableSubjects.includes(subject)) {
      setSubject(availableSubjects[0])
    }
  }, [availableSubjects, subject])

  // Initialize or re-populate marks state when filters or students change
  useEffect(() => {
    const nextState: Record<string, EditableStudentRow> = {}

    initialStudents.forEach((st) => {
      // Find matching existing result if any
      const existing = initialResults.find((r) => r.studentId === st.id)
      const obtained = existing ? existing.obtainedMarks : 0
      const total = existing ? existing.totalMarks : 100
      const grade = existing ? computeGrade(obtained, total) : computeGrade(obtained, 100)

      nextState[st.id] = {
        studentId: st.id,
        rollNo: st.rollNo,
        name: st.name,
        admissionNo: st.admissionNo,
        className: st.className,
        sectionName: st.sectionName,
        marks: obtained,
        maxMarks: total,
        grade,
        isPassed: obtained >= total * 0.33,
        remarks: existing?.remarks || '',
        isPublished: existing?.isPublished ?? false,
        isDirty: false,
      }
    })

    setMarksState(nextState)
  }, [initialStudents, initialResults])

  function showToast(text: string, type: 'success' | 'error' = 'success') {
    setToast({ text, type })
    setTimeout(() => {
      setToast(null)
    }, 4000)
  }

  // Filter students matching selected Class, Section, and Search query
  const filteredStudents = useMemo(() => {
    return initialStudents.filter((st) => {
      // Class matching (by ID or by name)
      const matchesClass =
        st.classId === selectedClassObj?.id ||
        st.className.toLowerCase().trim() === selectedClassName.toLowerCase().trim()

      // Section matching
      const matchesSection =
        selectedSection === 'All Sections' ||
        st.sectionName.toLowerCase().trim() === selectedSection.toLowerCase().trim()

      // Search matching
      const matchesSearch =
        !searchQuery ||
        st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.admissionNo.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesClass && matchesSection && matchesSearch
    })
  }, [initialStudents, selectedClassObj, selectedClassName, selectedSection, searchQuery])

  // Handle live marks edit
  function handleMarksChange(studentId: string, valueStr: string) {
    const num = Math.max(0, Math.min(100, isNaN(Number(valueStr)) ? 0 : Number(valueStr)))
    setMarksState((prev) => {
      const current = prev[studentId]
      if (!current) return prev
      const maxM = current.maxMarks || 100
      const newGrade = computeGrade(num, maxM)
      return {
        ...prev,
        [studentId]: {
          ...current,
          marks: num,
          grade: newGrade,
          isPassed: num >= maxM * 0.33,
          isDirty: true,
        },
      }
    })
  }

  // Handle custom grade override
  function handleGradeChange(studentId: string, newGrade: string) {
    setMarksState((prev) => {
      const current = prev[studentId]
      if (!current) return prev
      return {
        ...prev,
        [studentId]: {
          ...current,
          grade: newGrade,
          isPassed: newGrade !== 'F',
          isDirty: true,
        },
      }
    })
  }

  // Handle remarks change
  function handleRemarksChange(studentId: string, remarksVal: string) {
    setMarksState((prev) => {
      const current = prev[studentId]
      if (!current) return prev
      return {
        ...prev,
        [studentId]: {
          ...current,
          remarks: remarksVal,
          isDirty: true,
        },
      }
    })
  }

  // Save / Publish Action
  async function handleBatchSave(publishMode: boolean) {
    if (filteredStudents.length === 0) {
      showToast('No students in this class/section to save.', 'error')
      return
    }

    setSaving(true)
    try {
      const entriesToSave = filteredStudents.map((st) => {
        const row = marksState[st.id] || {
          studentId: st.id,
          marks: 0,
          maxMarks: 100,
          grade: 'F',
          isPassed: false,
          remarks: '',
        }

        return {
          studentId: st.id,
          obtainedMarks: row.marks,
          grade: row.grade,
          isPassed: row.isPassed,
          remarks: row.remarks,
        }
      })

      const res = await saveAdminResultsAction({
        classId: selectedClassObj?.id,
        className: selectedClassName,
        sectionName: selectedSection,
        subject,
        term,
        maxMarks: 100,
        isPublished: publishMode,
        entries: entriesToSave,
      })

      if (res.success) {
        // Mark rows as saved and updated publication status
        setMarksState((prev) => {
          const next = { ...prev }
          filteredStudents.forEach((st) => {
            if (next[st.id]) {
              next[st.id] = {
                ...next[st.id],
                isPublished: publishMode,
                isDirty: false,
              }
            }
          })
          return next
        })

        showToast(
          publishMode
            ? `🎉 Successfully published ${entriesToSave.length} results for ${selectedClassName} (${subject})!`
            : `✅ Draft scores for ${entriesToSave.length} students saved to database.`
        )
      } else {
        showToast(res.error || 'Failed to save results', 'error')
      }
    } catch (err: any) {
      console.error('Error saving admin results:', err)
      showToast(err?.message || 'Failed to save results', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Quick Single Student Save
  async function handleSingleSave(studentId: string) {
    const row = marksState[studentId]
    if (!row) return

    setSaving(true)
    try {
      const res = await saveAdminResultsAction({
        classId: selectedClassObj?.id,
        className: selectedClassName,
        sectionName: selectedSection,
        subject,
        term,
        maxMarks: 100,
        isPublished: row.isPublished,
        entries: [
          {
            studentId,
            obtainedMarks: row.marks,
            grade: row.grade,
            isPassed: row.isPassed,
            remarks: row.remarks,
          },
        ],
      })

      if (res.success) {
        setMarksState((prev) => ({
          ...prev,
          [studentId]: {
            ...prev[studentId],
            isDirty: false,
          },
        }))
        showToast(`Score saved for ${row.name}`)
      } else {
        showToast(res.error || 'Error saving score', 'error')
      }
    } catch (err: any) {
      showToast(err?.message || 'Error saving score', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Class analytics summary
  const stats = useMemo(() => {
    if (filteredStudents.length === 0) return { total: 0, passed: 0, avgPct: '0%' }
    let totalMarks = 0
    let passedCount = 0

    filteredStudents.forEach((st) => {
      const row = marksState[st.id]
      if (row) {
        totalMarks += row.marks
        if (row.isPassed) passedCount++
      }
    })

    const avg = totalMarks / filteredStudents.length
    return {
      total: filteredStudents.length,
      passed: passedCount,
      avgPct: `${avg.toFixed(1)}%`,
    }
  }, [filteredStudents, marksState])

  return (
    <div className="relative z-10 pointer-events-auto p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Feedback */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[999999] px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold border animate-in fade-in slide-in-from-top-2 flex items-center gap-2 ${
            toast.type === 'success'
              ? 'bg-neutral-900 text-white border-neutral-700'
              : 'bg-red-900 text-white border-red-700'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-neutral-900">
              Examination Results &amp; Marks Entry
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              Campus Admin
            </span>
          </div>
          <p className="text-sm text-neutral-500 mt-1">
            Dynamic result management and scorecard publishing for all school classes (Nursery through Class 10 &amp; Intermediate)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleBatchSave(false)}
            disabled={saving || filteredStudents.length === 0}
            className="cursor-pointer bg-neutral-100 hover:bg-neutral-200 disabled:opacity-50 text-neutral-800 px-4 py-2.5 rounded-xl font-semibold text-sm transition shadow-xs border border-neutral-300 inline-flex items-center gap-2"
          >
            <Save className="h-4 w-4 text-neutral-600" />
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleBatchSave(true)}
            disabled={saving || filteredStudents.length === 0}
            className="cursor-pointer bg-neutral-950 hover:bg-neutral-800 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition shadow-xs inline-flex items-center gap-2 active:scale-95"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {saving ? 'Saving...' : 'Publish Term Results'}
          </button>
        </div>
      </div>

      {/* 100% DYNAMIC FILTER CONTROLS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
        {/* 1. DYNAMIC CLASS SELECTOR */}
        <div>
          <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
            Class (Dynamic)
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full border border-neutral-300 rounded-lg p-2.5 text-sm bg-neutral-50 cursor-pointer outline-none focus:ring-2 focus:ring-black font-semibold text-neutral-900"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* 2. DYNAMIC SECTION SELECTOR */}
        <div>
          <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
            Section
          </label>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="w-full border border-neutral-300 rounded-lg p-2.5 text-sm bg-neutral-50 cursor-pointer outline-none focus:ring-2 focus:ring-black font-semibold text-neutral-900"
          >
            {STANDARD_SECTIONS.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>
        </div>

        {/* 3. DYNAMIC SUBJECT SELECTOR */}
        <div>
          <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
            Subject
          </label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full border border-neutral-300 rounded-lg p-2.5 text-sm bg-neutral-50 cursor-pointer outline-none focus:ring-2 focus:ring-black font-semibold text-neutral-900 uppercase"
          >
            {availableSubjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
            {availableSubjects.length === 0 && <option value="General">General</option>}
          </select>
        </div>

        {/* 4. EXAMINATION TERM */}
        <div>
          <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
            Examination Term
          </label>
          <select
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="w-full border border-neutral-300 rounded-lg p-2.5 text-sm bg-neutral-50 cursor-pointer outline-none focus:ring-2 focus:ring-black font-semibold text-neutral-900"
          >
            {STANDARD_TERMS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Search & Summary Stats Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-neutral-100/70 p-3.5 rounded-xl border border-neutral-200 text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 font-bold text-neutral-800">
            <Layers className="h-4 w-4 text-neutral-500" />
            <span>
              {selectedClassName} · {selectedSection}
            </span>
          </div>
          <span className="text-neutral-400">|</span>
          <div className="text-neutral-600">
            Enrolled Students: <strong className="text-neutral-900">{stats.total}</strong>
          </div>
          <div className="text-neutral-600">
            Passing: <strong className="text-emerald-700">{stats.passed}</strong> / {stats.total}
          </div>
          <div className="text-neutral-600">
            Class Average: <strong className="text-primary">{stats.avgPct}</strong>
          </div>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search student or roll no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-black"
          />
        </div>
      </div>

      {/* MARKSHEET TABLE OR EMPTY STATE */}
      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
        {filteredStudents.length === 0 ? (
          <div className="p-16 text-center">
            <div className="h-12 w-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto mb-3">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-neutral-800">
              No students found for {selectedClassName} - {selectedSection}
            </h3>
            <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1 mb-5">
              There are currently no active students enrolled in this class and section. You can admit or assign students from the Admissions Registry.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/admin/students/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-black text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 transition cursor-pointer shadow-xs"
              >
                <PlusCircle className="h-4 w-4" />
                Admit Student to {selectedClassName}
              </Link>
              <Link
                href="/admin/students"
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-neutral-300 bg-white text-neutral-700 text-xs font-semibold rounded-lg hover:bg-neutral-50 transition cursor-pointer"
              >
                View Student Registry
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-100/80 text-xs font-bold text-neutral-700 border-b border-neutral-200 uppercase tracking-wide">
                <tr>
                  <th className="p-3.5 pl-5">Roll No</th>
                  <th className="p-3.5">Student Name</th>
                  <th className="p-3.5">Admission No</th>
                  <th className="p-3.5">Section</th>
                  <th className="p-3.5 w-36">Obtained Marks (100)</th>
                  <th className="p-3.5 text-center w-28">Grade</th>
                  <th className="p-3.5 text-center w-32">Status</th>
                  <th className="p-3.5">Remarks</th>
                  <th className="p-3.5 pr-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-xs">
                {filteredStudents.map((student) => {
                  const row = marksState[student.id] || {
                    studentId: student.id,
                    marks: 0,
                    maxMarks: 100,
                    grade: 'F',
                    isPassed: false,
                    remarks: '',
                    isPublished: false,
                  }

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-neutral-50/80 transition ${
                        row.isDirty ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      {/* Roll No */}
                      <td className="p-3.5 pl-5 font-mono font-bold text-neutral-800">
                        {student.rollNo}
                      </td>

                      {/* Student Name */}
                      <td className="p-3.5">
                        <div className="font-semibold text-neutral-900">{student.name}</div>
                      </td>

                      {/* Admission No */}
                      <td className="p-3.5 font-mono text-neutral-500 text-[11px]">
                        {student.admissionNo}
                      </td>

                      {/* Section */}
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 font-medium text-[11px]">
                          {student.sectionName}
                        </span>
                      </td>

                      {/* Marks Input */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={row.marks}
                            onChange={(e) => handleMarksChange(student.id, e.target.value)}
                            className="w-18 border border-neutral-300 rounded-lg p-1.5 text-center font-bold text-xs bg-white outline-none focus:ring-2 focus:ring-black"
                          />
                          <span className="text-neutral-400 text-[11px]">/ 100</span>
                        </div>
                      </td>

                      {/* Grade Selector / Badge */}
                      <td className="p-3.5 text-center">
                        <select
                          value={row.grade}
                          onChange={(e) => handleGradeChange(student.id, e.target.value)}
                          className="px-2 py-1 bg-white border border-neutral-300 rounded-md font-bold text-xs outline-none focus:ring-1 focus:ring-black cursor-pointer"
                        >
                          <option value="A+">A+</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                          <option value="F">F</option>
                        </select>
                      </td>

                      {/* Status Badge */}
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            row.isPassed
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-red-100 text-red-800 border border-red-300'
                          }`}
                        >
                          {row.isPassed ? 'PASSED' : 'NEEDS IMPROVEMENT'}
                        </span>
                      </td>

                      {/* Remarks Input */}
                      <td className="p-3.5">
                        <input
                          type="text"
                          placeholder="Optional remarks..."
                          value={row.remarks}
                          onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                          className="w-full border border-neutral-200 rounded-md p-1.5 text-xs bg-white outline-none focus:border-neutral-400"
                        />
                      </td>

                      {/* Action Button */}
                      <td className="p-3.5 pr-5 text-right">
                        <button
                          type="button"
                          onClick={() => handleSingleSave(student.id)}
                          disabled={saving}
                          className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white rounded-md text-[11px] font-semibold transition cursor-pointer"
                        >
                          Save
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

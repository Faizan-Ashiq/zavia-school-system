'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  Users,
  Printer,
  X,
  Check,
  Save,
  Loader2,
  GraduationCap,
  Plus,
  BookOpen,
  Filter,
  Trash2,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react'
import {
  getStaffHomeworkDataAction,
  createAssignmentAction,
  deleteAssignmentAction,
  UnifiedAssignment,
} from './actions'
import {
  getSubjectsForClass,
  DynamicClass,
  DynamicSubject,
} from '@/lib/services/class-subject-service'

export default function StaffAssignmentsPage() {
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState<DynamicClass[]>([])
  const [allClasses, setAllClasses] = useState<DynamicClass[]>([])
  const [dbSubjects, setDbSubjects] = useState<DynamicSubject[]>([])
  const [isTeacherAssigned, setIsTeacherAssigned] = useState(false)
  const [assignments, setAssignments] = useState<UnifiedAssignment[]>([])
  const [currentTeacher, setCurrentTeacher] = useState<{
    id: string | null
    name: string
    isFullVisibility: boolean
  } | null>(null)

  // Filter state for list
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEvaluateOpen, setIsEvaluateOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<UnifiedAssignment | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Form states for creating new assignment
  const [formClassId, setFormClassId] = useState('')
  const [formClassName, setFormClassName] = useState('')
  const [formSection, setFormSection] = useState('Section A')
  const [formSubject, setFormSubject] = useState('')
  const [isCustomSubject, setIsCustomSubject] = useState(false)
  const [customSubjectText, setCustomSubjectText] = useState('')
  const [formTitle, setFormTitle] = useState('')
  const [formDueDate, setFormDueDate] = useState('')
  const [formInstructions, setFormInstructions] = useState('')
  const [formMaterialType, setFormMaterialType] = useState<'Homework' | 'Worksheet' | 'Assignment'>('Homework')

  // Available subjects for the currently selected class in form
  const [currentAvailableSubjects, setCurrentAvailableSubjects] = useState<string[]>([])
  // Available sections for the currently selected class in form
  const [currentAvailableSections, setCurrentAvailableSections] = useState<string[]>([])

  // Set default due date (7 days from now)
  useEffect(() => {
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    setFormDueDate(nextWeek.toISOString().split('T')[0])
  }, [])

  // Load initial homework data from server
  useEffect(() => {
    let mounted = true
    async function loadData() {
      setLoading(true)
      try {
        const res = await getStaffHomeworkDataAction()
        if (mounted && res.success) {
          setClasses(res.classes || [])
          setAllClasses(res.allClasses || [])
          setDbSubjects(res.dbSubjects || [])
          setIsTeacherAssigned(res.isTeacherAssigned || false)
          setAssignments(res.assignments || [])
          setCurrentTeacher(res.currentTeacher || null)

          // Set initial default class for form
          if (res.classes && res.classes.length > 0) {
            const firstClass = res.classes[0]
            setFormClassId(firstClass.id)
            setFormClassName(firstClass.name)

            // Calculate subjects
            const subs = getSubjectsForClass(
              firstClass.name,
              res.dbSubjects,
              firstClass.assignedSubjects || []
            )
            setCurrentAvailableSubjects(subs)
            setFormSubject(subs[0] || 'Mathematics')

            // Calculate sections
            const secs =
              firstClass.sections && firstClass.sections.length > 0
                ? firstClass.sections.map((s) => s.name)
                : ['Section A', 'Section B']
            setCurrentAvailableSections(secs)
            setFormSection(secs[0] || 'Section A')
          }
        }
      } catch (err) {
        console.error('Failed to load homework data', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadData()
    return () => {
      mounted = false
    }
  }, [])

  // Whenever the selected class in form changes, dynamically recalculate subjects and sections
  function handleFormClassChange(newClassIdOrName: string) {
    const selectedCls =
      classes.find((c) => c.id === newClassIdOrName || c.name === newClassIdOrName) ||
      allClasses.find((c) => c.id === newClassIdOrName || c.name === newClassIdOrName)

    if (selectedCls) {
      setFormClassId(selectedCls.id)
      setFormClassName(selectedCls.name)

      // 1. Dynamic subjects for this class
      const subs = getSubjectsForClass(
        selectedCls.name,
        dbSubjects,
        selectedCls.assignedSubjects || []
      )
      setCurrentAvailableSubjects(subs)
      setFormSubject(subs[0] || 'Mathematics')
      setIsCustomSubject(false)
      setCustomSubjectText('')

      // 2. Dynamic sections for this class
      const secs =
        selectedCls.sections && selectedCls.sections.length > 0
          ? selectedCls.sections.map((s) => s.name)
          : ['Section A', 'Section B']
      setCurrentAvailableSections(secs)
      setFormSection(secs[0] || 'Section A')
    }
  }

  function showNotification(text: string, type: 'success' | 'error' = 'success') {
    setToastMsg({ text, type })
    setTimeout(() => {
      setToastMsg(null)
    }, 4000)
  }

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formTitle.trim()) {
      showNotification('Please enter an assignment title', 'error')
      return
    }

    const finalSubject = isCustomSubject
      ? customSubjectText.trim() || 'General'
      : formSubject.trim() || 'General'

    setIsSubmitting(true)
    try {
      const res = await createAssignmentAction({
        title: formTitle.trim(),
        subject: finalSubject,
        classId: formClassId,
        className: formClassName || 'Class 7',
        section: formSection || 'Section A',
        dueDate: formDueDate,
        instructions:
          formInstructions.trim() || 'Complete all exercises in homework notebook.',
        materialType: formMaterialType,
        teacherId: currentTeacher?.id || undefined,
        teacherName: currentTeacher?.name || undefined,
      })

      if (res.success && res.assignment) {
        setAssignments((prev) => [res.assignment!, ...prev])
        setIsCreateOpen(false)
        setFormTitle('')
        setFormInstructions('')
        setIsCustomSubject(false)
        setCustomSubjectText('')
        showNotification(`✅ Homework "${res.assignment.title}" published for ${formClassName}!`)
      } else {
        showNotification(res.error || 'Failed to publish assignment', 'error')
      }
    } catch (err: any) {
      console.error('Failed to create assignment', err)
      showNotification(err?.message || 'Error creating assignment', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Are you sure you want to remove "${title}"?`)) return

    try {
      const res = await deleteAssignmentAction(id)
      if (res.success) {
        setAssignments((prev) => prev.filter((a) => a.id !== id))
        showNotification('Homework removed successfully')
      } else {
        showNotification(res.error || 'Permission denied: Could not delete homework', 'error')
      }
    } catch (err: any) {
      console.error('Failed to delete assignment', err)
      showNotification(err?.message || 'Error deleting homework', 'error')
    }
  }

  // Filtered assignments
  const filteredAssignments = assignments.filter((item) => {
    const matchesClass =
      selectedClassFilter === 'ALL' ||
      item.class.toLowerCase().includes(selectedClassFilter.toLowerCase())
    const matchesSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.class.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesClass && matchesSearch
  })

  return (
    <div className="space-y-6 relative">
      {/* Header Bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              Homework &amp; Assignments Manager
            </h1>
            {currentTeacher?.name && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                Teacher: {currentTeacher.name}
              </span>
            )}
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <span>🔒</span> My Uploads Only
            </span>
            {isTeacherAssigned && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Assigned Classes
              </span>
            )}
          </div>
          <p className="text-sm text-neutral-500 mt-0.5">
            Publish syllabus worksheets, track submissions, and manage coursework for any class (e.g. Class 7, Class 8, Matric)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/staff/my-classes"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 transition shadow-xs"
          >
            <BookOpen className="h-4 w-4 text-neutral-500" />
            Class Rosters
          </Link>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="relative z-20 cursor-pointer bg-black hover:bg-neutral-800 text-white font-semibold px-4 py-2 rounded-lg text-sm shadow-sm transition inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            + Create New Assignment
          </button>
        </div>
      </div>

      {/* Success / Error Notification Banner */}
      {toastMsg && (
        <div
          className={`flex items-center gap-2 p-3.5 rounded-lg border text-xs font-semibold animate-in fade-in slide-in-from-top-2 ${
            toastMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-red-50 border-red-300 text-red-900'
          }`}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Filter and Class Selector Bar */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Dynamic Class Filter Dropdown */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="h-4 w-4 text-neutral-500 shrink-0" />
          <span className="text-xs font-bold text-neutral-700 uppercase tracking-wide">
            Filter by Class:
          </span>
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="text-xs font-semibold border rounded-lg px-3 py-1.5 bg-neutral-50 text-neutral-800 outline-none focus:ring-2 focus:ring-black cursor-pointer"
          >
            <option value="ALL">All Classes ({classes.length})</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.name}>
                {cls.name} {cls.isAssigned ? '★ (Assigned)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Search input */}
        <div className="w-full md:w-72">
          <input
            type="text"
            placeholder="Search topic, subject or class..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-black bg-neutral-50"
          />
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-neutral-200">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
          <span className="ml-2 text-sm text-neutral-500 font-medium">
            Loading dynamic class data &amp; deliverables...
          </span>
        </div>
      )}

      {/* Grid of Assignments */}
      {!loading && (
        <div className="grid grid-cols-1 gap-4">
          {filteredAssignments.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-dashed border-neutral-300">
              <BookOpen className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-neutral-800">
                No assignments found for {selectedClassFilter === 'ALL' ? 'selected criteria' : selectedClassFilter}
              </h3>
              <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1 mb-4">
                You can create a new dynamic homework deliverable or worksheet for any class (like Class 7, Class 8, or Matric) using the button below.
              </p>
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-black text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Create First Assignment for {selectedClassFilter === 'ALL' ? 'Classes' : selectedClassFilter}
              </button>
            </div>
          ) : (
            filteredAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden transition-all hover:border-neutral-300"
              >
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-neutral-100 text-neutral-900 border border-neutral-300 shadow-2xs">
                          {assignment.class} {assignment.section ? `· ${assignment.section}` : ''}
                        </span>
                        <span className="text-xs font-bold text-primary uppercase tracking-wide bg-primary/10 px-2 py-0.5 rounded-md">
                          {assignment.subject}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            assignment.status === 'EVALUATED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {assignment.status}
                        </span>
                        {assignment.materialType && (
                          <span className="text-[11px] font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                            {assignment.materialType}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-semibold text-neutral-900">{assignment.title}</h3>
                    </div>
                  </div>

                  {/* Stats Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-neutral-50 border border-neutral-100 text-xs mt-2">
                    <div>
                      <span className="text-neutral-500 block text-[11px]">Assigned Date</span>
                      <p className="font-semibold text-neutral-800 mt-0.5">{assignment.assignedDate}</p>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[11px]">Due Date</span>
                      <p className="font-semibold text-red-600 mt-0.5">{assignment.dueDate}</p>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[11px]">Submissions</span>
                      <p className="font-bold text-neutral-800 mt-0.5">
                        {assignment.submittedCount} / {assignment.totalCount} Students
                      </p>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[11px]">Submission Rate</span>
                      <p className="font-bold text-emerald-600 mt-0.5">
                        {((assignment.submittedCount / Math.max(1, assignment.totalCount)) * 100).toFixed(0)}% Completed
                      </p>
                    </div>
                  </div>

                  {assignment.instructions && (
                    <div className="bg-neutral-50/70 p-3 rounded-lg border border-neutral-100 text-neutral-600 text-xs mt-3">
                      <span className="font-bold text-neutral-800 mr-1.5">Instructions:</span>
                      {assignment.instructions}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-3.5 mt-3.5 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <span className="text-xs text-neutral-500">
                      Auto-synced with student portal for {assignment.class}
                    </span>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/student/homework/view?id=${assignment.id}&subject=${encodeURIComponent(
                          assignment.subject
                        )}&className=${encodeURIComponent(assignment.class)}&section=${encodeURIComponent(
                          assignment.section || 'Section A'
                        )}`}
                        target="_blank"
                        prefetch={true}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-neutral-300 hover:bg-neutral-100 text-neutral-800 transition cursor-pointer"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        Preview Worksheet
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAssignment(assignment)
                          setIsEvaluateOpen(true)
                        }}
                        className="relative z-20 cursor-pointer bg-black hover:bg-neutral-800 text-white font-medium px-3.5 py-1.5 rounded-lg text-xs transition shadow-xs"
                      >
                        Evaluate Submissions
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(assignment.id, assignment.title)}
                        title="Delete Assignment"
                        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 100% DYNAMIC MODAL: CREATE NEW ASSIGNMENT / WORKSHEET */}
      {/* ========================================================= */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white text-black rounded-xl p-6 w-full max-w-xl shadow-2xl relative my-8 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Publish Homework / Worksheet
                </h3>
                <p className="text-xs text-neutral-500">
                  Select any school class (e.g. Class 7, Class 8, Matric) with automatic subject filtering
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-gray-400 hover:text-black font-bold p-1 rounded-lg hover:bg-neutral-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Deliverable Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Assignment / Worksheet Title *
                </label>
                <input
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Rational Numbers &amp; Decimal Fractions Practice Set"
                  className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-black bg-white"
                />
              </div>

              {/* 1. DYNAMIC CLASS SELECTOR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Select Class (Dynamic) *
                  </label>
                  <select
                    value={formClassId || formClassName}
                    onChange={(e) => handleFormClassChange(e.target.value)}
                    className="w-full border rounded-lg p-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-black font-medium"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} {cls.isAssigned ? '★ (Assigned)' : ''}
                      </option>
                    ))}
                    {classes.length === 0 && (
                      <option value="Class 7">Class 7</option>
                    )}
                  </select>
                </div>

                {/* Section Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Section *
                  </label>
                  <select
                    value={formSection}
                    onChange={(e) => setFormSection(e.target.value)}
                    className="w-full border rounded-lg p-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-black font-medium"
                  >
                    {currentAvailableSections.map((sec) => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                    <option value="All Sections">All Sections</option>
                  </select>
                </div>
              </div>

              {/* 2. DYNAMIC SUBJECT SELECTOR (FILTERED BY SELECTED CLASS) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                      Subject (Filtered for {formClassName || 'Class'}) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomSubject(!isCustomSubject)}
                      className="text-[11px] text-blue-600 font-semibold hover:underline cursor-pointer"
                    >
                      {isCustomSubject ? '← Back to List' : '+ Custom Subject'}
                    </button>
                  </div>

                  {!isCustomSubject ? (
                    <select
                      value={formSubject}
                      onChange={(e) => setFormSubject(e.target.value)}
                      className="w-full border rounded-lg p-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-black font-semibold uppercase"
                    >
                      {currentAvailableSubjects.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                      {currentAvailableSubjects.length === 0 && (
                        <option value="General">General</option>
                      )}
                    </select>
                  ) : (
                    <input
                      required
                      value={customSubjectText}
                      onChange={(e) => setCustomSubjectText(e.target.value)}
                      placeholder="Type custom subject name..."
                      className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-black bg-white"
                    />
                  )}
                </div>

                {/* Due Date & Material Type */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Submission Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full border rounded-lg p-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              {/* Material Type Badge Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Deliverable Type
                </label>
                <div className="flex gap-2">
                  {(['Homework', 'Worksheet', 'Assignment'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormMaterialType(type)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                        formMaterialType === type
                          ? 'bg-black text-white border-black shadow-xs'
                          : 'bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Instructions / Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Instructions / Exercise Details
                </label>
                <textarea
                  placeholder="Provide exercise numbers, questions, or specific guidelines for students..."
                  rows={3}
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-100 cursor-pointer transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-black text-white rounded-lg text-sm font-semibold hover:bg-neutral-800 cursor-pointer shadow-sm transition inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSubmitting ? 'Publishing...' : 'Publish to Student Portal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* EVALUATION MODAL: GRADE STUDENT SUBMISSIONS */}
      {/* ========================================================= */}
      {isEvaluateOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white text-black rounded-xl p-6 w-full max-w-2xl shadow-2xl relative">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <div>
                <h3 className="text-lg font-bold">Submissions &amp; Grading</h3>
                <p className="text-xs text-gray-500">
                  {selectedAssignment?.title
                    ? `${selectedAssignment.title} (${selectedAssignment.class} · ${selectedAssignment.section})`
                    : 'Grade student deliverables'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEvaluateOpen(false)}
                className="text-gray-400 hover:text-black font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              <div className="py-2.5 flex justify-between items-center text-sm">
                <div>
                  <p className="font-semibold">Muhammad Hamdan (Roll: 12)</p>
                  <span className="text-xs text-green-600 font-medium">Submitted on time</span>
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    placeholder="Grade (e.g. A+)"
                    defaultValue="A+"
                    className="w-28 border rounded p-1 text-xs text-center outline-none focus:ring-1 focus:ring-black font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => showNotification('Grade saved for Muhammad Hamdan')}
                    className="px-2.5 py-1 bg-black hover:bg-neutral-800 text-white text-xs rounded cursor-pointer transition"
                  >
                    Save
                  </button>
                </div>
              </div>
              <div className="py-2.5 flex justify-between items-center text-sm">
                <div>
                  <p className="font-semibold">Fatima Zahra (Roll: 14)</p>
                  <span className="text-xs text-green-600 font-medium">Submitted on time</span>
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    placeholder="Grade (e.g. 24/25)"
                    defaultValue="24/25"
                    className="w-28 border rounded p-1 text-xs text-center outline-none focus:ring-1 focus:ring-black font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => showNotification('Grade saved for Fatima Zahra')}
                    className="px-2.5 py-1 bg-black hover:bg-neutral-800 text-white text-xs rounded cursor-pointer transition"
                  >
                    Save
                  </button>
                </div>
              </div>
              <div className="py-2.5 flex justify-between items-center text-sm">
                <div>
                  <p className="font-semibold">Ali Raza (Roll: 18)</p>
                  <span className="text-xs text-amber-600 font-medium">Pending submission</span>
                </div>
                <span className="text-xs text-gray-400">Awaiting student</span>
              </div>
            </div>
            <div className="flex justify-end pt-4 mt-2 border-t">
              <button
                type="button"
                onClick={() => {
                  if (selectedAssignment) {
                    setAssignments((prev) =>
                      prev.map((asg) =>
                        asg.id === selectedAssignment.id ? { ...asg, status: 'EVALUATED' } : asg
                      )
                    )
                  }
                  setIsEvaluateOpen(false)
                  showNotification('All evaluations saved successfully!')
                }}
                className="px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg cursor-pointer transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

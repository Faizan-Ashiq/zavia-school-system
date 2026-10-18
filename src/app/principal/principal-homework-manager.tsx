'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  FileText,
  Calendar,
  Clock,
  BookOpen,
  Users,
  Search,
  Filter,
  GraduationCap,
  Sparkles,
  ExternalLink,
  Layers,
  CheckCircle2,
  X,
  LayoutGrid,
  List,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UnifiedAssignment, TeacherFilterOption } from '@/app/staff/assignments/actions'
import { DynamicClass } from '@/lib/services/class-subject-service'

interface PrincipalHomeworkManagerProps {
  initialAssignments: UnifiedAssignment[]
  classes: DynamicClass[]
  teachers: TeacherFilterOption[]
}

function isStrictClassMatch(itemClass: string | null | undefined, targetClass: string): boolean {
  if (!itemClass || !targetClass) return false
  const a = itemClass.trim().toLowerCase()
  const b = targetClass.trim().toLowerCase()
  if (a === b) return true

  const cleanA = a.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim()
  const cleanB = b.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim()
  if (cleanA === cleanB) return true

  const regex = /(?:class|grade)?\s*([0-9]+(?:\s*[a-z])?)/i
  const matchA = cleanA.match(regex)
  const matchB = cleanB.match(regex)

  if (matchA && matchB) {
    const tokenA = matchA[1].replace(/\s+/g, '').toLowerCase()
    const tokenB = matchB[1].replace(/\s+/g, '').toLowerCase()
    return tokenA === tokenB
  }

  const namedGrades = ['playgroup', 'nursery', 'prep', 'kg', 'kindergarten']
  for (const grade of namedGrades) {
    if (cleanA.includes(grade) && cleanB.includes(grade)) {
      return true
    }
  }

  return false
}

export function PrincipalHomeworkManager({
  initialAssignments,
  classes,
  teachers,
}: PrincipalHomeworkManagerProps) {
  // Filter States
  const [selectedTeacher, setSelectedTeacher] = useState<string>('ALL')
  const [selectedClass, setSelectedClass] = useState<string>('ALL')
  const [selectedType, setSelectedType] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  // Available unique class names from both classes list and assignments
  const classOptions = useMemo(() => {
    const set = new Set<string>()
    classes.forEach((c) => {
      if (c.name) set.add(c.name.trim())
    })
    initialAssignments.forEach((a) => {
      if (a.class && a.class !== 'Class') set.add(a.class.trim())
    })
    return Array.from(set)
  }, [classes, initialAssignments])

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    return initialAssignments.filter((item) => {
      // 1. Teacher Filter
      if (selectedTeacher !== 'ALL') {
        const itemTeacher = (item.teacherName || '').toLowerCase().trim()
        const targetTeacher = selectedTeacher.toLowerCase().trim()
        const itemTeacherId = item.teacherId || ''

        const matchesName = itemTeacher.includes(targetTeacher) || targetTeacher.includes(itemTeacher)
        const matchesId = itemTeacherId === selectedTeacher
        if (!matchesName && !matchesId) return false
      }

      // 2. Class Filter
      if (selectedClass !== 'ALL') {
        if (!isStrictClassMatch(item.class, selectedClass)) {
          return false
        }
      }

      // 3. Material Type Filter
      if (selectedType !== 'ALL') {
        const itemType = (item.materialType || 'Homework').toLowerCase()
        if (itemType !== selectedType.toLowerCase()) return false
      }

      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchTitle = item.title.toLowerCase().includes(q)
        const matchSub = item.subject.toLowerCase().includes(q)
        const matchClass = item.class.toLowerCase().includes(q)
        const matchTeacher = (item.teacherName || '').toLowerCase().includes(q)
        const matchInst = (item.instructions || '').toLowerCase().includes(q)
        if (!matchTitle && !matchSub && !matchClass && !matchTeacher && !matchInst) {
          return false
        }
      }

      return true
    })
  }, [initialAssignments, selectedTeacher, selectedClass, selectedType, searchQuery])

  // Statistics
  const stats = useMemo(() => {
    const totalCount = initialAssignments.length
    const filteredCount = filteredAssignments.length
    const uniqueClasses = new Set(filteredAssignments.map((a) => a.class)).size
    const uniqueTeachers = new Set(
      filteredAssignments.map((a) => a.teacherName || 'Faculty Member')
    ).size
    return {
      totalCount,
      filteredCount,
      uniqueClasses,
      uniqueTeachers,
    }
  }, [initialAssignments, filteredAssignments])

  const hasActiveFilters =
    selectedTeacher !== 'ALL' ||
    selectedClass !== 'ALL' ||
    selectedType !== 'ALL' ||
    searchQuery.trim() !== ''

  const handleResetFilters = () => {
    setSelectedTeacher('ALL')
    setSelectedClass('ALL')
    setSelectedType('ALL')
    setSearchQuery('')
  }

  return (
    <div className="space-y-6">
      {/* Principal Header Bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              Institutional Homework Oversight
            </h1>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 text-xs font-semibold">
              Executive Full Visibility
            </Badge>
          </div>
          <p className="text-sm text-neutral-500 mt-1">
            Complete institutional supervision of homework, digital worksheets, and curriculum diary tasks across all school grades and teaching faculty.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/principal/dashboard"
            className="px-3 py-1.5 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-700 transition shadow-xs"
          >
            ← Executive Dashboard
          </Link>
          <Link
            href="/staff/homework"
            className="px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-white transition shadow-xs flex items-center gap-1.5"
          >
            <span>Faculty Desk</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-xs bg-white border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Total Deliverables
              </p>
              <h3 className="text-2xl font-bold text-neutral-900 mt-1">
                {stats.filteredCount}
              </h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                {hasActiveFilters ? `Filtered of ${stats.totalCount} total` : 'Across all curriculum'}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs bg-white border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Classes Covered
              </p>
              <h3 className="text-2xl font-bold text-neutral-900 mt-1">
                {stats.uniqueClasses}
              </h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Grades with active homework
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs bg-white border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Active Faculty
              </p>
              <h3 className="text-2xl font-bold text-neutral-900 mt-1">
                {stats.uniqueTeachers}
              </h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Teachers publishing content
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs bg-white border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Access Level
              </p>
              <h3 className="text-sm font-bold text-neutral-900 mt-2">
                Unrestricted
              </h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> All grade rosters visible
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Controls & Filters Bar */}
      <Card className="shadow-xs bg-white border">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, subject, teacher name, or keywords..."
                className="w-full pl-9 pr-8 py-2 rounded-lg border border-neutral-300 bg-white text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1.5 self-end md:self-auto border border-neutral-200 rounded-lg p-1 bg-neutral-50">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition ${
                  viewMode === 'cards'
                    ? 'bg-white text-neutral-900 shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition ${
                  viewMode === 'table'
                    ? 'bg-white text-neutral-900 shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <List className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>
          </div>

          {/* Dropdown Filters Row */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-neutral-100">
            {/* Teacher Name Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-neutral-600 flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-neutral-400" />
                Teacher:
              </span>
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white text-xs font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="ALL">All Faculty Teachers ({teachers.length})</option>
                {teachers.map((t) => (
                  <option key={t.id || t.name} value={t.name}>
                    {t.name} {t.role ? `(${t.role})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Class Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-neutral-600 flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-neutral-400" />
                Class:
              </span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white text-xs font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="ALL">All Classes &amp; Grades</option>
                {classOptions.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            {/* Material Type Pills */}
            <div className="flex items-center gap-1 text-xs">
              <span className="font-semibold text-neutral-600 mr-1">Type:</span>
              {(['ALL', 'Homework', 'Worksheet', 'Assignment'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                    selectedType === type
                      ? 'bg-neutral-900 text-white font-semibold'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                  }`}
                >
                  {type === 'ALL' ? 'All Types' : type}
                </button>
              ))}
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="ml-auto text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 py-1 px-2 rounded-md hover:bg-rose-50 transition"
              >
                <X className="h-3.5 w-3.5" />
                Reset Filters
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Deliverables Display */}
      {filteredAssignments.length === 0 ? (
        <Card className="shadow-xs bg-white border border-dashed">
          <CardContent className="p-12 text-center">
            <div className="h-12 w-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto mb-3">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-neutral-800">No matching homework found</h3>
            <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1 mb-4">
              {hasActiveFilters
                ? 'No deliverables match the selected teacher and class filters. Try adjusting your filter parameters or search query.'
                : 'No homework deliverables have been published by faculty members yet.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs transition"
              >
                Clear All Filters
              </button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'cards' ? (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssignments.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-neutral-200 bg-white hover:border-neutral-300 transition shadow-2xs flex flex-col justify-between"
            >
              <div>
                {/* Subject & Type Header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {item.subject}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                      {item.class}
                    </span>
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                      {item.materialType || 'Homework'}
                    </Badge>
                  </div>
                </div>

                {/* Title */}
                <h4 className="font-bold text-sm text-neutral-900 leading-snug line-clamp-2">
                  {item.title}
                </h4>

                {/* Instructions Snippet */}
                {item.instructions && (
                  <p className="text-xs text-neutral-500 mt-2 line-clamp-2 leading-relaxed">
                    {item.instructions}
                  </p>
                )}

                {/* Teacher & Date Details */}
                <div className="mt-3.5 pt-3 border-t border-neutral-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-neutral-600">
                    <span className="text-neutral-400">Teacher:</span>
                    <span className="font-semibold text-neutral-900">
                      {item.teacherName || 'Faculty Member'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-600">
                    <span className="text-neutral-400">Assigned:</span>
                    <span>{item.assignedDate}</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-600">
                    <span className="text-neutral-400">Due Date:</span>
                    <span className="font-semibold text-amber-700">{item.dueDate}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 mt-3 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-[11px] text-neutral-400">
                  {item.section || 'Section A'}
                </span>
                <Link
                  href={`/student/homework/view?id=${item.id}&subject=${encodeURIComponent(
                    item.subject
                  )}&className=${encodeURIComponent(
                    item.class
                  )}&section=${encodeURIComponent(item.section)}&title=${encodeURIComponent(
                    item.title
                  )}`}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  Student Preview →
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <Card className="shadow-xs bg-white border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-50 text-neutral-600 border-b border-neutral-200 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Subject &amp; Title</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Instructor</th>
                  <th className="py-3 px-4">Assigned</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredAssignments.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-neutral-900">{item.title}</div>
                      <div className="text-[11px] text-primary font-medium">{item.subject}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-neutral-800">{item.class}</span>
                      <div className="text-[10px] text-neutral-400">{item.section}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-neutral-700">
                      {item.teacherName || 'Faculty Member'}
                    </td>
                    <td className="py-3 px-4 text-neutral-500">{item.assignedDate}</td>
                    <td className="py-3 px-4 font-semibold text-amber-700">{item.dueDate}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                        {item.materialType || 'Homework'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/student/homework/view?id=${item.id}&subject=${encodeURIComponent(
                          item.subject
                        )}&className=${encodeURIComponent(
                          item.class
                        )}&section=${encodeURIComponent(item.section)}&title=${encodeURIComponent(
                          item.title
                        )}`}
                        className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Preview
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

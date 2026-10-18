'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface StudentFiltersProps {
  classes: Array<{ id: string; name: string }>
  sections: Array<{ id: string; name: string; class_id: string }>
}

const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE', 'STRUCK_OFF'] as const

export function StudentFilters({ classes, sections }: StudentFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') ?? '')

  const currentClass = searchParams.get('class') ?? 'all'
  const rawSection = searchParams.get('section') ?? 'all'
  const currentStatus = searchParams.get('status') ?? 'all'

  // Resolve section name if rawSection was an ID or name
  const matchedSection = sections.find((s) => s.id === rawSection || s.name.toLowerCase() === rawSection.toLowerCase())
  const currentSection = matchedSection ? matchedSection.name : rawSection

  // Filter sections by selected class, and deduplicate by section name
  const filteredSections =
    currentClass === 'all'
      ? sections
      : sections.filter((s) => s.class_id === currentClass)

  // Deduplicate classes by name
  const availableClasses = Array.from(
    new Set(classes.map((c) => c.name))
  )
    .map((name) => classes.find((c) => c.name === name)!)
    .filter(Boolean)

  const availableSections = Array.from(
    new Set(filteredSections.map((s) => s.name))
  )
    .map((name) => filteredSections.find((s) => s.name === name)!)
    .filter(Boolean)

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (!value || value === 'all') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    }
    // Any filter change starts back at page 1.
    params.delete('page')
    router.push(`/admin/students?${params.toString()}`)
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    updateParams({ search: search || null })
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
      <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, roll no, admission no, reg code"
          className="pl-8"
        />
      </form>

      <Select
        value={currentClass}
        onValueChange={(value) => updateParams({ class: value, section: null })}
      >
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Class" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All classes</SelectItem>
          {availableClasses.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={currentSection} onValueChange={(value) => updateParams({ section: value })}>
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Section" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All sections</SelectItem>
          {availableSections.map((s) => (
            <SelectItem key={s.id} value={s.name}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={currentStatus} onValueChange={(value) => updateParams({ status: value })}>
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {STATUS_OPTIONS.map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {(search || currentClass !== 'all' || currentSection !== 'all' || currentStatus !== 'all') && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearch('')
            router.push('/admin/students')
          }}
        >
          Clear filters
        </Button>
      )}
    </div>
  )
}

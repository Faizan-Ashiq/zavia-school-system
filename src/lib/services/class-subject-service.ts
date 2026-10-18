import { SupabaseClient } from '@supabase/supabase-js'

export interface ClassSection {
  id: string
  name: string
  class_id?: string
}

export interface DynamicClass {
  id: string
  name: string
  sections: ClassSection[]
  isAssigned?: boolean
  assignedSubjects?: string[]
}

export interface DynamicSubject {
  id?: string
  class_id?: string | null
  name: string
}

/**
 * Pedagogical sorting for school classes:
 * Playgroup -> Nursery -> Prep -> Class 1..12 -> 1st Year -> 2nd Year -> custom names
 */
export function sortSchoolClasses<T extends { name: string }>(classList: T[]): T[] {
  const getRank = (name: string): number => {
    const n = (name || '').trim().toLowerCase()
    if (n.includes('playgroup')) return 10
    if (n.includes('nursery')) return 20
    if (n.includes('prep') || n.includes('kg') || n.includes('kindergarten')) return 30

    // Match "Class 1", "Grade 1", "7", "Class 7", etc.
    const match = n.match(/(?:class|grade)?\s*(\d+)/)
    if (match && match[1]) {
      const num = parseInt(match[1], 10)
      if (num >= 1 && num <= 12) {
        return 100 + num * 10
      }
    }

    if (n.includes('1st year') || n.includes('first year') || n.includes('xi') || n.includes('11th')) return 300
    if (n.includes('2nd year') || n.includes('second year') || n.includes('xii') || n.includes('12th')) return 310

    return 500
  }

  return [...classList].sort((a, b) => {
    const rankA = getRank(a.name)
    const rankB = getRank(b.name)
    if (rankA !== rankB) return rankA - rankB
    return a.name.localeCompare(b.name)
  })
}

/**
 * Returns dynamic subjects tailored for any class (e.g. Class 7, Class 9, Nursery, etc.)
 */
export function getSubjectsForClass(
  className: string,
  dbSubjects: DynamicSubject[] = [],
  teacherSubjects: string[] = []
): string[] {
  const n = (className || '').toLowerCase().trim()
  const subjectSet = new Set<string>()

  // 1. Add any subjects specifically assigned to this teacher
  teacherSubjects.forEach((s) => {
    if (s && s.trim()) subjectSet.add(s.trim())
  })

  // 2. Add any subjects matching this class from the DB subjects table
  dbSubjects.forEach((s) => {
    if (s && s.name && s.name.trim()) {
      subjectSet.add(s.name.trim())
    }
  })

  // 3. Fallback standard curriculum subjects by grade level
  if (n.includes('playgroup') || n.includes('nursery') || n.includes('prep') || n.includes('kg')) {
    const earlyYears = ['English', 'Urdu', 'Mathematics', 'General Knowledge', 'Art & Craft', 'Nazra Quran / Rhymes']
    earlyYears.forEach((s) => subjectSet.add(s))
  } else if (
    n.includes('class 1') ||
    n.includes('class 2') ||
    n.includes('class 3') ||
    n.includes('class 4') ||
    n.includes('class 5')
  ) {
    const primary = [
      'Mathematics',
      'General Science',
      'English',
      'Urdu',
      'Islamiat',
      'Social Studies',
      'Computer Studies',
      'Drawing',
      'Nazra Quran',
    ]
    primary.forEach((s) => subjectSet.add(s))
  } else if (n.includes('class 6') || n.includes('class 7') || n.includes('class 8')) {
    // Class 6, 7, 8 (Middle School)
    const middle = [
      'Mathematics',
      'General Science',
      'English',
      'Urdu',
      'Social Studies (History & Geo)',
      'Islamiat',
      'Computer Education',
      'Arabic / Nazra Quran',
      'Art & Craft',
    ]
    middle.forEach((s) => subjectSet.add(s))
  } else if (n.includes('class 9') || n.includes('class 10') || n.includes('matric')) {
    // Class 9 & 10 (Matric)
    const matric = [
      'Mathematics',
      'Physics',
      'Chemistry',
      'Biology',
      'Computer Science',
      'English',
      'Urdu',
      'Islamiat',
      'Pakistan Studies',
      'Tarjuma-tul-Quran',
    ]
    matric.forEach((s) => subjectSet.add(s))
  } else if (n.includes('1st year') || n.includes('2nd year') || n.includes('fsc') || n.includes('ics') || n.includes('intermediate')) {
    // Higher Secondary (FSc / ICS / I.Com)
    const inter = [
      'Physics',
      'Chemistry',
      'Mathematics',
      'Biology',
      'Computer Science',
      'Statistics',
      'Principles of Accounting',
      'Economics',
      'English',
      'Urdu',
      'Islamic Studies',
      'Pakistan Studies',
    ]
    inter.forEach((s) => subjectSet.add(s))
  } else {
    // Generic default for any custom class name
    const generic = [
      'Mathematics',
      'Science',
      'English',
      'Urdu',
      'Islamiat',
      'Social Studies',
      'Computer Studies',
    ]
    generic.forEach((s) => subjectSet.add(s))
  }

  return Array.from(subjectSet)
}

/**
 * Fetches teacher class allocations from DB:
 * - Checks teacher_classes table first
 * - Falls back to all active classes from classes table
 */
export async function fetchDynamicClassesAndSubjects(
  adminClient: SupabaseClient,
  teacherId?: string | null
): Promise<{
  classes: DynamicClass[]
  isTeacherAssigned: boolean
  allClasses: DynamicClass[]
}> {
  // 1. Fetch all classes with their sections
  const { data: rawClasses } = await adminClient
    .from('classes')
    .select('id, name, sections(id, name, class_id)')
    .order('name')

  const allClasses: DynamicClass[] = sortSchoolClasses(
    (rawClasses || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      sections: (c.sections || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        class_id: s.class_id || c.id,
      })),
    }))
  )

  // 2. Fetch teacher_classes if teacherId is provided
  let teacherClasses: any[] = []
  if (teacherId) {
    const { data: tc } = await adminClient
      .from('teacher_classes')
      .select('*')
      .eq('teacher_id', teacherId)

    teacherClasses = tc || []
  }

  if (teacherClasses.length > 0) {
    // Teacher has specific assigned classes
    const assignedMap = new Map<string, { id: string; name: string; sections: ClassSection[]; subjects: string[] }>()

    for (const tc of teacherClasses) {
      const clsName = tc.class_name || 'Class'
      const matchedClass = allClasses.find((c) => c.name.toLowerCase() === clsName.toLowerCase())
      const classId = matchedClass?.id || tc.id || `tc-${clsName}`
      const sections = matchedClass?.sections || [{ id: `sec-a-${classId}`, name: 'Section A', class_id: classId }]

      if (!assignedMap.has(clsName)) {
        assignedMap.set(clsName, {
          id: classId,
          name: clsName,
          sections,
          subjects: [],
        })
      }

      if (tc.subject) {
        assignedMap.get(clsName)!.subjects.push(tc.subject)
      }
    }

    const assignedClasses: DynamicClass[] = Array.from(assignedMap.values()).map((item) => ({
      id: item.id,
      name: item.name,
      sections: item.sections,
      isAssigned: true,
      assignedSubjects: item.subjects,
    }))

    return {
      classes: sortSchoolClasses(assignedClasses),
      isTeacherAssigned: true,
      allClasses,
    }
  }

  // Fallback: Return all school classes
  return {
    classes: allClasses,
    isTeacherAssigned: false,
    allClasses,
  }
}

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  fetchDynamicClassesAndSubjects,
  DynamicClass,
} from '@/lib/services/class-subject-service'

export interface CreateAssignmentInput {
  title: string
  subject: string
  classId?: string
  className: string
  section: string
  dueDate: string
  instructions: string
  teacherId?: string
  teacherName?: string
  materialType?: 'Homework' | 'Worksheet' | 'Assignment' | 'Past Paper'
  fileUrl?: string
}

export interface UnifiedAssignment {
  id: string
  title: string
  class: string
  classId?: string
  section: string
  subject: string
  assignedDate: string
  dueDate: string
  submittedCount: number
  totalCount: number
  status: string
  instructions?: string
  materialType?: string
  fileUrl?: string
  teacherName?: string
  teacherId?: string
  sourceTable?: 'homework' | 'assignments' | 'teacher_materials'
}

export interface TeacherFilterOption {
  id: string
  name: string
  role?: string
}

/**
 * Fetches dynamic classes, subjects, and assignments/materials.
 * When called by a teacher, filters strictly by teacher_id (data isolation).
 * When isPrincipalMode is true or teacherId is 'ALL', returns full school visibility.
 */
export async function getStaffHomeworkDataAction(
  teacherIdParam?: string | null,
  isPrincipalMode: boolean = false
) {
  const adminClient = createAdminClient()

  try {
    // 1. Identify logged-in user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // 2. Determine caller role & teacher identification
    let callerRole = ''
    if (user) {
      const { data: prof } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      callerRole = prof?.role?.toUpperCase() || ''
    }

    const isAdminCaller = callerRole === 'ADMIN' || callerRole === 'SUPER_ADMIN'
    const fullVisibility = isPrincipalMode || (isAdminCaller && (!teacherIdParam || teacherIdParam === 'ALL'))

    // Resolve teacher IDs (auth user.id and corresponding staff.id)
    const effectiveTeacherId = teacherIdParam && teacherIdParam !== 'ALL' ? teacherIdParam : user?.id || null

    let staffRecord: any = null
    if (user?.id) {
      const { data: sRecord } = await adminClient
        .from('staff')
        .select('id, user_id, full_name, designation, department')
        .or(`user_id.eq.${user.id},id.eq.${user.id}`)
        .maybeSingle()
      staffRecord = sRecord
    }

    const teacherIds = new Set<string>()
    if (effectiveTeacherId) teacherIds.add(effectiveTeacherId)
    if (user?.id) teacherIds.add(user.id)
    if (staffRecord?.id) teacherIds.add(staffRecord.id)
    if (staffRecord?.user_id) teacherIds.add(staffRecord.user_id)

    // 3. Dynamic classes & custom subjects
    const { classes, isTeacherAssigned, allClasses } = await fetchDynamicClassesAndSubjects(
      adminClient,
      fullVisibility ? null : effectiveTeacherId
    )

    const { data: rawSubjects } = await adminClient
      .from('subjects')
      .select('id, class_id, name')

    const dbSubjects = rawSubjects || []

    // 4. DATA ISOLATION FETCHING:
    // A. Query 'homework' table (strictly by teacher_id for teachers)
    let rawHomework: any[] = []
    try {
      if (fullVisibility) {
        const { data: hwData, error: hwErr } = await adminClient
          .from('homework')
          .select('*')
          .order('created_at', { ascending: false })
        if (!hwErr && hwData) rawHomework = hwData
      } else if (teacherIds.size > 0) {
        // Teacher portal data isolation: .eq('teacher_id', user.id)
        const idList = Array.from(teacherIds)
        const { data: hwData, error: hwErr } = await adminClient
          .from('homework')
          .select('*')
          .in('teacher_id', idList)
          .order('created_at', { ascending: false })
        if (!hwErr && hwData) rawHomework = hwData
      }
    } catch (e: any) {
      console.warn('[getStaffHomeworkDataAction] homework table notice:', e?.message)
    }

    // B. Query 'teacher_materials' table (strictly by teacher_id for teachers)
    let rawMaterials: any[] = []
    try {
      if (fullVisibility) {
        const { data: tmData, error: tmErr } = await adminClient
          .from('teacher_materials')
          .select('*')
          .order('created_at', { ascending: false })
        if (!tmErr && tmData) rawMaterials = tmData
      } else if (teacherIds.size > 0) {
        const idList = Array.from(teacherIds)
        const { data: tmData, error: tmErr } = await adminClient
          .from('teacher_materials')
          .select('*')
          .in('teacher_id', idList)
          .order('created_at', { ascending: false })
        if (!tmErr && tmData) rawMaterials = tmData
      }
    } catch (e: any) {
      console.warn('[getStaffHomeworkDataAction] teacher_materials notice:', e?.message)
    }

    // C. Query 'assignments' table
    let rawAssignments: any[] = []
    try {
      const { data: asgData, error: asgErr } = await adminClient
        .from('assignments')
        .select('*')
        .order('created_at', { ascending: false })

      if (!asgErr && asgData) {
        if (fullVisibility) {
          rawAssignments = asgData
        } else {
          // Filter strictly by teacher_id or teacher_name
          const staffName = (staffRecord?.full_name || '').toLowerCase().trim()
          rawAssignments = asgData.filter((a: any) => {
            if (a.teacher_id && teacherIds.has(a.teacher_id)) return true
            if (staffName && a.teacher_name && a.teacher_name.toLowerCase().trim() === staffName) {
              return true
            }
            return false
          })
        }
      }
    } catch (e: any) {
      console.warn('[getStaffHomeworkDataAction] assignments notice:', e?.message)
    }

    // 5. Merge and format unified records
    const unifiedList: UnifiedAssignment[] = []
    const seenKeys = new Set<string>()

    // Helper for formatting date
    const formatDate = (dateStr?: string | null) => {
      if (!dateStr) return 'Active'
      try {
        return new Date(dateStr).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      } catch {
        return dateStr
      }
    }

    // Process homework table
    ;(rawHomework || []).forEach((hw: any) => {
      const cls = hw.class_name || 'Class'
      const key = `${hw.title?.trim()}-${cls.trim()}-${hw.subject?.trim()}`
      seenKeys.add(key)

      unifiedList.push({
        id: hw.id,
        title: hw.title,
        class: cls,
        classId: hw.class_id,
        section: hw.section || 'Section A',
        subject: hw.subject || 'General',
        assignedDate: formatDate(hw.created_at || hw.assigned_date),
        dueDate: formatDate(hw.due_date),
        submittedCount: 0,
        totalCount: 35,
        status: hw.status || 'ACTIVE',
        instructions: hw.description || hw.instructions || '',
        teacherName: hw.teacher_name || staffRecord?.full_name || 'Faculty Member',
        teacherId: hw.teacher_id,
        materialType: hw.material_type || 'Homework',
        sourceTable: 'homework',
        fileUrl: hw.file_url,
      })
    })

    // Process assignments table
    ;(rawAssignments || []).forEach((asg: any) => {
      const cls = asg.class_name || 'Class'
      const key = `${asg.title?.trim()}-${cls.trim()}-${asg.subject?.trim()}`
      if (!seenKeys.has(key)) {
        seenKeys.add(key)
        unifiedList.push({
          id: asg.id,
          title: asg.title,
          class: cls,
          section: asg.section || 'Section A',
          subject: asg.subject || 'General',
          assignedDate: formatDate(asg.created_at || asg.assigned_date),
          dueDate: formatDate(asg.due_date),
          submittedCount: 0,
          totalCount: 35,
          status: asg.status || 'ACTIVE',
          instructions: asg.description || asg.instructions || '',
          teacherName: asg.teacher_name || staffRecord?.full_name || 'Faculty Member',
          teacherId: asg.teacher_id,
          materialType: asg.material_type || 'Homework',
          sourceTable: 'assignments',
          fileUrl: asg.file_url,
        })
      }
    })

    // Process teacher_materials table
    ;(rawMaterials || []).forEach((tm: any) => {
      const matchedClass = allClasses.find((c) => c.id === tm.class_id)
      const className = matchedClass?.name || tm.class_name || 'Class'
      const key = `${tm.title?.trim()}-${className.trim()}-${tm.subject?.trim()}`

      if (!seenKeys.has(key)) {
        seenKeys.add(key)
        unifiedList.push({
          id: tm.id,
          title: tm.title,
          class: className,
          classId: tm.class_id,
          section: 'Section A',
          subject: tm.subject || 'General',
          assignedDate: formatDate(tm.created_at),
          dueDate: formatDate(tm.due_date),
          submittedCount: 0,
          totalCount: 35,
          status: 'ACTIVE',
          instructions: tm.description || '',
          teacherName: tm.teacher_name || staffRecord?.full_name || 'Faculty Member',
          teacherId: tm.teacher_id,
          materialType: tm.material_type || 'Homework',
          sourceTable: 'teacher_materials',
          fileUrl: tm.file_url,
        })
      }
    })

    return {
      success: true,
      classes,
      allClasses,
      isTeacherAssigned,
      dbSubjects,
      assignments: unifiedList,
      currentTeacher: {
        id: effectiveTeacherId,
        name: staffRecord?.full_name || 'Teacher / Faculty',
        isFullVisibility: fullVisibility,
      },
    }
  } catch (err: any) {
    console.error('[getStaffHomeworkDataAction] Error:', err)
    return {
      success: false,
      error: err?.message || 'Failed to fetch homework data',
      classes: [],
      allClasses: [],
      isTeacherAssigned: false,
      dbSubjects: [],
      assignments: [],
      currentTeacher: null,
    }
  }
}

/**
 * Creates new Homework / Assignment and persists with teacher_id: user.id lazmi
 * simultaneously in `homework`, `teacher_materials`, and `assignments` tables.
 */
export async function createAssignmentAction(data: CreateAssignmentInput) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const adminClient = createAdminClient()

  // Mandatory teacher_id binding: logged-in user.id or explicitly passed teacherId
  const teacherUserId = user?.id || data.teacherId || null

  // Lookup teacher's full name from staff table or profiles
  let teacherName = data.teacherName || ''
  if (!teacherName && teacherUserId) {
    const { data: staffData } = await adminClient
      .from('staff')
      .select('full_name')
      .or(`user_id.eq.${teacherUserId},id.eq.${teacherUserId}`)
      .maybeSingle()

    if (staffData?.full_name) {
      teacherName = staffData.full_name
    } else {
      const { data: profData } = await adminClient
        .from('profiles')
        .select('full_name')
        .eq('id', teacherUserId)
        .maybeSingle()
      teacherName = profData?.full_name || 'Faculty Member'
    }
  }
  if (!teacherName) teacherName = 'Faculty Member'

  const assignedDate = new Date().toISOString().split('T')[0]

  try {
    // 1. Resolve class_id from classes table
    let resolvedClassId = data.classId || null

    if (!resolvedClassId && data.className) {
      const { data: matchedClass } = await adminClient
        .from('classes')
        .select('id, name')
        .ilike('name', data.className.trim())
        .maybeSingle()

      if (matchedClass) {
        resolvedClassId = matchedClass.id
      } else {
        const { data: fallbackClass } = await adminClient
          .from('classes')
          .select('id, name')
          .ilike('name', `%${data.className.trim()}%`)
          .limit(1)
          .maybeSingle()

        if (fallbackClass) {
          resolvedClassId = fallbackClass.id
        }
      }
    }

    if (!resolvedClassId) {
      const { data: firstClass } = await adminClient
        .from('classes')
        .select('id, name')
        .limit(1)
        .maybeSingle()
      if (firstClass) {
        resolvedClassId = firstClass.id
      }
    }

    // 2. Persist in `homework` table with teacher_id: user.id lazmi
    try {
      const { error: hwError } = await adminClient.from('homework').insert({
        title: data.title.trim(),
        subject: data.subject.trim(),
        class_name: data.className.trim(),
        class_id: resolvedClassId,
        section: data.section.trim(),
        due_date: data.dueDate || null,
        assigned_date: assignedDate,
        description: data.instructions.trim(),
        instructions: data.instructions.trim(),
        teacher_id: teacherUserId, // teacher_id: user.id lazmi
        teacher_name: teacherName,
        status: 'ACTIVE',
        material_type: data.materialType || 'Homework',
        file_url: data.fileUrl || null,
      })
      if (hwError) {
        console.warn('[createAssignmentAction] homework table notice:', hwError.message)
      }
    } catch (e: any) {
      console.warn('[createAssignmentAction] homework insert exception:', e?.message)
    }

    // 3. Persist in `teacher_materials` table with teacher_id: user.id lazmi
    if (resolvedClassId) {
      const { error: tmError } = await adminClient.from('teacher_materials').insert({
        title: data.title.trim(),
        subject: data.subject.trim(),
        class_id: resolvedClassId,
        description: data.instructions.trim(),
        material_type: data.materialType || 'Homework',
        due_date: data.dueDate || null,
        teacher_id: teacherUserId, // teacher_id: user.id lazmi
        file_url: data.fileUrl || null,
      })
      if (tmError) {
        console.warn('[createAssignmentAction] teacher_materials notice:', tmError.message)
      }
    }

    // 4. Persist in `assignments` table with teacher_id: user.id lazmi
    const asgPayload: any = {
      title: data.title.trim(),
      subject: data.subject.trim(),
      class_name: data.className.trim(),
      section: data.section.trim(),
      due_date: data.dueDate,
      assigned_date: assignedDate,
      description: data.instructions.trim(),
      instructions: data.instructions.trim(),
      teacher_name: teacherName,
      teacher_id: teacherUserId, // teacher_id: user.id lazmi
      status: 'ACTIVE',
      file_url: data.fileUrl || null,
      material_type: data.materialType || 'Homework',
    }

    let { data: asgData, error: asgError } = await adminClient
      .from('assignments')
      .insert(asgPayload)
      .select()
      .maybeSingle()

    // Graceful fallback if assignments table doesn't have teacher_id column
    if (asgError && asgError.message?.includes('teacher_id')) {
      const { teacher_id, ...fallbackPayload } = asgPayload
      const retryRes = await adminClient
        .from('assignments')
        .insert(fallbackPayload)
        .select()
        .maybeSingle()
      asgData = retryRes.data
    }

    revalidatePath('/staff/assignments')
    revalidatePath('/staff/homework')
    revalidatePath('/staff/uploads')
    revalidatePath('/teacher')
    revalidatePath('/student/homework')
    revalidatePath('/principal')

    const assignedDateFormatted = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    const dueDateFormatted = data.dueDate
      ? new Date(data.dueDate).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : 'No deadline'

    return {
      success: true,
      assignment: {
        id: asgData?.id || `hw-${Date.now()}`,
        title: data.title.trim(),
        class: data.className.trim(),
        classId: resolvedClassId,
        section: data.section.trim(),
        subject: data.subject.trim(),
        assignedDate: assignedDateFormatted,
        dueDate: dueDateFormatted,
        submittedCount: 0,
        totalCount: 35,
        status: 'ACTIVE',
        instructions: data.instructions.trim(),
        teacherName,
        teacherId: teacherUserId || undefined,
        materialType: data.materialType || 'Homework',
        sourceTable: 'homework',
      } as UnifiedAssignment,
    }
  } catch (err: any) {
    console.error('[createAssignmentAction] exception:', err?.message)
    return {
      success: false,
      error: err?.message || 'Failed to publish assignment',
    }
  }
}

/**
 * Deletes an assignment or material by ID.
 * Teachers are strictly permitted to delete ONLY their own uploaded homework.
 */
export async function deleteAssignmentAction(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized: Authentication required.' }
  }

  const adminClient = createAdminClient()

  try {
    // 1. Check user role
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const isAdmin = profile?.role === 'ADMIN' || profile?.role === 'SUPER_ADMIN'

    // 2. If not admin (i.e. teacher), enforce strict ownership check
    if (!isAdmin) {
      const { data: staffMember } = await adminClient
        .from('staff')
        .select('id, user_id')
        .or(`user_id.eq.${user.id},id.eq.${user.id}`)
        .maybeSingle()

      const allowedTeacherIds = new Set<string>()
      allowedTeacherIds.add(user.id)
      if (staffMember?.id) allowedTeacherIds.add(staffMember.id)
      if (staffMember?.user_id) allowedTeacherIds.add(staffMember.user_id)

      // Query across tables to verify ownership
      const [hwRes, tmRes, asgRes] = await Promise.all([
        adminClient.from('homework').select('id, teacher_id').eq('id', id).maybeSingle(),
        adminClient.from('teacher_materials').select('id, teacher_id').eq('id', id).maybeSingle(),
        adminClient.from('assignments').select('id, teacher_id').eq('id', id).maybeSingle(),
      ])

      const item = hwRes.data || tmRes.data || asgRes.data

      // If item was found and has a teacher_id that doesn't match this teacher
      if (item && item.teacher_id && !allowedTeacherIds.has(item.teacher_id)) {
        return {
          success: false,
          error: 'Forbidden: Teachers may only delete homework uploaded by themselves.',
        }
      }
    }

    // 3. Delete from all potential storage tables
    await Promise.allSettled([
      adminClient.from('homework').delete().eq('id', id),
      adminClient.from('assignments').delete().eq('id', id),
      adminClient.from('teacher_materials').delete().eq('id', id),
    ])

    revalidatePath('/staff/assignments')
    revalidatePath('/staff/homework')
    revalidatePath('/staff/uploads')
    revalidatePath('/teacher')
    revalidatePath('/student/homework')
    revalidatePath('/principal')

    return { success: true }
  } catch (err: any) {
    console.error('[deleteAssignmentAction] Error:', err)
    return { success: false, error: err?.message || 'Failed to remove homework' }
  }
}

/**
 * Dedicated helper for Principal Portal: Fetches full visibility homework across
 * all classes and teachers, with list of distinct teachers and classes for dropdown filters.
 */
export async function getPrincipalHomeworkOverviewAction() {
  const adminClient = createAdminClient()

  try {
    // 1. Fetch full homework data
    const homeworkRes = await getStaffHomeworkDataAction(null, true)

    // 2. Fetch all teachers for dropdown filter
    const [{ data: staffRows }, { data: profileRows }] = await Promise.all([
      adminClient
        .from('staff')
        .select('id, user_id, full_name, designation, department')
        .order('full_name'),
      adminClient
        .from('profiles')
        .select('id, full_name, role')
        .in('role', ['STAFF', 'TEACHER'])
        .order('full_name'),
    ])

    const teachersMap = new Map<string, TeacherFilterOption>()

    ;(staffRows || []).forEach((s) => {
      if (s.full_name) {
        teachersMap.set(s.full_name.trim().toLowerCase(), {
          id: s.id || s.user_id,
          name: s.full_name.trim(),
          role: s.designation || s.department || 'Faculty Teacher',
        })
      }
    })

    ;(profileRows || []).forEach((p) => {
      if (p.full_name && !teachersMap.has(p.full_name.trim().toLowerCase())) {
        teachersMap.set(p.full_name.trim().toLowerCase(), {
          id: p.id,
          name: p.full_name.trim(),
          role: 'Faculty Member',
        })
      }
    })

    // Also include any teachers present in the assignments
    ;(homeworkRes.assignments || []).forEach((asg) => {
      if (asg.teacherName && !teachersMap.has(asg.teacherName.trim().toLowerCase())) {
        teachersMap.set(asg.teacherName.trim().toLowerCase(), {
          id: asg.teacherId || asg.teacherName,
          name: asg.teacherName.trim(),
          role: 'Subject Teacher',
        })
      }
    })

    const teachers = Array.from(teachersMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    )

    return {
      success: true,
      assignments: homeworkRes.assignments || [],
      classes: homeworkRes.allClasses || [],
      teachers,
    }
  } catch (err: any) {
    console.error('[getPrincipalHomeworkOverviewAction] Error:', err)
    return {
      success: false,
      assignments: [],
      classes: [],
      teachers: [],
      error: err?.message || 'Failed to fetch principal overview',
    }
  }
}

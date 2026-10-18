import Link from 'next/link'
import { UserPlus } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StudentFilters } from './student-filters'
import { StudentRowActions } from './student-row-actions'

const PAGE_SIZE = 15

const STATUS_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  ACTIVE: 'default',
  INACTIVE: 'secondary',
  STRUCK_OFF: 'destructive',
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

interface StudentsPageProps {
  searchParams: Promise<{
    search?: string
    class?: string
    section?: string
    status?: string
    page?: string
  }>
}

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? '1') || 1)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()

  const [classesRes, sectionsRes] = await Promise.all([
    supabase.from('classes').select('id, name').order('name'),
    supabase.from('sections').select('id, name, class_id').order('name'),
  ])

  let query = supabase
    .from('students')
    .select(
      'id, student_name, roll_no, admission_no, reg_code, fee_package, status, photo_url, classes(name), sections(name)',
      { count: 'exact' }
    )

  if (params.search) {
    const term = params.search.replace(/[%_]/g, '')
    query = query.or(
      `student_name.ilike.%${term}%,roll_no.ilike.%${term}%,admission_no.ilike.%${term}%,reg_code.ilike.%${term}%`
    )
  }
  if (params.class) query = query.eq('class_id', params.class)
  if (params.section) {
    const sectionFilter = params.section
    const matchingSections = (sectionsRes.data ?? []).filter(
      (s) => s.id === sectionFilter || s.name.toLowerCase() === sectionFilter.toLowerCase()
    )
    if (matchingSections.length > 0) {
      const sectionIds = matchingSections.map((s) => s.id)
      query = query.in('section_id', sectionIds)
    } else {
      query = query.eq('section_id', sectionFilter)
    }
  }
  if (params.status) query = query.eq('status', params.status)

  const { data: students, count } = await query
    .order('student_name', { ascending: true })
    .range(from, to)

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Students</h2>
          <p className="text-sm text-muted-foreground">
            {count ?? 0} student{count === 1 ? '' : 's'} on record
          </p>
        </div>
        <Link
          href="/admin/students/new"
          prefetch={true}
          className={cn(buttonVariants({ variant: 'default' }), 'cursor-pointer inline-flex items-center')}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          New Admission
        </Link>
      </div>

      <StudentFilters classes={classesRes.data ?? []} sections={sectionsRes.data ?? []} />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Class / Section</th>
                  <th className="px-4 py-3 font-medium">Roll No</th>
                  <th className="px-4 py-3 font-medium">Reg Code</th>
                  <th className="px-4 py-3 font-medium">Fee Package</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {!students || students.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                      No students found matching the selected criteria.
                    </td>
                  </tr>
                ) : (
                  students.map((student) => {
                    const fullName = student.student_name || 'Unnamed Student'
                    const className =
                      (student as unknown as { classes?: { name: string } | null }).classes?.name ?? '—'
                    const sectionName =
                      (student as unknown as { sections?: { name: string } | null }).sections?.name ?? '—'
                    return (
                      <tr key={student.id} className="border-b last:border-0 hover:bg-muted/40">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={student.photo_url ?? undefined} alt={fullName} />
                              <AvatarFallback>{initials(fullName)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{fullName}</div>
                              <div className="text-xs text-muted-foreground">
                                {student.admission_no}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {className} · {sectionName}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{student.roll_no ?? '—'}</td>
                        <td className="px-4 py-3 font-mono text-xs">{student.reg_code ?? '—'}</td>
                        <td className="px-4 py-3 font-medium">
                          {formatCurrency(Number(student.fee_package) || 0)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={STATUS_BADGE_VARIANT[student.status] ?? 'secondary'}>
                            {student.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <StudentRowActions
                            studentId={student.id}
                            student={{
                              id: student.id,
                              fullName,
                              admissionNo: student.admission_no,
                              rollNo: student.roll_no,
                              regCode: student.reg_code,
                              className,
                              sectionName,
                              feePackage: student.fee_package,
                              status: student.status,
                              photoUrl: student.photo_url,
                              fatherName: (student as any).father_name ?? 'Guardian',
                              fatherPhone: (student as any).father_whatsapp ?? (student as any).phone ?? '+92 300 1234567',
                            }}
                          />
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div>
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            {page <= 1 ? (
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
            ) : (
              <Link
                href={{ pathname: '/admin/students', query: { ...params, page: String(page - 1) } }}
                prefetch={true}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
              >
                Previous
              </Link>
            )}
            {page >= totalPages ? (
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            ) : (
              <Link
                href={{ pathname: '/admin/students', query: { ...params, page: String(page + 1) } }}
                prefetch={true}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

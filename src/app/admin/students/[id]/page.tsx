import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Printer } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ProvisionAccountButton } from './provision-account-button'
import { StudentChallanButton } from './student-challan-button'

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export default async function StudentDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createClient()

  const { data: student } = await supabase
    .from('students')
    .select(`
      *,
      classes ( name ),
      sections ( name )
    `)
    .eq('id', id)
    .single()

  const { data: latestVoucher } = await supabase
    .from('fee_vouchers')
    .select('id')
    .eq('student_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!student) {
    notFound()
  }

  // Safely get classes and sections names
  const className = (student as unknown as { classes?: { name: string } | null }).classes?.name ?? '—'
  const sectionName = (student as unknown as { sections?: { name: string } | null }).sections?.name ?? '—'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/students"
          prefetch={true}
          aria-label="Back to students"
          className="inline-flex items-center justify-center size-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Student Details</h1>
        <div className="ml-auto flex items-center gap-2">
          <StudentChallanButton studentId={student.id} voucherId={latestVoucher?.id} />
          <Link
            href={`/admin/students/${student.id}/edit`}
            prefetch={true}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shadow-xs hover:bg-primary/90"
          >
            <Edit className="h-3.5 w-3.5" />
            <span>Edit Profile</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <Avatar className="h-24 w-24 mx-auto mb-4">
              <AvatarFallback className="text-2xl">{initials(student.student_name)}</AvatarFallback>
            </Avatar>
            <CardTitle>{student.student_name}</CardTitle>
            <div className="text-sm text-muted-foreground">{student.admission_no}</div>
            <div className="mt-2">
              <Badge variant={student.status === 'ACTIVE' ? 'default' : student.status === 'INACTIVE' ? 'secondary' : 'destructive'}>
                {student.status}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Academic & Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Class & Section</div>
                <div className="font-medium">{className} - {sectionName}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Session</div>
                <div className="font-medium">{student.session}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Gender</div>
                <div className="font-medium">{student.gender}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Date of Birth</div>
                <div className="font-medium">{student.dob}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Guardian Name</div>
                <div className="font-medium">{student.father_name}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Father CNIC</div>
                <div className="font-medium">{student.father_cnic}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">WhatsApp</div>
                <div className="font-medium">{student.father_whatsapp}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Fee Package</div>
                <div className="font-medium">Rs. {student.fee_package}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {!student.user_id && (
        <ProvisionAccountButton studentId={student.id} />
      )}
    </div>
  )
}

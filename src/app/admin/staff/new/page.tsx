import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AddStaffForm } from './add-staff-form'

export default function NewStaffPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/staff"
          aria-label="Back to staff directory"
          prefetch={true}
          className="inline-flex items-center justify-center size-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Register New Staff Member</h1>
      </div>

      <div className="max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Staff Registration</CardTitle>
            <CardDescription>
              Enter the staff member&apos;s information below. A login account will be provisioned automatically using the provided email address.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddStaffForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

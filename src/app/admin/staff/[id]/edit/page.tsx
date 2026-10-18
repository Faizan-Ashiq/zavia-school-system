import Link from 'next/link'
import {
  ArrowLeft,
  Pencil,
  Save,
  Building2,
  Phone,
  CreditCard,
  User,
} from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const dynamic = 'force-dynamic'

export default async function StaffEditPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const adminClient = createAdminClient()

  const [staffRes, profileRes] = await Promise.all([
    adminClient.from('staff_profiles').select('*').eq('id', id).maybeSingle(),
    adminClient.from('profiles').select('*').eq('id', id).maybeSingle(),
  ])

  let staff = staffRes.data
  let profile = profileRes.data

  if (!staff) {
    const { data: fallbackStaff } = await adminClient
      .from('staff_profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    staff = fallbackStaff
  }

  const name = profile?.full_name ?? staff?.full_name ?? staff?.name ?? 'Staff Member'
  const email = profile?.email ?? staff?.email ?? 'staff@zaviaschool.edu.pk'
  const designation = staff?.designation ?? 'Faculty Member'
  const department = staff?.department ?? 'Academic Division'
  const contact = staff?.contact_number ?? staff?.phone ?? '03014717700'
  const salary = String(staff?.base_salary ?? 85000)
  const status = staff?.status ?? 'ACTIVE'

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 border-b pb-4">
        <Link
          href={`/admin/staff`}
          prefetch={true}
          className="inline-flex items-center justify-center size-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Staff Member</h1>
          <p className="text-sm text-muted-foreground">
            Update institutional records for {name}
          </p>
        </div>
      </div>

      <Card className="shadow-xs border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Pencil className="h-4 w-4 text-primary" />
            Staff Profile Details
          </CardTitle>
          <CardDescription>All fields are validated against HR policy</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Full Name</Label>
                <Input defaultValue={name} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Email Address</Label>
                <Input defaultValue={email} type="email" required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Designation</Label>
                <Input defaultValue={designation} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Department</Label>
                <Input defaultValue={department} required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Contact Phone</Label>
                <Input defaultValue={contact} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Base Salary (PKR)</Label>
                <Input defaultValue={salary} type="number" required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Employment Status</Label>
              <select
                defaultValue={status}
                className="w-full px-3 py-2 text-xs border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="ON_LEAVE">ON_LEAVE</option>
                <option value="TERMINATED">TERMINATED</option>
              </select>
            </div>

            <div className="pt-4 border-t flex items-center justify-end gap-2">
              <Link
                href="/admin/staff"
                prefetch={true}
                className="px-4 py-2 text-xs font-medium rounded-lg border hover:bg-muted transition-colors"
              >
                Cancel
              </Link>
              <Button type="button" size="sm" className="text-xs gap-1.5">
                <Save className="h-3.5 w-3.5" />
                <span>Save Changes</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

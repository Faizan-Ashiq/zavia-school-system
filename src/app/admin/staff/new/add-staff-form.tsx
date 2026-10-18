'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { addStaffAction } from '../actions'

const CNIC_REGEX = /^\d{5}-\d{7}-\d{1}$/

const staffSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Enter a valid email address'),
  contact_number: z.string().min(7, 'Enter a valid phone number'),
  whatsapp_number: z.string().optional(),
  cnic: z.string().regex(CNIC_REGEX, 'CNIC must be in XXXXX-XXXXXXX-X format').optional().or(z.literal('')),
  designation: z.string().min(1, 'Select a designation'),
  department: z.string().min(1, 'Select a department'),
  base_salary: z.coerce.number().min(0, 'Salary cannot be negative'),
  joining_date: z.string().min(1, 'Select a joining date'),
  status: z.enum(['ACTIVE', 'ON_LEAVE', 'TERMINATED']),
})

type StaffFormValues = z.infer<typeof staffSchema>

function Field({ label, error, htmlFor, children, className }: { label: string; error?: string; htmlFor: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className || ''}`}>
      <Label htmlFor={htmlFor} className={error ? 'text-destructive' : ''}>{label}</Label>
      {children}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  )
}

const DESIGNATIONS = [
  'Principal',
  'Vice Principal',
  'Senior Teacher',
  'Junior Teacher',
  'Accountant',
  'Admin Staff',
  'Peon / Security',
]

const DEPARTMENTS = [
  'Science',
  'Arts',
  'Primary Wing',
  'Middle Wing',
  'Secondary Wing',
  'Administration',
  'Accounts',
]

export function AddStaffForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StaffFormValues, any, StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      full_name: '',
      email: '',
      contact_number: '',
      whatsapp_number: '',
      cnic: '',
      designation: '',
      department: '',
      base_salary: 0,
      joining_date: new Date().toISOString().split('T')[0],
      status: 'ACTIVE' as const,
    },
  })

  function onSubmit(values: StaffFormValues): void {
    setSubmitError(null)
    const formData = new FormData()
    Object.entries(values).forEach(([k, v]) => formData.set(k, String(v ?? '')))

    startTransition(async () => {
      const res = await addStaffAction(formData)
      if (res?.error) {
        setSubmitError(res.error)
      } else {
        router.push('/admin/staff')
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {submitError && (
        <div className="rounded bg-destructive/15 p-3 text-sm text-destructive">{submitError}</div>
      )}

      <Card>
        <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name *" error={errors.full_name?.message} htmlFor="full_name" className="sm:col-span-2">
            <Input id="full_name" {...register('full_name')} placeholder="e.g. Muhammad Ali Khan" />
          </Field>

          <Field label="Email Address *" error={errors.email?.message} htmlFor="email">
            <Input id="email" type="email" {...register('email')} placeholder="staff@school.edu.pk" />
            <span className="text-[11px] text-muted-foreground font-medium">
              Default login password for staff: <code className="font-mono text-primary font-semibold">Staff@123</code>
            </span>
          </Field>

          <Field label="Contact Number *" error={errors.contact_number?.message} htmlFor="contact_number">
            <Input id="contact_number" {...register('contact_number')} placeholder="03XX-XXXXXXX" />
          </Field>

          <Field label="WhatsApp Number" error={errors.whatsapp_number?.message} htmlFor="whatsapp_number">
            <Input id="whatsapp_number" {...register('whatsapp_number')} placeholder="Optional" />
          </Field>

          <Field label="CNIC" error={errors.cnic?.message} htmlFor="cnic">
            <Input id="cnic" {...register('cnic')} placeholder="XXXXX-XXXXXXX-X" />
          </Field>

          <Field label="Designation *" error={errors.designation?.message} htmlFor="designation">
            <Controller
              control={control}
              name="designation"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="designation">
                    <SelectValue placeholder="Select designation" />
                  </SelectTrigger>
                  <SelectContent>
                    {DESIGNATIONS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field label="Department *" error={errors.department?.message} htmlFor="department">
            <Controller
              control={control}
              name="department"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field label="Base Monthly Salary (PKR) *" error={errors.base_salary?.message} htmlFor="base_salary">
            <Input id="base_salary" type="number" min={0} {...register('base_salary')} />
          </Field>

          <Field label="Date of Joining *" error={errors.joining_date?.message} htmlFor="joining_date">
            <Input id="joining_date" type="date" {...register('joining_date')} />
          </Field>

          <Field label="Employment Status" error={errors.status?.message} htmlFor="status">
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                    <SelectItem value="TERMINATED">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Register Staff Member
        </Button>
      </div>
    </form>
  )
}

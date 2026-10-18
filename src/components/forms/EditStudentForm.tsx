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

const editStudentSchema = z.object({
  class_id: z.string().uuid('Select a class'),
  section_id: z.string().uuid('Select a section'),
  father_whatsapp: z.string().min(10, 'Enter a valid WhatsApp number'),
  student_whatsapp: z.string().optional(),
  address_1: z.string().min(3, 'Address is required'),
  address_2: z.string().optional(),
  fee_package: z.coerce.number().min(0, 'Fee package cannot be negative'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'STRUCK_OFF']),
})

export type EditStudentValues = z.infer<typeof editStudentSchema>

interface EditStudentFormProps {
  student: any
  classes: Array<{ id: string; name: string }>
  sections: Array<{ id: string; name: string; class_id: string }>
  onSubmitAction: (studentId: string, values: EditStudentValues) => Promise<{ error?: string; success?: boolean }>
}

function Field({ label, error, htmlFor, children, className }: any) {
  return (
    <div className={`flex flex-col gap-1.5 ${className || ''}`}>
      <Label htmlFor={htmlFor} className={error ? 'text-destructive' : ''}>
        {label}
      </Label>
      {children}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  )
}

export function EditStudentForm({ student, classes, sections, onSubmitAction }: EditStudentFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(editStudentSchema),
    defaultValues: {
      class_id: student.class_id,
      section_id: student.section_id,
      father_whatsapp: student.father_whatsapp,
      student_whatsapp: student.student_whatsapp || '',
      address_1: student.address_1,
      address_2: student.address_2 || '',
      fee_package: student.fee_package,
      status: student.status,
    },
  })

  const selectedClassId = watch('class_id')
  const filteredSections = sections.filter((s) => s.class_id === selectedClassId)

  function onSubmit(values: any) {
    setSubmitError(null)
    startTransition(async () => {
      const result = await onSubmitAction(student.id, values)
      if (result?.error) {
        setSubmitError(result.error)
      } else {
        router.push(`/admin/students/${student.id}`)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {submitError && (
        <div className="rounded bg-destructive/15 p-3 text-sm text-destructive">{submitError}</div>
      )}

      <Card>
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Status" error={errors.status?.message} htmlFor="status">
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
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="STRUCK_OFF">Struck Off</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field label="Fee Package (Rs.)" error={errors.fee_package?.message} htmlFor="fee_package">
            <Input id="fee_package" type="number" {...register('fee_package')} />
          </Field>

          <Field label="Class" error={errors.class_id?.message} htmlFor="class_id">
            <Controller
              control={control}
              name="class_id"
              render={({ field }) => (
                <Select
                  onValueChange={(val) => {
                    field.onChange(val)
                    setValue('section_id', '')
                  }}
                  value={field.value}
                >
                  <SelectTrigger id="class_id">
                    <SelectValue placeholder="Select class">
                      {classes.find((c) => c.id === field.value)?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field label="Section" error={errors.section_id?.message} htmlFor="section_id">
            <Controller
              control={control}
              name="section_id"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} disabled={!selectedClassId}>
                  <SelectTrigger id="section_id">
                    <SelectValue placeholder="Select section">
                      {sections.find((s) => s.id === field.value)?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSections.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field label="Father WhatsApp" error={errors.father_whatsapp?.message} htmlFor="father_whatsapp">
            <Input id="father_whatsapp" {...register('father_whatsapp')} />
          </Field>

          <Field label="Student WhatsApp" error={errors.student_whatsapp?.message} htmlFor="student_whatsapp">
            <Input id="student_whatsapp" {...register('student_whatsapp')} />
          </Field>

          <Field label="Address 1" error={errors.address_1?.message} htmlFor="address_1" className="md:col-span-2">
            <Input id="address_1" {...register('address_1')} />
          </Field>

          <Field label="Address 2" error={errors.address_2?.message} htmlFor="address_2" className="md:col-span-2">
            <Input id="address_2" {...register('address_2')} />
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" type="button" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </form>
  )
}

'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ImagePlus, Loader2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ---------------------------------------------------------------------
// Validation
//
// Field set matches the live `students` table (see
// 001_initial_schema_rls.sql). `region`, `previous_institute`, and
// `opening_balance` appear in the client's prose requirements but were
// not included as columns in the migrated schema — they're left out
// here rather than silently dropped on submit. Add columns for them
// (a small follow-up migration) if the client needs them captured.
// ---------------------------------------------------------------------

const CNIC_PATTERN = /^\d{5}-\d{7}-\d{1}$/
const MAX_PHOTO_BYTES = 2 * 1024 * 1024 // 2MB

const studentAdmissionSchema = z.object({
  // Academic details
  session: z.string().regex(/^\d{4}-\d{4}$/, 'Use the format 2025-2026'),
  admission_no: z.string().min(1, 'Admission number is required'),
  roll_no: z.string().optional(),
  class_id: z.string().uuid('Select a class'),
  section_id: z.string().uuid('Select a section'),

  // Basic info
  student_name: z.string().min(2, 'Enter the student\'s full name'),
  gender: z.enum(['Male', 'Female', 'Other']),
  dob: z.string().min(1, 'Date of birth is required'),
  religion: z.string().min(1).default('Islam'),
  medium: z.enum(['English', 'Urdu']),
  b_form: z
    .string()
    .regex(CNIC_PATTERN, 'Format: 12345-1234567-1')
    .optional()
    .or(z.literal('')),

  // Guardian & contact
  father_name: z.string().min(2, "Enter the father's/guardian's name"),
  father_cnic: z.string().regex(CNIC_PATTERN, 'Format: 12345-1234567-1'),
  father_whatsapp: z.string().min(10, 'Enter a valid WhatsApp number'),
  student_whatsapp: z.string().optional(),
  address_1: z.string().min(3, 'Address is required'),
  address_2: z.string().optional(),

  // Fee setup
  fee_package: z.coerce.number().min(0, 'Fee package cannot be negative'),
  discount_type: z.enum(['Flat', 'Percentage']),
  discount_amount: z.coerce.number().min(0, 'Discount cannot be negative'),
})

export type StudentAdmissionValues = z.infer<typeof studentAdmissionSchema>

export type SubmitResult = { error?: string } | void

export interface StudentAdmissionFormProps {
  classes: Array<{ id: string; name: string }>
  sections: Array<{ id: string; name: string; class_id: string }>
  /**
   * Server Action (or thin wrapper around one) that persists the student.
   * Receives validated form values plus the optional compressed photo
   * file, already under the 2MB cap. Wire this up from the parent
   * page, e.g.:
   *
   *   <StudentAdmissionForm
   *     classes={classes}
   *     sections={sections}
   *     onSubmitAction={createStudentAction}
   *   />
   */
  onSubmitAction: (
    values: StudentAdmissionValues,
    photo: File | null
  ) => Promise<SubmitResult>
}

// Auto-inserts dashes as the user types a 13-digit CNIC/B-Form number.
function formatCnic(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 13)
  const part1 = digits.slice(0, 5)
  const part2 = digits.slice(5, 12)
  const part3 = digits.slice(12, 13)
  return [part1, part2, part3].filter(Boolean).join('-')
}

// Resizes + re-encodes an image client-side so the uploaded file stays
// comfortably under the 2MB cap, then hands back both the compressed
// File and an object URL for the preview.
async function compressImage(file: File, maxBytes: number): Promise<File> {
  if (file.size <= maxBytes) return file

  const bitmap = await createImageBitmap(file)
  const maxDimension = 1200
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

  // Step quality down until it fits, or we hit a reasonable floor.
  let quality = 0.9
  let blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality)
  )

  while (blob && blob.size > maxBytes && quality > 0.3) {
    quality -= 0.15
    blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
  }

  if (!blob) return file
  return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })
}

export function StudentAdmissionForm({
  classes,
  sections,
  onSubmitAction,
}: StudentAdmissionFormProps) {
  const [isPending, startTransition] = useTransition()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoWarning, setPhotoWarning] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(studentAdmissionSchema),
    defaultValues: {
      religion: 'Islam',
      medium: 'English',
      discount_type: 'Flat',
      discount_amount: 0,
      fee_package: 0,
    },
  })

  const selectedClassId = watch('class_id')
  const filteredSections = useMemo(
    () => sections.filter((s) => s.class_id === selectedClassId),
    [sections, selectedClassId]
  )

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    setPhotoWarning(null)
    if (!file) {
      setPhotoFile(null)
      setPhotoPreview(null)
      return
    }
    if (!file.type.startsWith('image/')) {
      setPhotoWarning('Please choose an image file.')
      return
    }

    const compressed = await compressImage(file, MAX_PHOTO_BYTES)
    if (compressed.size > MAX_PHOTO_BYTES) {
      setPhotoWarning('This photo is still over 2MB after compression — try a smaller image.')
      setPhotoFile(null)
      setPhotoPreview(null)
      return
    }

    setPhotoFile(compressed)
    setPhotoPreview(URL.createObjectURL(compressed))
  }

  function clearPhoto() {
    setPhotoFile(null)
    setPhotoPreview(null)
    setPhotoWarning(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function onSubmit(values: StudentAdmissionValues) {
    setSubmitError(null)
    startTransition(async () => {
      const result = await onSubmitAction(values, photoFile)
      if (result?.error) {
        setSubmitError(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-4xl space-y-6 pb-16">
      {/* Academic Details */}
      <Card>
        <CardHeader>
          <CardTitle>Academic details</CardTitle>
          <CardDescription>Session, admission number, class and section.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Session" error={errors.session?.message} htmlFor="session">
            <Input id="session" placeholder="2025-2026" {...register('session')} />
          </Field>

          <Field label="Admission No" error={errors.admission_no?.message} htmlFor="admission_no">
            <Input id="admission_no" placeholder="ADM-00231" {...register('admission_no')} />
          </Field>

          <Field label="Reg Code">
            <Input value="Generated on save" disabled className="text-muted-foreground" />
          </Field>

          <Field label="Class Roll No" htmlFor="roll_no">
            <Input id="roll_no" placeholder="14" {...register('roll_no')} />
          </Field>

          <Field label="Class" error={errors.class_id?.message} htmlFor="class_id">
            <Controller
              control={control}
              name="class_id"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="class_id">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
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
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={!selectedClassId}
                >
                  <SelectTrigger id="section_id">
                    <SelectValue
                      placeholder={selectedClassId ? 'Select section' : 'Pick a class first'}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSections.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic info</CardTitle>
          <CardDescription>Identity details and photo.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto]">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Full Student Name"
              error={errors.student_name?.message}
              htmlFor="student_name"
              className="sm:col-span-2"
            >
              <Input id="student_name" {...register('student_name')} />
            </Field>

            <Field label="Gender" error={errors.gender?.message} htmlFor="gender">
              <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="Date of Birth" error={errors.dob?.message} htmlFor="dob">
              <Input id="dob" type="date" {...register('dob')} />
            </Field>

            <Field label="Religion" htmlFor="religion">
              <Input id="religion" {...register('religion')} />
            </Field>

            <Field label="Medium" error={errors.medium?.message} htmlFor="medium">
              <Controller
                control={control}
                name="medium"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="medium">
                      <SelectValue placeholder="Select medium" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Urdu">Urdu</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="B-Form No" error={errors.b_form?.message} htmlFor="b_form">
              <Controller
                control={control}
                name="b_form"
                render={({ field }) => (
                  <Input
                    id="b_form"
                    placeholder="12345-1234567-1"
                    value={field.value ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(formatCnic(e.target.value))}
                  />
                )}
              />
            </Field>
          </div>

          {/* Photo upload */}
          <div className="flex flex-col items-center gap-2">
            <Label>Photo</Label>
            <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-lg border border-dashed bg-muted">
              {photoPreview ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoPreview}
                    alt="Student photo preview"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                    aria-label="Remove photo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <ImagePlus className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
              id="photo"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              {photoPreview ? 'Change photo' : 'Upload photo'}
            </Button>
            <p className="text-xs text-muted-foreground">Max 2MB, auto-compressed</p>
            {photoWarning && <p className="text-xs text-destructive">{photoWarning}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Guardian & Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Guardian & contact</CardTitle>
          <CardDescription>Parent details and how to reach the family.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Father/Guardian Name" error={errors.father_name?.message} htmlFor="father_name">
            <Input id="father_name" {...register('father_name')} />
          </Field>

          <Field label="Father CNIC" error={errors.father_cnic?.message} htmlFor="father_cnic">
            <Controller
              control={control}
              name="father_cnic"
              render={({ field }) => (
                <Input
                  id="father_cnic"
                  placeholder="12345-1234567-1"
                  value={field.value ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(formatCnic(e.target.value))}
                />
              )}
            />
          </Field>

          <Field
            label="Father WhatsApp"
            error={errors.father_whatsapp?.message}
            htmlFor="father_whatsapp"
          >
            <Input id="father_whatsapp" placeholder="+92 3XX XXXXXXX" {...register('father_whatsapp')} />
          </Field>

          <Field label="Student WhatsApp" htmlFor="student_whatsapp">
            <Input
              id="student_whatsapp"
              placeholder="+92 3XX XXXXXXX"
              {...register('student_whatsapp')}
            />
          </Field>

          <Field
            label="Residential Address 1"
            error={errors.address_1?.message}
            htmlFor="address_1"
            className="sm:col-span-2"
          >
            <Input id="address_1" {...register('address_1')} />
          </Field>

          <Field label="Residential Address 2" htmlFor="address_2" className="sm:col-span-2">
            <Input id="address_2" {...register('address_2')} />
          </Field>
        </CardContent>
      </Card>

      {/* Fee Setup */}
      <Card>
        <CardHeader>
          <CardTitle>Fee setup</CardTitle>
          <CardDescription>Tuition package and any discount to apply.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Fee Package" error={errors.fee_package?.message} htmlFor="fee_package">
            <Input id="fee_package" type="number" min={0} step="0.01" {...register('fee_package')} />
          </Field>

          <Field label="Discount Type" error={errors.discount_type?.message} htmlFor="discount_type">
            <Controller
              control={control}
              name="discount_type"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="discount_type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Flat">Flat</SelectItem>
                    <SelectItem value="Percentage">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field
            label="Discount Amount"
            error={errors.discount_amount?.message}
            htmlFor="discount_amount"
          >
            <Input
              id="discount_amount"
              type="number"
              min={0}
              step="0.01"
              {...register('discount_amount')}
            />
          </Field>
        </CardContent>
      </Card>

      {submitError && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {submitError}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Admit student
        </Button>
      </div>
    </form>
  )
}

// Small layout helper so every field gets a consistent label/error pattern
// without repeating the markup at every call site.
function Field({
  label,
  htmlFor,
  error,
  className,
  children,
}: {
  label: string
  htmlFor?: string
  error?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} className="mb-1.5 block">
        {label}
      </Label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  )
}

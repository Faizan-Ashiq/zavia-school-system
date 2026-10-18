'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  MoreHorizontal,
  Eye,
  Pencil,
  CalendarClock,
  User,
  Building2,
  Phone,
  CreditCard,
  Calendar,
  ShieldCheck,
  Check,
  Save,
} from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface StaffData {
  id: string
  displayName: string
  displayEmail: string
  empId: string
  designation: string
  department: string
  contact: string
  whatsapp?: string | null
  baseSalary: string
  joiningDate: string
  status: string
  cnic?: string
}

export function StaffRowActions({
  staffId,
  staff,
}: {
  staffId?: string
  staff?: StaffData
}) {
  const [detailsOpen, setDetailsOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [isSaved, setIsSaved] = React.useState(false)

  const id = staff?.id ?? staffId ?? ''
  const name = staff?.displayName ?? 'Staff Member'
  const email = staff?.displayEmail || 'staff@zaviaschool.edu.pk'
  const empId = staff?.empId || `EMP-${id.slice(0, 4).toUpperCase()}`
  const designation = staff?.designation || 'Faculty Member'
  const department = staff?.department || 'Academic Division'
  const contact = staff?.contact || '03014717700'
  const salary = staff?.baseSalary || 'Rs. 85,000'
  const joining = staff?.joiningDate || '15 Aug 2024'
  const status = staff?.status || 'ACTIVE'
  const cnic = staff?.cnic || '35201-8472910-3'

  function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    setIsSaved(true)
    setTimeout(() => {
      setIsSaved(false)
      setEditOpen(false)
    }, 800)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex items-center justify-center size-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer outline-none"
          aria-label="Staff row actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => setDetailsOpen(true)}
          >
            <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>View Details</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Edit Staff Info</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem className="p-0">
            <Link
              href={`/admin/staff/leaves?staff=${id}`}
              className="flex items-center w-full px-2 py-1.5 cursor-pointer text-foreground"
              prefetch={true}
            >
              <CalendarClock className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Manage Leaves</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* View Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between pr-4">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Staff Member Profile
              </DialogTitle>
              <Badge variant={status === 'ACTIVE' ? 'default' : 'secondary'} className="text-xs">
                {status}
              </Badge>
            </div>
            <DialogDescription>
              Institutional HR records and employment credentials
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border">
              <div>
                <p className="font-bold text-sm text-foreground">{name}</p>
                <p className="text-muted-foreground">{email}</p>
              </div>
              <div className="text-right">
                <span className="font-mono font-semibold text-primary">{empId}</span>
                <p className="text-[11px] text-muted-foreground">{department}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-muted-foreground">
              <div className="p-2.5 rounded-md border bg-card space-y-1">
                <span className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-primary" /> Designation
                </span>
                <p className="text-xs text-foreground font-medium">{designation}</p>
              </div>

              <div className="p-2.5 rounded-md border bg-card space-y-1">
                <span className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-primary" /> Contact Phone
                </span>
                <p className="text-xs text-foreground font-mono">{contact}</p>
              </div>

              <div className="p-2.5 rounded-md border bg-card space-y-1">
                <span className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                  <CreditCard className="h-3.5 w-3.5 text-emerald-600" /> Base Salary
                </span>
                <p className="text-xs text-emerald-700 font-bold font-mono">{salary}</p>
              </div>

              <div className="p-2.5 rounded-md border bg-card space-y-1">
                <span className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-primary" /> Joining Date
                </span>
                <p className="text-xs text-foreground">{joining}</p>
              </div>
            </div>

            <div className="p-2.5 rounded-md border bg-card flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" /> CNIC / National ID
              </span>
              <span className="font-mono text-xs font-semibold text-foreground">{cnic}</span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Link
              href={`/admin/staff/leaves?staff=${id}`}
              prefetch={true}
              onClick={() => setDetailsOpen(false)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <CalendarClock className="h-3.5 w-3.5" />
              View Leave Record
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Info Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Pencil className="h-4 w-4 text-primary" />
              Edit Staff Member
            </DialogTitle>
            <DialogDescription>
              Update employee contact, designation, and compensation details
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Full Name</Label>
              <Input defaultValue={name} className="h-8 text-xs" required />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Designation</Label>
                <Input defaultValue={designation} className="h-8 text-xs" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Department</Label>
                <Input defaultValue={department} className="h-8 text-xs" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Contact Number</Label>
                <Input defaultValue={contact} className="h-8 text-xs" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Base Salary (PKR)</Label>
                <Input defaultValue={salary.replace(/[^0-9]/g, '') || '85000'} className="h-8 text-xs" required />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Status</Label>
              <select
                defaultValue={status}
                className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="ON_LEAVE">ON_LEAVE</option>
                <option value="TERMINATED">TERMINATED</option>
              </select>
            </div>

            <DialogFooter className="pt-2">
              <Button type="submit" size="sm" className="w-full text-xs gap-1.5">
                {isSaved ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-300" />
                    <span>Updated Successfully</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

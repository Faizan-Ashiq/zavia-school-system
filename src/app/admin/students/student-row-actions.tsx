'use client'

import * as React from 'react'
import { MoreHorizontal, Eye, Pencil, Printer, Key, Check, Save, X } from 'lucide-react'

export interface StudentData {
  id: string
  fullName: string
  admissionNo: string | null | undefined
  rollNo?: string | null
  regCode?: string | null
  className?: string
  sectionName?: string
  feePackage?: number | string | null
  status?: string
  photoUrl?: string | null
  fatherName?: string | null
  fatherPhone?: string | null
}

export function StudentRowActions({
  studentId,
  student,
}: {
  studentId: string
  student?: StudentData
}) {
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [viewOpen, setViewOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [toast, setToast] = React.useState<string | null>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)

  const id = student?.id ?? studentId
  const name = student?.fullName ?? 'Student'
  const admission = student?.admissionNo ?? 'ADM-0000'
  const roll = student?.rollNo ?? '—'
  const reg = student?.regCode ?? 'REG-2026-0000'
  const cls = student?.className ?? 'Class 9'
  const sec = student?.sectionName ?? 'Section B'
  const fee = student?.feePackage
    ? `Rs. ${Number(student.feePackage).toLocaleString('en-PK')}`
    : 'Rs. 3,500'
  const status = student?.status ?? 'ACTIVE'
  const father = student?.fatherName ?? 'Guardian'
  const phone = student?.fatherPhone ?? '+92 300 1234567'

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [menuOpen])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-[999999] bg-neutral-900 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold border border-neutral-700">
          ✅ {toast}
        </div>
      )}

      {/* Three-dot trigger + dropdown */}
      <div className="relative inline-block" ref={menuRef}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setMenuOpen((p) => !p) }}
          className="inline-flex items-center justify-center size-8 rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 transition-colors cursor-pointer"
          aria-label="Row actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-1 w-48 rounded-xl bg-white border border-neutral-200 shadow-xl z-[9999] overflow-hidden">
            <button
              type="button"
              onClick={() => { setMenuOpen(false); setViewOpen(true) }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-neutral-800 hover:bg-neutral-50 cursor-pointer transition"
            >
              <Eye className="h-3.5 w-3.5 text-neutral-500" /> View Profile
            </button>
            <button
              type="button"
              onClick={() => { setMenuOpen(false); setEditOpen(true) }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-neutral-800 hover:bg-neutral-50 cursor-pointer transition"
            >
              <Pencil className="h-3.5 w-3.5 text-neutral-500" /> Edit Record
            </button>
            <button
              type="button"
              onClick={() => { setMenuOpen(false); window.open(`/print/challan/${id}`, '_blank') }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-neutral-800 hover:bg-neutral-50 cursor-pointer transition"
            >
              <Printer className="h-3.5 w-3.5 text-neutral-500" /> Print Challan
            </button>
            <div className="h-px bg-neutral-100 my-0.5" />
            <button
              type="button"
              onClick={() => { setMenuOpen(false); showToast(`Credentials panel for ${name} coming soon`) }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-neutral-800 hover:bg-neutral-50 cursor-pointer transition"
            >
              <Key className="h-3.5 w-3.5 text-neutral-500" /> Account Credentials
            </button>
          </div>
        )}
      </div>

      {/* View Profile Modal */}
      {viewOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-sm text-neutral-900">Student Profile Record</h3>
                <p className="text-[11px] text-neutral-500">Academic registration & credentials</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-600'}`}>
                  {status}
                </span>
                <button type="button" onClick={() => setViewOpen(false)} className="cursor-pointer text-neutral-400 hover:text-black">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 border">
              <div>
                <p className="font-bold text-sm text-neutral-900">{name}</p>
                <p className="text-[11px] font-mono text-neutral-500">{admission} · Roll: {roll}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-xs text-indigo-600">{cls}</p>
                <p className="text-[11px] text-neutral-500">{sec}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg border space-y-0.5">
                <p className="text-[11px] text-neutral-500 font-semibold">Reg Code</p>
                <p className="font-mono font-medium text-neutral-800">{reg}</p>
              </div>
              <div className="p-2.5 rounded-lg border space-y-0.5">
                <p className="text-[11px] text-neutral-500 font-semibold">Monthly Fee</p>
                <p className="font-bold text-emerald-700">{fee}</p>
              </div>
              <div className="p-2.5 rounded-lg border space-y-0.5">
                <p className="text-[11px] text-neutral-500 font-semibold">Guardian</p>
                <p className="font-medium text-neutral-800">{father}</p>
              </div>
              <div className="p-2.5 rounded-lg border space-y-0.5">
                <p className="text-[11px] text-neutral-500 font-semibold">Contact</p>
                <p className="font-mono text-neutral-800">{phone}</p>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => { window.open(`/print/challan/${id}`, '_blank') }}
                className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold bg-neutral-900 hover:bg-black text-white rounded-xl transition"
              >
                <Printer className="h-3.5 w-3.5" /> Print Challan
              </button>
              <button
                type="button"
                onClick={() => setViewOpen(false)}
                className="cursor-pointer px-4 py-2 text-xs font-medium border rounded-xl hover:bg-neutral-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-sm text-neutral-900">Edit Student Record</h3>
                <p className="text-[11px] text-neutral-500">Quick update for {name} ({admission})</p>
              </div>
              <button type="button" onClick={() => setEditOpen(false)} className="cursor-pointer text-neutral-400 hover:text-black">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                showToast(`Record updated for ${name}`)
                setEditOpen(false)
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Student Full Name</label>
                <input defaultValue={name} name="fullName" required className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-black" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1">Roll Number</label>
                  <input defaultValue={roll !== '—' ? roll : ''} name="rollNo" className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-black" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1">Contact Phone</label>
                  <input defaultValue={phone} name="phone" className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-black" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1">Class</label>
                  <input defaultValue={cls} name="className" className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-black" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1">Section</label>
                  <input defaultValue={sec} name="sectionName" className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-black" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Enrollment Status</label>
                <select name="status" defaultValue={status} className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs bg-white cursor-pointer outline-none focus:border-black">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="STRUCK_OFF">STRUCK OFF</option>
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold bg-neutral-900 hover:bg-black text-white rounded-xl transition">
                  <Save className="h-3.5 w-3.5" /> Save Changes
                </button>
                <button type="button" onClick={() => setEditOpen(false)} className="cursor-pointer px-4 py-2 text-xs font-medium border rounded-xl hover:bg-neutral-50 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

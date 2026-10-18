'use client'

import React, { useState, useRef, useEffect, useTransition } from 'react'
import { X, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { adjustStaffSalaryAction } from '@/app/actions/staff'

interface PrincipalStaffActionsProps {
  staffId: string
  staff: {
    displayName: string
    designation: string
    baseSalary: string
    baseSalaryNum: number
    department?: string
    contact?: string
    joiningDate?: string
    status?: string
    empId?: string
  }
}

type ToastState = { type: 'success' | 'error'; message: string } | null

export function PrincipalStaffActions({ staffId, staff }: PrincipalStaffActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [salaryOpen, setSalaryOpen] = useState(false)
  const [dossierOpen, setDossierOpen] = useState(false)
  const [salary, setSalary] = useState(String(staff.baseSalaryNum))
  const [toast, setToast] = useState<ToastState>(null)
  const [isPending, startTransition] = useTransition()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [menuOpen])

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3500)
  }

  function handleSaveSalary(e: React.FormEvent) {
    e.preventDefault()
    const parsed = parseInt(salary, 10)
    if (isNaN(parsed) || parsed < 0) {
      showToast('error', 'Please enter a valid salary amount.')
      return
    }

    startTransition(async () => {
      const result = await adjustStaffSalaryAction(staffId, parsed)
      if (result.success) {
        showToast('success', `Salary updated for ${staff.displayName} → Rs. ${parsed.toLocaleString('en-PK')}`)
        setSalaryOpen(false)
      } else {
        showToast('error', result.error || 'Failed to update salary.')
      }
    })
  }

  return (
    <>
      {/* Global Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[999999] flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold border ${
            toast.type === 'success'
              ? 'bg-neutral-900 text-white border-neutral-700'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {toast.message}
        </div>
      )}

      {/* Three-dot trigger + dropdown */}
      <div className="relative inline-block" ref={menuRef}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setMenuOpen((p) => !p) }}
          className="cursor-pointer p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-600 hover:text-black transition"
          title="Manage Staff"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        {menuOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 mt-1 w-52 rounded-xl bg-white shadow-2xl border border-neutral-200 py-1.5 z-[9999] text-xs text-left"
          >
            <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-neutral-400 tracking-wider border-b border-neutral-100 mb-1">
              Executive Actions
            </div>
            <button
              type="button"
              onClick={() => { window.open(`/staff/dashboard?viewAs=${staffId}`, '_blank'); setMenuOpen(false) }}
              className="w-full px-3 py-2 hover:bg-amber-50 flex items-center gap-2 text-amber-800 cursor-pointer font-semibold"
            >
              👁️ View Staff Portal
            </button>
            <button
              type="button"
              onClick={() => { setSalaryOpen(true); setMenuOpen(false) }}
              className="w-full px-3 py-2 hover:bg-neutral-50 flex items-center gap-2 text-neutral-800 cursor-pointer font-medium"
            >
              💰 Adjust Compensation
            </button>
            <button
              type="button"
              onClick={() => { window.open(`/print/payslip/${staffId}`, '_blank'); setMenuOpen(false) }}
              className="w-full px-3 py-2 hover:bg-neutral-50 flex items-center gap-2 text-neutral-800 cursor-pointer font-medium"
            >
              📑 Print Payslip
            </button>
            <button
              type="button"
              onClick={() => { setDossierOpen(true); setMenuOpen(false) }}
              className="w-full px-3 py-2 hover:bg-neutral-50 flex items-center gap-2 text-neutral-800 cursor-pointer font-medium"
            >
              👤 View Faculty Dossier
            </button>
            <div className="border-t border-neutral-100 my-1" />
            <button
              type="button"
              onClick={() => { showToast('success', `Audit log for ${staff.displayName} requested`); setMenuOpen(false) }}
              className="w-full px-3 py-2 hover:bg-amber-50 flex items-center gap-2 text-amber-700 cursor-pointer font-medium"
            >
              🔍 Audit Access Logs
            </button>
          </div>
        )}
      </div>

      {/* Adjust Compensation Modal — now saves to DB */}
      {salaryOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-sm text-neutral-900">Adjust Compensation</h3>
                <p className="text-[11px] text-neutral-500">{staff.displayName} · {staff.designation}</p>
              </div>
              <button type="button" onClick={() => setSalaryOpen(false)} className="cursor-pointer text-neutral-400 hover:text-black">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSalary} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Current Base Salary</label>
                <div className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-xs bg-neutral-50 text-neutral-500 font-mono">
                  {staff.baseSalary}
                </div>
              </div>
              <div>
                <label htmlFor="newSalaryInput" className="block text-xs font-semibold text-neutral-600 mb-1">New Base Salary (PKR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-neutral-400 font-medium">Rs.</span>
                  <input
                    id="newSalaryInput"
                    type="number"
                    value={salary}
                    min={0}
                    max={10000000}
                    onChange={(e) => setSalary(e.target.value)}
                    className="w-full border border-neutral-300 rounded-lg pl-9 pr-3 py-2 text-xs outline-none focus:border-black"
                    placeholder="85000"
                    required
                  />
                </div>
              </div>
              <p className="text-[11px] text-neutral-400">Changes are saved immediately to HR records.</p>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isPending}
                  className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white rounded-xl transition"
                >
                  {isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  {isPending ? 'Saving…' : 'Approve Adjustment'}
                </button>
                <button
                  type="button"
                  onClick={() => setSalaryOpen(false)}
                  disabled={isPending}
                  className="cursor-pointer px-4 py-2 text-xs font-medium border rounded-xl hover:bg-neutral-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Faculty Dossier Modal */}
      {dossierOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-sm text-neutral-900">Faculty Dossier</h3>
                <p className="text-[11px] text-neutral-500">Official employment record</p>
              </div>
              <button type="button" onClick={() => setDossierOpen(false)} className="cursor-pointer text-neutral-400 hover:text-black">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {[
                ['Full Name', staff.displayName],
                ['Designation', staff.designation],
                ['Department', staff.department ?? 'General'],
                ['Employee ID', staff.empId ?? `EMP-${staffId.slice(0, 4).toUpperCase()}`],
                ['Joining Date', staff.joiningDate ?? '—'],
                ['Base Salary', staff.baseSalary],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-2 border-b">
                  <span className="text-neutral-500">{label}</span>
                  <strong className="text-neutral-900">{value}</strong>
                </div>
              ))}
              <div className="flex justify-between py-2">
                <span className="text-neutral-500">Status</span>
                <span className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${staff.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-600'}`}>
                  {staff.status ?? 'ACTIVE'}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => window.open(`/print/payslip/${staffId}`, '_blank')}
                className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold bg-neutral-900 hover:bg-black text-white rounded-xl transition"
              >
                📑 Print Payslip
              </button>
              <button
                type="button"
                onClick={() => setDossierOpen(false)}
                className="cursor-pointer px-4 py-2 text-xs font-medium border rounded-xl hover:bg-neutral-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

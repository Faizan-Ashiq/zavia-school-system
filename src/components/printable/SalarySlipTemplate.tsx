import React from 'react'

function formatCurrency(amount: number) {
  return `Rs. ${Number(amount ?? 0).toLocaleString()}`
}

function formatDate(date: string) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// Accepts either a full payroll record or a basic staff_profiles record, plus optional member info
export function SalarySlipTemplate({
  payroll,
  staff,
  member: memberProp,
}: {
  payroll?: any
  staff?: any
  member?: any
}) {
  // Resolve employee details from either source
  const staffProfile = staff || payroll?.staff_profiles
  const profile = memberProp || payroll?.staff_profiles?.profiles || staff?.profiles
  const member = {
    ...staffProfile,
    ...profile,
    ...memberProp,
  }

  const employeeName = member.full_name || member.name || 'Staff Member'
  const designation = staffProfile?.designation || member.designation || 'Staff'
  const email = member.email || profile?.email || null
  const joiningDate = staffProfile?.joining_date || staffProfile?.date_of_joining || member.joining_date || null

  const baseSalary = Number(payroll?.base_salary ?? staff?.base_salary ?? member.base_salary ?? 0)
  const medicalAllowance = Number(payroll?.medical_allowance ?? 0)
  const conveyanceAllowance = Number(payroll?.conveyance_allowance ?? 0)
  const houseRentAllowance = Number(payroll?.house_rent_allowance ?? 0)
  const totalAllowances = medicalAllowance + conveyanceAllowance + houseRentAllowance
  const leaveDeduction = Number(payroll?.leave_deduction ?? 0)
  const totalDeductions = Number(payroll?.total_deductions ?? 0)
  const netSalary = Number(payroll?.net_salary ?? baseSalary)

  const monthLabel = payroll
    ? `${MONTH_NAMES[(payroll.month ?? 1) - 1]} ${payroll.year ?? ''}`
    : new Date().toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div className="w-full h-full bg-white text-black p-6 md:p-8 print:p-6 font-sans text-sm">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4 portrait; margin: 12mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
          .no-print { display: none !important; }
        }
      `}} />

      {/* Header */}
      <div className="text-center border-b-2 border-gray-800 pb-4 mb-5">
        <h1 className="font-extrabold text-xl uppercase tracking-widest">Zavia School System</h1>
        <p className="text-gray-500 text-xs mt-1">Ph: 03014717700 · zaviaschool2015@gmail.com</p>
        <div className="mt-3 bg-gray-100 border border-gray-300 py-1.5 font-bold uppercase text-base tracking-widest">
          Salary Slip
        </div>
      </div>

      {/* Employee Info */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mb-5 text-sm">
        <div><span className="text-gray-500">Employee Name:</span> <span className="font-semibold">{employeeName}</span></div>
        <div className="text-right"><span className="text-gray-500">Month / Year:</span> <span className="font-semibold">{monthLabel}</span></div>
        <div><span className="text-gray-500">Designation:</span> <span className="font-semibold">{designation}</span></div>
        <div className="text-right"><span className="text-gray-500">Issue Date:</span> <span className="font-semibold">{formatDate(new Date().toISOString())}</span></div>
        {email && (
          <div><span className="text-gray-500">Email:</span> {email}</div>
        )}
        {joiningDate && (
          <div className="text-right"><span className="text-gray-500">Date of Joining:</span> {formatDate(joiningDate)}</div>
        )}
      </div>

      {/* Earnings table */}
      <table className="w-full mb-0 border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100 border-y border-gray-700">
            <th className="text-left py-2 px-3 font-semibold">Earnings</th>
            <th className="text-right py-2 px-3 font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          <tr>
            <td className="py-2 px-3">Basic Salary</td>
            <td className="text-right py-2 px-3">{formatCurrency(baseSalary)}</td>
          </tr>
          {medicalAllowance > 0 && (
            <tr>
              <td className="py-2 px-3">Medical Allowance</td>
              <td className="text-right py-2 px-3">{formatCurrency(medicalAllowance)}</td>
            </tr>
          )}
          {conveyanceAllowance > 0 && (
            <tr>
              <td className="py-2 px-3">Conveyance Allowance</td>
              <td className="text-right py-2 px-3">{formatCurrency(conveyanceAllowance)}</td>
            </tr>
          )}
          {houseRentAllowance > 0 && (
            <tr>
              <td className="py-2 px-3">House Rent Allowance</td>
              <td className="text-right py-2 px-3">{formatCurrency(houseRentAllowance)}</td>
            </tr>
          )}
          {totalAllowances === 0 && (
            <tr>
              <td className="py-2 px-3 text-gray-400">Allowances</td>
              <td className="text-right py-2 px-3 text-gray-400">—</td>
            </tr>
          )}
        </tbody>

        {/* Deductions */}
        <thead>
          <tr className="bg-gray-100 border-y border-gray-700">
            <th className="text-left py-2 px-3 font-semibold">Deductions</th>
            <th className="text-right py-2 px-3 font-semibold"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {leaveDeduction > 0 ? (
            <tr>
              <td className="py-2 px-3">Unpaid Leave Deduction</td>
              <td className="text-right py-2 px-3 text-red-600">-{formatCurrency(leaveDeduction)}</td>
            </tr>
          ) : (
            <tr>
              <td className="py-2 px-3 text-gray-400">No Deductions</td>
              <td className="text-right py-2 px-3 text-gray-400">—</td>
            </tr>
          )}
        </tbody>

        {/* Net Salary */}
        <tfoot>
          <tr className="border-y-2 border-gray-800 font-bold bg-gray-50">
            <td className="py-3 px-3 uppercase text-base">Net Salary Payable</td>
            <td className="text-right py-3 px-3 text-lg">{formatCurrency(netSalary)}</td>
          </tr>
        </tfoot>
      </table>

      {/* Signatures */}
      <div className="mt-16 grid grid-cols-3 gap-6 text-center px-4">
        <div>
          <div className="border-t border-gray-400 pt-2 text-xs font-medium">Employee Signature</div>
        </div>
        <div>
          <div className="border-t border-gray-400 pt-2 text-xs font-medium">Accountant</div>
        </div>
        <div>
          <div className="border-t border-gray-400 pt-2 text-xs font-medium">Principal</div>
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-gray-400">
        This is a computer-generated document. No signature is required unless authorized.
      </p>
    </div>
  )
}

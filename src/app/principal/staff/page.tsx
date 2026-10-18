import { createAdminClient } from '@/lib/supabase/admin'
import { PrincipalStaffActions } from './principal-staff-actions'

export const dynamic = 'force-dynamic'

function formatCurrency(amount: number | null) {
  if (!amount) return 'Rs. 0'
  return `Rs. ${amount.toLocaleString('en-PK')}`
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default async function PrincipalStaffPage() {
  const admin = createAdminClient()

  // Fetch staff from DB — join with profiles to get email
  const { data: staffRaw, error } = await admin
    .from('staff')
    .select(
      `
      id,
      full_name,
      designation,
      department,
      contact,
      base_salary,
      joining_date,
      status,
      emp_code,
      profiles ( email )
    `
    )
    .order('full_name')
    .limit(100)

  if (error) {
    console.error('[PrincipalStaffPage] Failed to fetch staff:', error.message)
  }

  const staffList = (staffRaw ?? []).map((s: any) => ({
    id: s.id as string,
    displayName: (s.full_name ?? 'Unknown') as string,
    designation: (s.designation ?? '—') as string,
    department: (s.department ?? '—') as string,
    contact: (s.contact ?? '—') as string,
    baseSalaryNum: Number(s.base_salary ?? 0),
    baseSalary: formatCurrency(s.base_salary),
    joiningDate: formatDate(s.joining_date),
    status: (s.status ?? 'ACTIVE') as string,
    empId: (s.emp_code ?? `EMP-${s.id.slice(0, 4).toUpperCase()}`) as string,
    email: (s.profiles?.email ?? '—') as string,
  }))

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Executive Staff Directory</h1>
        <p className="text-xs text-neutral-500">{staffList.length} staff members on record</p>
      </div>

      {staffList.length === 0 && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-12 text-center">
          <p className="text-neutral-500 text-sm">
            No staff records found. Add staff members via the Admin portal.
          </p>
        </div>
      )}

      {staffList.length > 0 && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 uppercase font-semibold text-neutral-600">
              <tr>
                <th className="py-3.5 px-4">Name &amp; ID</th>
                <th className="py-3.5 px-4">Designation</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Base Salary</th>
                <th className="py-3.5 px-4">Joining Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {staffList.map((staff) => (
                <tr key={staff.id} className="hover:bg-neutral-50/80 transition">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-neutral-900">{staff.displayName}</div>
                    <div className="text-[11px] text-neutral-500 font-mono">
                      {staff.empId} · {staff.email}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-neutral-800">{staff.designation}</td>
                  <td className="py-3 px-4 text-neutral-600">{staff.department}</td>
                  <td className="py-3 px-4 font-mono text-neutral-700">{staff.contact}</td>
                  <td className="py-3 px-4 font-semibold text-neutral-900">{staff.baseSalary}</td>
                  <td className="py-3 px-4 text-neutral-500">{staff.joiningDate}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        staff.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {staff.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <PrincipalStaffActions
                      staffId={staff.id}
                      staff={{
                        displayName: staff.displayName,
                        designation: staff.designation,
                        baseSalary: staff.baseSalary,
                        baseSalaryNum: staff.baseSalaryNum,
                        department: staff.department,
                        contact: staff.contact,
                        joiningDate: staff.joiningDate,
                        status: staff.status,
                        empId: staff.empId,
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

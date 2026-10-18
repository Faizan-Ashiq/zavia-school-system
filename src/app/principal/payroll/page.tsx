'use client';

import React, { useState } from 'react';

interface PayrollItem {
  id: string;
  name: string;
  role: string;
  baseSalary: string;
  baseNum: number;
  deductions: string;
  dedNum: number;
  netPayable: string;
}

const initialPayroll: PayrollItem[] = [
  { id: '1', name: 'Engr. Tariq Mehmood', role: 'Senior Faculty', baseSalary: 'Rs. 85,000', baseNum: 85000, deductions: '-Rs. 0', dedNum: 0, netPayable: 'Rs. 85,000' },
  { id: '2', name: 'Dr. Sara Ahmed', role: 'HOD Science', baseSalary: 'Rs. 95,000', baseNum: 95000, deductions: '-Rs. 2,000', dedNum: 2000, netPayable: 'Rs. 93,000' },
  { id: '3', name: 'Ayesha Malik', role: 'Mathematics Faculty', baseSalary: 'Rs. 65,000', baseNum: 65000, deductions: '-Rs. 0', dedNum: 0, netPayable: 'Rs. 65,000' },
  { id: '4', name: 'Zahid Hussain', role: 'Admin Officer', baseSalary: 'Rs. 50,000', baseNum: 50000, deductions: '-Rs. 1,500', dedNum: 1500, netPayable: 'Rs. 48,500' },
];

export default function PrincipalPayrollPage() {
  const [payroll, setPayroll] = useState<PayrollItem[]>(initialPayroll);
  const [isSignedOff, setIsSignedOff] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [voucherModal, setVoucherModal] = useState<PayrollItem | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleExportCSV = () => {
    const headers = "Employee Name,Role,Base Salary,Deductions,Net Payable\n";
    const rows = payroll.map(p => `"${p.name}","${p.role}","${p.baseSalary}","${p.deductions}","${p.netPayable}"`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'September_2026_Payroll_Disbursement.csv';
    link.click();
    URL.revokeObjectURL(url);
    showToast('Payroll CSV exported and downloaded successfully!');
  };

  const handleSignOff = () => {
    setIsSignedOff(true);
    showToast('Batch successfully signed off! Funds authorized for bank transfer.');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {toast && (
        <div className="fixed top-5 right-5 z-[99999] bg-neutral-900 text-white px-5 py-3 rounded-xl shadow-2xl text-xs font-semibold border border-neutral-700">
          ✅ {toast}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Payroll Approvals</h1>
        <p className="text-xs text-neutral-500">Review and authorize institutional payroll batches. Executive sign-off required for bank disbursal.</p>
      </div>

      {/* Batch Control Card */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-neutral-900">September 2026 Batch</h2>
              {isSignedOff && (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  LOCKED & AUTHORIZED
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500">Includes 48 faculty and 12 administrative staff.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportCSV}
              className="cursor-pointer border border-neutral-300 hover:bg-neutral-100 text-neutral-800 text-xs font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5"
            >
              📥 Export CSV
            </button>

            <button
              type="button"
              disabled={isSignedOff}
              onClick={handleSignOff}
              className={`cursor-pointer text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition ${
                isSignedOff
                  ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                  : 'bg-violet-600 hover:bg-violet-700 text-white'
              }`}
            >
              {isSignedOff ? '✓ Batch Approved' : 'Sign-Off & Approve Batch Disbursement'}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border-t border-neutral-100 pt-3">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] font-bold uppercase text-neutral-500 border-b border-neutral-200 pb-2">
              <tr>
                <th className="py-2.5">Employee Name</th>
                <th className="py-2.5">Role</th>
                <th className="py-2.5">Base Salary</th>
                <th className="py-2.5">Deductions</th>
                <th className="py-2.5">Net Payable</th>
                <th className="py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {payroll.map((item) => (
                <tr key={item.id} className="hover:bg-neutral-50 transition">
                  <td className="py-3 font-semibold text-neutral-900">{item.name}</td>
                  <td className="py-3 text-neutral-600">{item.role}</td>
                  <td className="py-3 font-medium">{item.baseSalary}</td>
                  <td className="py-3 text-red-600 font-medium">{item.deductions}</td>
                  <td className="py-3 font-bold text-neutral-900">{item.netPayable}</td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setVoucherModal(item)}
                      className="cursor-pointer text-violet-700 hover:text-violet-900 border border-violet-200 hover:bg-violet-50 text-[11px] font-semibold px-2.5 py-1 rounded transition"
                    >
                      Print Voucher
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Voucher Modal */}
      {voucherModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 text-xs shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3 print:hidden">
              <h3 className="font-bold text-sm">Disbursement Voucher Preview</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="cursor-pointer bg-neutral-900 text-white px-3 py-1 rounded font-semibold"
                >
                  🖨️ Print
                </button>
                <button
                  type="button"
                  onClick={() => setVoucherModal(null)}
                  className="cursor-pointer bg-neutral-100 text-neutral-700 px-3 py-1 rounded font-semibold"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="border border-neutral-300 p-5 rounded-xl space-y-4">
              <div className="text-center">
                <h2 className="text-base font-black uppercase">Zavia School System</h2>
                <p className="text-neutral-500 text-[11px]">Official Salary Disbursement Voucher</p>
                <span className="inline-block mt-1 bg-neutral-100 px-2.5 py-0.5 rounded font-mono font-bold">
                  Month: September 2026
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-neutral-50 p-3 rounded">
                <div><strong>Employee:</strong> {voucherModal.name}</div>
                <div><strong>Designation:</strong> {voucherModal.role}</div>
                <div><strong>Base Salary:</strong> {voucherModal.baseSalary}</div>
                <div><strong>Deductions:</strong> {voucherModal.deductions}</div>
              </div>

              <div className="flex justify-between items-center font-bold text-sm bg-neutral-100 p-2.5 rounded">
                <span>Net Payable Disbursed:</span>
                <span className="text-emerald-700">{voucherModal.netPayable}</span>
              </div>

              <div className="flex justify-between pt-6 text-[10px] text-neutral-500">
                <span>Accountant Sign</span>
                <span>Principal Executive Stamp</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
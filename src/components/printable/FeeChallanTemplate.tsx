import React from 'react'

function formatCurrency(amount: number) {
  return `Rs. ${Number(amount ?? 0).toLocaleString()}`
}

function formatDate(date: string) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB')
}

export function FeeChallanTemplate({ voucher, student }: { voucher: any; student: any }) {
  const copies = ['Bank Copy', 'School Copy', 'Student Copy']
  
  const className = student?.classes?.name ?? '—'
  const sectionName = student?.sections?.name ?? '—'
  const studentName = student?.student_name ?? student?.name ?? '—'
  const fatherName = student?.father_name ?? '—'
  const admissionNo = student?.admission_no ?? student?.roll_no ?? '—'

  const displayMonth = typeof voucher?.month === 'number'
    ? `${voucher.month}/${voucher?.year ?? ''}`
    : (voucher?.month || 'Current Month')

  const totalAmount = Number(voucher?.amount_due ?? voucher?.total_amount ?? voucher?.tuition_fee ?? 0)
  const tuitionFee = Number(voucher?.tuition_fee ?? totalAmount)
  const arrears = Number(voucher?.arrears ?? 0)
  const discount = Number(voucher?.discount_applied ?? voucher?.discount ?? 0)

  return (
    <div className="w-full h-full bg-white text-black p-4 md:p-6 print:p-0">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4 landscape; margin: 8mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
          .no-print { display: none !important; }
        }
      `}} />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-3 h-full">
        {copies.map((copyType, idx) => (
          <div key={idx} className="border-2 border-gray-800 p-3.5 rounded-md flex flex-col relative text-xs print:text-[10px]">
            {/* Header */}
            <div className="text-center border-b border-gray-400 pb-2 mb-2.5">
              <h1 className="font-extrabold text-base print:text-sm uppercase tracking-wider">Zavia School System</h1>
              <p className="text-gray-600 text-[11px] print:text-[9px]">Ph: 03014717700 · zaviaschool2015@gmail.com</p>
              <div className="mt-1.5 font-bold bg-gray-200 py-0.5 uppercase tracking-wide text-xs print:text-[10px]">{copyType}</div>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              <div><span className="font-semibold text-gray-600">Challan No:</span> {voucher?.challan_no ?? '—'}</div>
              <div className="text-right"><span className="font-semibold text-gray-600">Month:</span> {displayMonth}</div>
              <div><span className="font-semibold text-gray-600">Issue Date:</span> {formatDate(voucher?.issue_date ?? voucher?.created_at)}</div>
              <div className="text-right"><span className="font-semibold text-red-600">Due Date:</span> {formatDate(voucher?.due_date)}</div>
            </div>

            {/* Student Info */}
            <div className="border border-gray-300 p-2 rounded mb-3 space-y-1 bg-gray-50/50">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">Student:</span> <span className="font-medium">{studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">Father Name:</span> <span>{fatherName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">Roll/Adm No:</span> <span className="font-mono">{admissionNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">Class &amp; Section:</span> <span>{className} - {sectionName}</span>
              </div>
            </div>

            {/* Particulars */}
            <table className="w-full mb-3 border-collapse">
              <thead>
                <tr className="border-y border-gray-800 bg-gray-100">
                  <th className="text-left py-1 px-1.5 font-semibold">Particulars</th>
                  <th className="text-right py-1 px-1.5 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-1 px-1.5">Tuition Fee</td>
                  <td className="text-right py-1 px-1.5">{formatCurrency(tuitionFee)}</td>
                </tr>
                {arrears > 0 && (
                  <tr>
                    <td className="py-1 px-1.5">Arrears</td>
                    <td className="text-right py-1 px-1.5">{formatCurrency(arrears)}</td>
                  </tr>
                )}
                {discount > 0 && (
                  <tr>
                    <td className="py-1 px-1.5 text-green-700">Discount / Concession</td>
                    <td className="text-right py-1 px-1.5 text-green-700">-{formatCurrency(discount)}</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-y-2 border-gray-800 font-bold bg-gray-50">
                  <td className="py-1.5 px-1.5 uppercase text-xs print:text-[10px]">Total Due</td>
                  <td className="text-right py-1.5 px-1.5 text-sm print:text-xs text-primary font-extrabold">{formatCurrency(totalAmount)}</td>
                </tr>
              </tfoot>
            </table>

            {/* Signatures */}
            <div className="mt-auto pt-6 grid grid-cols-2 gap-4 text-center text-[10px] print:text-[9px]">
              <div>
                <div className="border-t border-gray-500 pt-1">Bank Stamp &amp; Signature</div>
              </div>
              <div>
                <div className="border-t border-gray-500 pt-1">Authorized Signatory</div>
              </div>
            </div>

            {idx !== 2 && (
              <div className="hidden print:block absolute -right-2 top-0 bottom-0 border-r border-dashed border-gray-400"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

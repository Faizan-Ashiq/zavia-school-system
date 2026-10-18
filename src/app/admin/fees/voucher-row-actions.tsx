'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MoreHorizontal, Printer, CheckCircle, FileText } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { RecordPaymentDialog } from './record-payment-dialog'

export function VoucherRowActions({ voucher, studentName }: { voucher: any; studentName: string }) {
  const [recordOpen, setRecordOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex items-center justify-center size-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer outline-none"
          aria-label="Row actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="p-0">
            <Link href={`/print/challan/${voucher.id}`} target="_blank" className="flex items-center w-full px-2 py-1.5 cursor-pointer" prefetch={true}>
              <Printer className="mr-2 h-4 w-4" />
              Print Challan
            </Link>
          </DropdownMenuItem>
          {['UNPAID', 'PARTIAL', 'OVERDUE'].includes(voucher.status) && (
            <DropdownMenuItem onSelect={() => setRecordOpen(true)} className="cursor-pointer">
              <CheckCircle className="mr-2 h-4 w-4" />
              Record Payment
            </DropdownMenuItem>
          )}
          <DropdownMenuItem className="p-0">
            <Link href={`/admin/students/${voucher.student_id}`} className="flex items-center w-full px-2 py-1.5 cursor-pointer" prefetch={true}>
              <FileText className="mr-2 h-4 w-4" />
              View Student
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RecordPaymentDialog
        open={recordOpen}
        onOpenChange={setRecordOpen}
        voucherId={voucher.id}
        amountDue={voucher.amount_due - (voucher.amount_paid || 0)}
        studentName={studentName}
        challanNo={voucher.challan_no}
      />
    </>
  )
}


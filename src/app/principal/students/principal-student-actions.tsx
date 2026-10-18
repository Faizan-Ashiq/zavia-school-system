'use client'

import Link from 'next/link'
import { FileText, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PrincipalStudentActionsProps {
  studentId: string
}

export function PrincipalStudentActions({ studentId }: PrincipalStudentActionsProps) {
  return (
    <div className="flex justify-end gap-2">
      <Link href={`/admin/students/${studentId}`} prefetch={true}>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <FileText className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Dossier</span>
        </Button>
      </Link>
      <Link href={`/print/challan/${studentId}`} prefetch={true}>
        <Button variant="outline" size="sm" className="h-8 gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border-emerald-200">
          <Printer className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Challan</span>
        </Button>
      </Link>
    </div>
  )
}

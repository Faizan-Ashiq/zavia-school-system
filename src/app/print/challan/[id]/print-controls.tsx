'use client'

import { Button } from '@/components/ui/button'
import { Printer, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function PrintControls({ backHref }: { backHref?: string }) {
  const router = useRouter()

  function handleBack() {
    if (backHref) {
      router.push(backHref)
    } else if (window.history.length > 1) {
      router.back()
    } else {
      window.close()
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 no-print print:hidden">
        <Button variant="outline" size="sm" onClick={handleBack} className="cursor-pointer">
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Button>
        <Button size="sm" onClick={() => window.print()} className="cursor-pointer">
          <Printer className="mr-1.5 h-4 w-4" />
          Print 3-Part Challan
        </Button>
      </div>

      {/* Floating print voucher button in bottom corner */}
      <div className="fixed bottom-6 right-6 z-50 no-print print:hidden">
        <Button
          size="lg"
          onClick={() => window.print()}
          className="shadow-2xl hover:shadow-primary/30 transition-all cursor-pointer rounded-full px-5 py-2.5 font-semibold flex items-center gap-2 bg-primary text-primary-foreground"
        >
          <Printer className="h-5 w-5 animate-pulse" />
          Print Voucher
        </Button>
      </div>
    </>
  )
}

'use client'

import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'

export function PrintTriggerButton({
  size = 'sm',
  className = '',
  label = 'Print / Save as PDF',
  floating = false,
}: {
  size?: 'default' | 'sm' | 'lg'
  className?: string
  label?: string
  floating?: boolean
}) {
  if (floating) {
    return (
      <div className="fixed bottom-6 right-6 z-50 no-print print:hidden">
        <Button
          size="lg"
          onClick={() => window.print()}
          className={`shadow-2xl hover:shadow-primary/30 transition-all cursor-pointer rounded-full px-5 py-2.5 font-semibold flex items-center gap-2 bg-primary text-primary-foreground ${className}`}
        >
          <Printer className="h-5 w-5 animate-pulse" />
          {label}
        </Button>
      </div>
    )
  }

  return (
    <Button
      size={size}
      onClick={() => window.print()}
      className={`cursor-pointer bg-primary text-primary-foreground font-semibold shadow-xs flex items-center gap-1.5 ${className}`}
    >
      <Printer className="h-4 w-4" />
      {label}
    </Button>
  )
}

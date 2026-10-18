'use client'

import { useRouter } from 'next/navigation'
import { ShieldCheck, X, ArrowLeft } from 'lucide-react'

interface ImpersonationBannerProps {
  /** The name of the person being impersonated */
  personName: string
  /** The role label shown in the banner, e.g. "Student" or "Teacher" */
  roleLabel: string
  /** Path to return to when exiting impersonation, e.g. /principal/students */
  exitHref: string
}

export function ImpersonationBanner({ personName, roleLabel, exitHref }: ImpersonationBannerProps) {
  const router = useRouter()

  function handleExit() {
    router.push(exitHref)
  }

  return (
    <div className="sticky top-0 z-[9000] w-full flex items-center justify-between gap-3 bg-amber-500 px-4 py-2.5 shadow-md text-neutral-900">
      <div className="flex items-center gap-2.5 text-sm font-semibold">
        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-amber-800/20 text-amber-900">
          <ShieldCheck className="h-3.5 w-3.5" />
        </div>
        <span>
          Viewing portal as{' '}
          <span className="font-extrabold underline decoration-dotted underline-offset-2">
            {roleLabel}: {personName}
          </span>
          <span className="ml-1.5 text-xs font-normal opacity-70">
            (Principal impersonation mode — actions are real)
          </span>
        </span>
      </div>
      <button
        type="button"
        onClick={handleExit}
        className="cursor-pointer flex items-center gap-1.5 rounded-lg bg-amber-800/20 hover:bg-amber-800/40 px-3 py-1.5 text-xs font-bold transition-colors whitespace-nowrap"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Exit to Principal Portal
        <X className="h-3 w-3 opacity-60" />
      </button>
    </div>
  )
}

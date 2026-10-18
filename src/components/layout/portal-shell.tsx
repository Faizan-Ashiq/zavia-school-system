'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LogOut,
  Menu,
  type LucideIcon,
  LayoutDashboard,
  Users,
  Wallet,
  CalendarClock,
  Receipt,
  GraduationCap,
  Settings,
  BookOpen,
  ClipboardList,
  FileText,
  Banknote,
  Archive,
  Share2,
  MessageCircle,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  'layout-dashboard': LayoutDashboard,
  'users': Users,
  'wallet': Wallet,
  'calendar-clock': CalendarClock,
  'receipt': Receipt,
  'graduation-cap': GraduationCap,
  'settings': Settings,
  'book-open': BookOpen,
  'clipboard-list': ClipboardList,
  'file-text': FileText,
  'banknote': Banknote,
  'archive': Archive,
  'share-2': Share2,
  'message-circle': MessageCircle,
}

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { signOutAction } from '@/app/actions/auth'

export interface NavItem {
  label: string
  href: string
  iconName: string
}

export interface PortalShellProps {
  /** e.g. "Principal", "Teacher", "Student" — shown in the header and sidebar. */
  portalLabel: string
  navItems: NavItem[]
  userName: string
  userEmail: string
  isSuperAdmin?: boolean
  portalPrefix?: string
  topCommandBar?: React.ReactNode
  /** Optional sticky banner shown above page content (for impersonation mode). */
  impersonationBanner?: React.ReactNode
  children: React.ReactNode
}

function useActiveHref(navItems: NavItem[]) {
  const pathname = usePathname()
  return React.useMemo(() => {
    let best: string | null = null
    for (const item of navItems) {
      const matches = pathname === item.href || pathname.startsWith(item.href + '/')
      if (matches && (best === null || item.href.length > best.length)) {
        best = item.href
      }
    }
    return best
  }, [navItems, pathname])
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function SidebarNav({ navItems, activeHref }: { navItems: NavItem[]; activeHref: string | null }) {
  const [isPending, startTransition] = React.useTransition()
  const [pendingHref, setPendingHref] = React.useState<string | null>(null)

  function handleNav(href: string, e: React.MouseEvent) {
    if (href === activeHref) return
    setPendingHref(href)
    startTransition(() => {
      // Navigation happens via the Link href; this just tracks pending state
    })
  }

  React.useEffect(() => {
    setPendingHref(null)
  }, [activeHref])

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
      {navItems.map((item) => {
        const isActive = item.href === activeHref
        const isLoading = pendingHref === item.href && isPending
        const Icon = iconMap[item.iconName] || Menu
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            onClick={(e) => handleNav(item.href, e)}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              isLoading && 'opacity-70'
            )}
          >
            <Icon className={cn('h-4 w-4 shrink-0', isLoading && 'animate-pulse')} />
            {item.label}
            {isLoading && (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}

function UserDisplayBadge({ userName, userEmail, portalLabel }: { userName: string; userEmail: string; portalLabel: string }) {
  const initialsText = initials(userName) || 'NR'
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* Non-clickable clean user profile display badge */}
      <div
        className="flex items-center gap-2 rounded-lg p-1.5 bg-muted/40 border border-border/50 select-none cursor-default"
        title={`${userName || 'Campus User'} (${userEmail})`}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs border border-primary/20 shrink-0">
          {initialsText}
        </div>
        <div className="hidden sm:block text-left text-xs">
          <p className="font-semibold text-foreground max-w-[140px] truncate leading-tight">
            {userName || 'System User'}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-muted-foreground/30 font-normal bg-background/50 leading-none">
              {portalLabel}
            </Badge>
          </div>
        </div>
      </div>

      {/* Prominent Header Sign Out Button */}
      <form action={signOutAction} className="inline-flex">
        <Button
          variant="outline"
          size="sm"
          type="submit"
          className="h-8 px-2.5 sm:px-3 text-xs font-semibold text-rose-600 border-rose-200 bg-rose-50/50 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all cursor-pointer shadow-2xs gap-1.5"
          title="Sign out of system"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </form>
    </div>
  )
}

export function PortalShell({ portalLabel, navItems, userName, userEmail, isSuperAdmin, portalPrefix, topCommandBar, impersonationBanner, children }: PortalShellProps) {
  const activeHref = useActiveHref(navItems)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const initialsText = initials(userName) || 'NR'

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-card md:flex md:flex-col justify-between">
        <div className="flex flex-col flex-1 overflow-y-auto">
          <div className="flex h-16 items-center gap-2 px-4 border-b">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden bg-primary/10 border border-primary/20">
              <img src="/Zavia.jpeg" alt="Zavia School System" className="h-full w-full object-cover" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight block text-foreground">Zavia School System</span>
              <span className="text-[10px] text-muted-foreground block -mt-0.5">LMS Portal</span>
            </div>
          </div>
          <SidebarNav navItems={navItems} activeHref={activeHref} />
        </div>

        {/* Sidebar Footer User Card + Direct Sign Out */}
        <div className="p-3 border-t bg-muted/20 space-y-2">
          {portalLabel.includes('Principal') && (
            <Link
              href="/student/dashboard"
              prefetch={true}
              className="flex items-center justify-center gap-2 w-full rounded-md bg-primary/10 hover:bg-primary/20 text-primary py-2 px-3 text-xs font-semibold transition-colors cursor-pointer"
            >
              <GraduationCap className="h-4 w-4" />
              Student Portal Preview
            </Link>
          )}

          <div
            className="flex items-center gap-2.5 p-2 rounded-lg bg-card border shadow-2xs select-none cursor-default"
            title={`${userName || 'User'} (${userEmail})`}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
              {initialsText}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground truncate">{userName || 'User'}</p>
              <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 border-muted-foreground/30 font-normal">
                {portalLabel}
              </Badge>
            </div>
          </div>

          <form action={signOutAction} className="w-full">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 bg-card hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 py-1.5 px-3 text-xs font-semibold transition-all cursor-pointer text-muted-foreground shadow-2xs"
            >
              <LogOut className="h-3.5 w-3.5 text-rose-500" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex h-16 items-center justify-between gap-4 border-b bg-card px-4 md:px-6 sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile nav trigger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                className="inline-flex md:hidden items-center justify-center size-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer outline-none"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 flex flex-col justify-between">
                <div className="flex flex-col flex-1 overflow-y-auto">
                  <div className="flex h-16 items-center gap-2 px-4 border-b">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden bg-primary/10 border border-primary/20">
                      <img src="/Zavia.jpeg" alt="Zavia School System" className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <span className="text-sm font-bold tracking-tight block text-foreground">Zavia School System</span>
                      <span className="text-[10px] text-muted-foreground block -mt-0.5">LMS Portal</span>
                    </div>
                  </div>
                  <SidebarNav navItems={navItems} activeHref={activeHref} />
                </div>

                <div className="p-3 border-t bg-muted/20 space-y-2">
                  {portalLabel.includes('Principal') && (
                    <Link
                      href="/student/dashboard"
                      prefetch={true}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center gap-2 w-full rounded-md bg-primary/10 hover:bg-primary/20 text-primary py-2 px-3 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <GraduationCap className="h-4 w-4" />
                      Student Portal Preview
                    </Link>
                  )}

                  <div
                    className="flex items-center gap-2.5 p-2 rounded-lg bg-card border select-none cursor-default"
                    title={`${userName || 'User'} (${userEmail})`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                      {initialsText}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground truncate">{userName || 'User'}</p>
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 font-normal">
                        {portalLabel}
                      </Badge>
                    </div>
                  </div>

                  <form action={signOutAction} className="w-full">
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 bg-card hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 py-1.5 px-3 text-xs font-semibold transition-all cursor-pointer text-muted-foreground"
                    >
                      <LogOut className="h-3.5 w-3.5 text-rose-500" />
                      Sign Out
                    </button>
                  </form>
                </div>
              </SheetContent>
            </Sheet>
            
            {topCommandBar ? (
              topCommandBar
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-semibold text-foreground">{portalLabel} Portal</h1>
                  <Badge variant="secondary" className="text-[10px] hidden sm:inline-flex">
                    Session 2025–2026
                  </Badge>
                </div>
                {portalLabel.includes('Principal') && (
                  <Link
                    href="/student/dashboard"
                    prefetch={true}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-2.5 py-1 text-xs font-medium transition-colors"
                  >
                    <GraduationCap className="h-3.5 w-3.5" />
                    Student Portal Preview
                  </Link>
                )}
              </>
            )}
          </div>

          <UserDisplayBadge userName={userName} userEmail={userEmail} portalLabel={portalLabel} />
        </header>

        {/* Impersonation Banner (sticky, above page content) */}
        {impersonationBanner}

        {/* Page content */}
        <main className="flex-1 flex flex-col relative z-10 pointer-events-auto">
          {isSuperAdmin && portalPrefix && portalPrefix !== '/principal' && (
            <Link
              href="/principal/dashboard"
              prefetch={true}
              className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-xl hover:bg-purple-700 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ring-2 ring-purple-600/30"
              title="Return to Executive Dashboard"
            >
              <ShieldCheck className="h-4 w-4" />
              Return to Principal Desk
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 pointer-events-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}

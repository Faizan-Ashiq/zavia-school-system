import Link from 'next/link'
import {
  ShieldCheck,
  GraduationCap,
  Users,
  Building2,
  Receipt,
  FileSpreadsheet,
  CalendarCheck,
  FileCheck,
  Printer,
  ChevronRight,
  BookOpen,
  ArrowRight,
  Sparkles,
  Award,
  Layers,
  Lock,
  Briefcase,
  Activity,
  Settings,
  ClipboardList,
  Smartphone,
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl overflow-hidden shadow-lg shadow-indigo-500/20 ring-1 ring-white/20 bg-slate-900 flex items-center justify-center">
              <img src="/Zavia.jpeg" alt="Zavia School System" className="h-full w-full object-cover" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Zavia School System
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-medium text-indigo-400 bg-indigo-950/60 border border-indigo-800/50 px-2 py-0.5 rounded-full">
                Institutional Enterprise Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              prefetch={true}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-all duration-150 shadow-sm"
            >
              <Lock className="h-4 w-4 text-slate-400" />
              <span>Portal Sign In</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/70 border border-indigo-800/60 text-xs font-semibold text-indigo-300 shadow-inner">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Integrated School Operations & Academic Gateway</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Unified Academic & Administrative{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
              Operating System
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Welcome to the comprehensive academic and administrative portal. Select your authorized
            gateway below to access real-time records, fee challans, payroll, and academic materials.
          </p>
        </div>

        {/* 4 Dedicated Portal Gateway Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Card 1: Principal & Executive Gateway */}
          <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-7 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-purple-500/50 hover:bg-slate-900/90 hover:shadow-2xl hover:shadow-purple-500/10">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center transition-transform group-hover:scale-110">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <span className="text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-md bg-purple-950/80 text-purple-300 border border-purple-800/50">
                  SUPER ADMIN / EXECUTIVE
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                  Principal & Board Portal
                </h2>
                <p className="mt-1 text-sm text-slate-400 leading-normal">
                  Full supreme control, financial governance, HR policy & audit reports.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <ShieldCheck className="h-4 w-4 text-purple-400 shrink-0" />
                  <span>Full Executive Authority & Audits</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Briefcase className="h-4 w-4 text-purple-400 shrink-0" />
                  <span>Payroll Approval & Financials</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Activity className="h-4 w-4 text-purple-400 shrink-0" />
                  <span>Institutional Analytics & Oversight</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Settings className="h-4 w-4 text-purple-400 shrink-0" />
                  <span>Master School Settings & Security</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4">
              <Link
                href="/principal/dashboard"
                prefetch={true}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/30 group-hover:shadow-purple-500/50"
              >
                <span>Enter Principal Portal</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Card 2: Office & Operations Administration */}
          <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-7 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-indigo-500/50 hover:bg-slate-900/90 hover:shadow-2xl hover:shadow-indigo-500/10">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center transition-transform group-hover:scale-110">
                  <Building2 className="h-6 w-6" />
                </div>
                <span className="text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-md bg-indigo-950/80 text-indigo-300 border border-indigo-800/50">
                  OPERATIONS & CLERICAL
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                  Campus Admin Portal
                </h2>
                <p className="mt-1 text-sm text-slate-400 leading-normal">
                  Daily administrative operations, admissions, and student fee management.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <ClipboardList className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>Student Admissions & Registrations</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Receipt className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>Fee Challans & Collection Tracking</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Users className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>Student Directory & Sectioning</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CalendarCheck className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>Daily Leaves & Operational Logs</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4">
              <Link
                href="/admin/dashboard"
                prefetch={true}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30 group-hover:shadow-indigo-500/50"
              >
                <span>Enter Admin Desk</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Card 3: Faculty & Teachers Portal */}
          <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-7 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-teal-500/50 hover:bg-slate-900/90 hover:shadow-2xl hover:shadow-teal-500/10">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center transition-transform group-hover:scale-110">
                  <Users className="h-6 w-6" />
                </div>
                <span className="text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-md bg-teal-950/80 text-teal-300 border border-teal-800/50">
                  FACULTY & ACADEMICS
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white group-hover:text-teal-300 transition-colors">
                  Faculty & Staff Workspace
                </h2>
                <p className="mt-1 text-sm text-slate-400 leading-normal">
                  Worksheets, homework manager, marks entry, and salary slips.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <BookOpen className="h-4 w-4 text-teal-400 shrink-0" />
                  <span>Syllabus Worksheets & Past Papers</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <FileCheck className="h-4 w-4 text-teal-400 shrink-0" />
                  <span>Homework & Submission Grading</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Printer className="h-4 w-4 text-teal-400 shrink-0" />
                  <span>View & Print Salary Slips</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CalendarCheck className="h-4 w-4 text-teal-400 shrink-0" />
                  <span>Leave Requests & Attendance</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4">
              <Link
                href="/staff/homework"
                prefetch={true}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 transition-all shadow-lg shadow-teal-600/30 group-hover:shadow-teal-500/50"
              >
                <span>Enter Staff Workspace</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Card 4: Student & Parent Hub */}
          <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-7 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-500/50 hover:bg-slate-900/90 hover:shadow-2xl hover:shadow-emerald-500/10">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center transition-transform group-hover:scale-110">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <span className="text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-800/50">
                  STUDENT & PARENT
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Student Academic Hub
                </h2>
                <p className="mt-1 text-sm text-slate-400 leading-normal">
                  Fee challans, homework download, social connectivity, and academic results.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Receipt className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>3-Part Bank Challan Printing</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <BookOpen className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Homework & Assignment Downloads</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Smartphone className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Official WhatsApp, YouTube & Gmail Hub</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <ClipboardList className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Examination Results & Progress Dossiers</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4">
              <Link
                href="/student/dashboard"
                prefetch={true}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/30 group-hover:shadow-emerald-500/50"
              >
                <span>Enter Student Portal</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>

        {/* Operational Highlights Badge Bar */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center backdrop-blur-sm">
          <div>
            <div className="text-2xl font-bold text-white">100%</div>
            <div className="text-xs text-slate-400 mt-0.5">Digitized Operations</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-indigo-400">3-Part</div>
            <div className="text-xs text-slate-400 mt-0.5">A4 Bank Fee Challans</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-sky-400">Instant</div>
            <div className="text-xs text-slate-400 mt-0.5">SSR Route Pre-fetching</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400">Enterprise</div>
            <div className="text-xs text-slate-400 mt-0.5">Supabase Security & RLS</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} Zavia School System. All rights reserved. Centralized Institutional Platform.
          </div>
          <div className="flex items-center gap-6">
            <Link href="/admin/dashboard" prefetch={true} className="hover:text-slate-400 transition-colors">
              Principal Dashboard
            </Link>
            <Link href="/student/dashboard" prefetch={true} className="hover:text-slate-400 transition-colors">
              Student Hub
            </Link>
            <Link href="/login" prefetch={true} className="hover:text-slate-400 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

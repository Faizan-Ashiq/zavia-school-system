import Link from "next/link";
import { ShieldCheck, GraduationCap, BookOpen, User } from "lucide-react";
import SignOutButton from "@/components/SignOutButton";

interface ShellProps {
  title: string;
  name: string;
  role?: "principal" | "teacher" | "student" | string;
  children: React.ReactNode;
}

export default function Shell({ title, name, role, children }: ShellProps) {
  // Infer role badge style
  const roleDisplay = role || (title.toLowerCase().includes("principal") ? "principal" : title.toLowerCase().includes("teacher") ? "teacher" : "student");
  
  const roleBadgeStyles: Record<string, string> = {
    principal: "bg-purple-100 text-purple-800 border-purple-200",
    teacher: "bg-emerald-100 text-emerald-800 border-emerald-200",
    student: "bg-blue-100 text-blue-800 border-blue-200",
  };

  const roleIcons: Record<string, any> = {
    principal: ShieldCheck,
    teacher: BookOpen,
    student: GraduationCap,
  };

  const RoleIcon = roleIcons[roleDisplay] || User;

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 font-sans flex flex-col">
      {/* Sticky Top Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3">
          
          {/* Brand & School Info */}
          <div className="flex items-center gap-3.5 min-w-0">
            <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
              <img
                src="/Zavia.jpeg"
                alt="Zavia School System Logo"
                width={48}
                height={48}
                style={{ width: "48px", height: "48px", objectFit: "contain" }}
                className="w-12 h-12 rounded-full border border-slate-200 shadow-sm object-contain flex-shrink-0 group-hover:scale-105 transition-transform"
              />
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm sm:text-base font-black tracking-tight text-slate-900">
                  Zavia School System
                </span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border capitalize ${roleBadgeStyles[roleDisplay] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                  <RoleIcon className="w-3 h-3" />
                  {roleDisplay}
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 truncate max-w-[200px] sm:max-w-md">
                {title} · <span className="text-slate-400">{name}</span>
              </p>
            </div>
          </div>

          {/* Actions: Sign Out */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/70 bg-white/70 py-5 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-600">Zavia School System</p>
        <p className="text-slate-400 mt-0.5">Academic Excellence · © {new Date().getFullYear()} All rights reserved.</p>
      </footer>
    </div>
  );
}

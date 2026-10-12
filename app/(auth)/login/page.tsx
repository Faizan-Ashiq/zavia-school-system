"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { syncUserRoleOnLoginAction, recordLoginLogAction } from "@/app/actions";
import { School, ArrowLeft, Lock, Mail, AlertCircle, Loader2 } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const role = searchParams.get("role") ?? "student";
  const router = useRouter();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const f = new FormData(e.currentTarget);
    const sb = createClient();
    const { data, error } = await sb.auth.signInWithPassword({
      email: String(f.get("email")),
      password: String(f.get("password")),
    });

    if (error) {
      setErr("Invalid email or password. Please try again.");
      setBusy(false);
      return;
    }

    const expectedRole = (role ?? "student").trim().toLowerCase();

    // Safe query from profiles table
    const { data: p } = await sb
      .from("profiles")
      .select("role, full_name")
      .eq("id", data.user.id)
      .maybeSingle();

    // Extract role from DB profile or user_metadata fallback
    let userRole = (p?.role || data.user.user_metadata?.role || "").toString().trim().toLowerCase();

    // If role is missing, sync via admin action
    if (!userRole && expectedRole) {
      const synced = await syncUserRoleOnLoginAction(data.user.id, expectedRole);
      if (synced) {
        userRole = synced.trim().toLowerCase();
      }
    }

    // Robust case-insensitive and space-trimmed check
    if (userRole !== expectedRole) {
      await sb.auth.signOut();
      setErr(`Access Denied: This account is registered as a ${userRole || "different"} account, not ${expectedRole}.`);
      setBusy(false);
      return;
    }

    // Record login audit log
    try {
      await recordLoginLogAction({
        user_id: data.user.id,
        email: data.user.email || String(f.get("email")),
        role: userRole,
        full_name: data.user.user_metadata?.full_name || p?.full_name || "School User",
      });
    } catch {}

    router.push(`/${expectedRole}`);
    router.refresh();
  }

  const roleTitles: Record<string, string> = {
    student: "Student Portal Login",
    teacher: "Teacher & Staff Login",
    principal: "Principal Administration",
  };

  const roleBadges: Record<string, string> = {
    student: "bg-blue-50 text-blue-700 border-blue-200",
    teacher: "bg-emerald-50 text-emerald-700 border-emerald-200",
    principal: "bg-purple-50 text-purple-700 border-purple-200",
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Portal Directory</span>
        </Link>

        {/* Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 shadow-xl space-y-6">
          
          <div className="text-center space-y-2">
            <Link href="/" className="inline-block">
              <img
                src="/Zavia.jpeg"
                alt="Zavia School System"
                width={64}
                height={64}
                style={{ width: "64px", height: "64px", objectFit: "contain" }}
                className="w-16 h-16 rounded-full border-2 border-slate-200 shadow-md object-contain mx-auto hover:scale-105 transition-transform"
              />
            </Link>
            <div className="pt-2">
              <span className="text-xs font-bold text-indigo-600 block uppercase tracking-wider">
                Zavia School System
              </span>
              <span className={`inline-block px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border mt-1 ${roleBadges[role] || 'bg-slate-100 text-slate-700'}`}>
                {role}
              </span>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-2">
                {roleTitles[role] || "Portal Login"}
              </h1>
              <p className="text-xs text-slate-500">Enter your official credentials to continue</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="name@school.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 pl-10 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {role === "teacher" ? "Password / PIN" : "Password"}
                </label>
              </div>
              <div className="relative">
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 pl-10 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            {err && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span>{err}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700 transition active:scale-95 disabled:opacity-50"
            >
              {busy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In to {role.charAt(0).toUpperCase() + role.slice(1)}</span>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Need an account?{" "}
            <Link
              href={`/signup?role=${role === "teacher" ? "teacher" : "student"}`}
              className="font-bold text-indigo-600 hover:underline"
            >
              Register as {role === "teacher" ? "Teacher" : "Student"}
            </Link>
          </div>

          {/* Quick Switch role */}
          <div className="pt-2 text-center text-xs text-slate-400 flex items-center justify-center gap-3">
            <span>Switch Portal:</span>
            {role !== "student" && (
              <Link href="/login?role=student" className="hover:text-indigo-600 transition underline font-semibold">
                Student
              </Link>
            )}
            {role !== "teacher" && (
              <Link href="/login?role=teacher" className="hover:text-emerald-600 transition underline font-semibold">
                Teacher
              </Link>
            )}
            {role !== "principal" && (
              <Link href="/login?role=principal" className="hover:text-purple-600 transition underline font-semibold">
                Principal
              </Link>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

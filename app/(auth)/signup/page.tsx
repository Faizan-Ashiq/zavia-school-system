"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { syncUserProfileOnSignupAction } from "@/app/actions";
import { ArrowLeft, AlertCircle, Loader2, User, BookOpen, Award, Mail, Lock, GraduationCap, Briefcase } from "lucide-react";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "teacher" ? "teacher" : "student";
  const [role, setRole] = useState<"student" | "teacher">(initialRole);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const full_name = String(formData.get("full_name") ?? "").trim();
    const roll_number = role === "student" ? String(formData.get("roll_number") ?? "").trim() : "";
    const class_name = String(formData.get("class_name") ?? "").trim();

    const { data, error } = await createClient().auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          roll_number,
          class_name,
          role,
        },
      },
    });

    if (error) {
      setErr(error.message);
      setBusy(false);
      return;
    }

    if (data.user) {
      await syncUserProfileOnSignupAction({
        id: data.user.id,
        email,
        full_name,
        roll_number,
        class_name,
        role,
      });
    }

    if (!data.session) {
      setErr("Account registered! Check your email to confirm verification, then proceed to sign in.");
      setBusy(false);
      return;
    }

    router.push(`/${role}`);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        
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
              <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border mt-1 ${role === 'teacher' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                {role === "teacher" ? "Faculty Registration" : "Student Registration"}
              </span>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-2">
                {role === "teacher" ? "Create Teacher Account" : "Create Student Account"}
              </h1>
              <p className="text-xs text-slate-500">
                {role === "teacher"
                  ? "Register your faculty account to post daily homework & syllabus papers"
                  : "Register your profile to access class homework, past papers & notices"}
              </p>
            </div>
          </div>

          {/* Role Switcher Tabs */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1.5">
            <button
              type="button"
              onClick={() => { setRole("student"); setErr(""); }}
              className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                role === "student"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student Account</span>
            </button>
            <button
              type="button"
              onClick={() => { setRole("teacher"); setErr(""); }}
              className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                role === "teacher"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Teacher Account</span>
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <input
                  name="full_name"
                  type="text"
                  required
                  placeholder={role === "teacher" ? "e.g. Sir Tariq Mehmood" : "e.g. Ayaan Khan"}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 pl-10 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            {role === "student" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Class (e.g. 8-A, 10-B)
                  </label>
                  <div className="relative">
                    <input
                      name="class_name"
                      type="text"
                      required
                      placeholder="e.g. 9-A"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 pl-10 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                    <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Roll Number
                  </label>
                  <div className="relative">
                    <input
                      name="roll_number"
                      type="text"
                      required
                      placeholder="e.g. 42"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 pl-10 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                    <Award className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Assigned Subject / Class Focus
                </label>
                <div className="relative">
                  <input
                    name="class_name"
                    type="text"
                    required
                    placeholder="e.g. Physics & Mathematics (Grade 9-10)"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 pl-10 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                  <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <input
                  name="email"
                  type="email"
                  required
                  placeholder={role === "teacher" ? "teacher@zaviaschool.edu" : "student@example.com"}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 pl-10 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password (min 6 characters)
              </label>
              <div className="relative">
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
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
              className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-md transition active:scale-95 disabled:opacity-50 ${
                role === "teacher"
                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                  : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20"
              }`}
            >
              {busy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registering Account...</span>
                </>
              ) : (
                <span>Register as {role === "teacher" ? "Teacher" : "Student"}</span>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Already have an account?{" "}
            <Link
              href={`/login?role=${role}`}
              className="font-bold text-indigo-600 hover:underline"
            >
              Sign In to {role === "teacher" ? "Teacher Portal" : "Student Portal"}
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}

export default function Signup() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}

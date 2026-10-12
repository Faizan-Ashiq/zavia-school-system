"use client";
import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const [loading, setLoading] = useState(false);

  async function handleSignOut(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const sb = createClient();
      await sb.auth.signOut();
    } catch (err) {
      console.warn("Error signing out from supabase client:", err);
    } finally {
      // Clear any custom auth cookies
      try {
        const cookies = document.cookie.split(";");
        for (const cookie of cookies) {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          if (name.startsWith("sb-") || name.includes("auth") || name.includes("token")) {
            document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
            document.cookie = `${name}=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
          }
        }
      } catch (cookieErr) {
        console.warn("Error clearing cookies:", cookieErr);
      }

      // Safe client redirect to login
      window.location.href = "/login";
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-red-700 bg-slate-100 hover:bg-red-50 border border-slate-200/80 hover:border-red-200 transition-all duration-150 active:scale-95 shadow-sm disabled:opacity-50 cursor-pointer"
      title="Sign out of portal"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
      ) : (
        <LogOut className="w-3.5 h-3.5" />
      )}
      <span className="hidden sm:inline">{loading ? "Signing out..." : "Sign out"}</span>
    </button>
  );
}

"use client";
import { useState } from "react";
import { ShieldCheck, Activity, Search, Clock, User, CheckCircle2, RefreshCw } from "lucide-react";
import { LoginLog } from "@/lib/types";

export default function LoginActivityTable({ logs }: { logs: LoginLog[] }) {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  function formatLoginTime(isoString: string) {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;

      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();

      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      const isYesterday = d.toDateString() === yesterday.toDateString();

      const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      if (isToday) return `Today at ${timeStr}`;
      if (isYesterday) return `Yesterday at ${timeStr}`;
      return `${d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })} at ${timeStr}`;
    } catch {
      return isoString;
    }
  }

  const roleBadgeStyles: Record<string, string> = {
    teacher: "bg-emerald-50 text-emerald-700 border-emerald-200",
    student: "bg-blue-50 text-blue-700 border-blue-200",
    principal: "bg-purple-50 text-purple-700 border-purple-200",
  };

  const filteredLogs = logs.filter((log) => {
    const roleMatch = filter === "all" || log.role?.toLowerCase() === filter.toLowerCase();
    const query = search.toLowerCase();
    const searchMatch =
      !search ||
      log.full_name?.toLowerCase().includes(query) ||
      log.email?.toLowerCase().includes(query) ||
      log.role?.toLowerCase().includes(query);
    return roleMatch && searchMatch;
  });

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
            <Activity className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
            Security & Access Audit
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Staff & Student Login Activity
          </h2>
          <p className="text-xs text-slate-500">
            Real-time authentication records for Teachers, Students, and Administrators
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          {["all", "teacher", "student"].map((r) => (
            <button
              key={r}
              onClick={() => setFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                filter === r
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {r === "all" ? "All Users" : r + "s"}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or role..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 pl-9 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 placeholder:text-slate-400"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
      </div>

      {/* Activity Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="px-4 py-3.5">User / Account</th>
              <th className="px-4 py-3.5">Assigned Role</th>
              <th className="px-4 py-3.5">Login Timestamp</th>
              <th className="px-4 py-3.5">Session Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center space-y-1.5">
                    <Clock className="w-6 h-6 text-slate-300" />
                    <p className="font-semibold text-slate-500">No login activity recorded yet</p>
                    <p className="text-[11px] text-slate-400">
                      When users sign in, their authentication sessions will appear here automatically.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredLogs.map((log, idx) => {
                const badgeStyle =
                  roleBadgeStyles[log.role?.toLowerCase()] ||
                  "bg-slate-100 text-slate-700 border-slate-200";

                return (
                  <tr key={log.id || idx} className="hover:bg-slate-50/70 transition-colors">
                    {/* User Info */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs flex-shrink-0">
                          {(log.full_name || log.email || "U").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">
                            {log.full_name || "School User"}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">{log.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border capitalize ${badgeStyle}`}
                      >
                        {log.role}
                      </span>
                    </td>

                    {/* Timestamp */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatLoginTime(log.logged_in_at)}</span>
                      </div>
                    </td>

                    {/* Status Indicator */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Authenticated</span>
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}

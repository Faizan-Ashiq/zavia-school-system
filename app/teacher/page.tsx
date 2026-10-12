import { requireRole } from "@/lib/auth";
import Shell from "@/components/Shell";
import AnnouncementFeed from "@/components/AnnouncementFeed";
import {
  TeacherHomeworkForm,
  TeacherPaperForm,
  TeacherHomeworkList,
  TeacherPapersList,
} from "@/components/TeacherForms";
import { BookOpen, FileText, Megaphone, Sparkles, GraduationCap } from "lucide-react";
import { Announcement, DiaryHomework, PastPaper } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TeacherPage() {
  const { sb, profile } = await requireRole(["teacher"]);

  const [announcementsRes, homeworkRes, papersRes] = await Promise.all([
    sb
      .from("announcements")
      .select("*")
      .in("target_audience", ["all", "teachers"])
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false }),
    sb
      .from("diary_homework")
      .select("*")
      .order("date", { ascending: false }),
    sb
      .from("past_papers")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  const announcements: Announcement[] = announcementsRes.data ?? [];
  const homeworks: DiaryHomework[] = homeworkRes.data ?? [];
  const papers: PastPaper[] = papersRes.data ?? [];

  return (
    <Shell
      title="Teacher & Faculty Portal"
      name={profile.full_name || profile.email}
      role="teacher"
    >
      <div className="space-y-10 max-w-6xl mx-auto pb-16">
        
        {/* Header Banner & Stats */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Faculty Academic Workspace
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Teacher Classroom Dashboard
              </h1>
              <p className="text-sm text-slate-500">
                Post daily homework, upload examination papers, and review official school circulars
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Homework Entries
                </span>
                <BookOpen className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">{homeworks.length}</p>
              <p className="text-[11px] text-slate-400">Published across class diaries</p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Past Papers & Tests
                </span>
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">{papers.length}</p>
              <p className="text-[11px] text-slate-400">Uploaded exam material</p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Staff Notices
                </span>
                <Megaphone className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">{announcements.length}</p>
              <p className="text-[11px] text-slate-400">Active faculty circulars</p>
            </div>
          </div>
        </div>

        {/* Staff Announcements */}
        <section className="space-y-4 pt-4 border-t border-slate-200/80">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-purple-600" />
              Faculty & Staff Circulars
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              {announcements.length} Updates
            </span>
          </div>
          <AnnouncementFeed announcements={announcements} />
        </section>

        {/* Section 1: Daily Homework Management */}
        <section className="space-y-6 pt-6 border-t border-slate-200/80">
          <TeacherHomeworkForm />
          <TeacherHomeworkList homeworks={homeworks} />
        </section>

        {/* Section 2: Past Papers & Tests Management */}
        <section className="space-y-6 pt-6 border-t border-slate-200/80">
          <TeacherPaperForm />
          <TeacherPapersList papers={papers} />
        </section>

      </div>
    </Shell>
  );
}

import { requireRole } from "@/lib/auth";
import Shell from "@/components/Shell";
import StudentDashboard from "@/components/StudentDashboard";

export const dynamic = "force-dynamic";

export default async function StudentPage() {
  const { sb, profile } = await requireRole(["student"]);

  const [announcementsRes, homeworkRes, papersRes, settingsRes] = await Promise.all([
    sb
      .from("announcements")
      .select("*")
      .in("target_audience", ["all", "students"])
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false }),
    profile.class_name
      ? sb
          .from("diary_homework")
          .select("*")
          .eq("class_name", profile.class_name)
          .order("date", { ascending: false })
      : Promise.resolve({ data: [] }),
    profile.class_name
      ? sb
          .from("past_papers")
          .select("*")
          .eq("class_name", profile.class_name)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    sb.from("school_settings").select("*").limit(1).maybeSingle(),
  ]);

  return (
    <Shell title="Student Portal" name={profile.full_name || profile.email} role="student">
      <StudentDashboard
        student={profile}
        announcements={announcementsRes.data ?? []}
        homeworks={homeworkRes.data ?? []}
        papers={papersRes.data ?? []}
        settings={settingsRes.data ?? null}
      />
    </Shell>
  );
}

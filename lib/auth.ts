import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

export async function requireRole(roles: string[]) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  let { data: profile } = await sb
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    const meta = user.user_metadata || {};
    profile = {
      id: user.id,
      email: user.email || "",
      full_name: meta.full_name || user.email || "Student",
      role: meta.role || "student",
      class_name: meta.class_name || null,
      roll_number: meta.roll_number || null,
      created_at: user.created_at,
    };
  }

  const userRole = (profile.role || "").toString().trim().toLowerCase();
  const allowed = roles.map((r) => r.trim().toLowerCase());

  if (!allowed.includes(userRole)) {
    redirect("/login");
  }

  return { sb, profile };
}

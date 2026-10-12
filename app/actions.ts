"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

async function upload(sb: ReturnType<typeof createClient>, file: FormDataEntryValue | null, folder: string) {
  if (!(file instanceof File) || !file.size) return null;
  const admin = createAdmin();
  const bucketName = "school-assets";

  try {
    // Attempt to list or create bucket if needed
    const { data: buckets } = await admin.storage.listBuckets();
    const hasSchoolBucket = buckets?.some((b) => b.name === bucketName);
    const hasFilesBucket = buckets?.some((b) => b.name === "files");

    const targetBucket = hasSchoolBucket ? bucketName : hasFilesBucket ? "files" : bucketName;
    if (!hasSchoolBucket && !hasFilesBucket) {
      await admin.storage.createBucket(bucketName, { public: true });
    }

    const path = `${folder}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const { error } = await admin.storage.from(targetBucket).upload(path, file, {
      upsert: true,
      contentType: file.type || undefined,
    });

    if (error) {
      // Fallback try with user client
      const { error: sbErr } = await sb.storage.from("files").upload(path, file);
      if (sbErr) throw new Error(error.message);
      return sb.storage.from("files").getPublicUrl(path).data.publicUrl;
    }

    return admin.storage.from(targetBucket).getPublicUrl(path).data.publicUrl;
  } catch (err: any) {
    const path = `${folder}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const { error } = await sb.storage.from("files").upload(path, file);
    if (error) throw new Error(error.message || "File upload failed");
    return sb.storage.from("files").getPublicUrl(path).data.publicUrl;
  }
}

// ---- Auth ----
export async function logoutAction() {
  await createClient().auth.signOut();
  redirect("/");
}
export const signOut = logoutAction;

// ---- Principal: Announcements ----
export async function createAnnouncementAction(f: FormData) {
  const { sb, profile } = await requireRole(["principal"]);
  const title = s(f, "title");
  const content = s(f, "content");
  const target_audience = (s(f, "target_audience") || "all") as "all" | "students" | "teachers";
  const pinned = f.get("pinned") === "on" || f.get("pinned") === "true";

  if (!title || !content) {
    throw new Error("Title and content are required.");
  }

  const admin = createAdmin();
  try {
    const { data: profExists } = await admin.from("profiles").select("id").eq("id", profile.id).maybeSingle();
    if (!profExists) {
      await admin.from("profiles").upsert({
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name || "Principal",
        role: profile.role || "principal",
      }, { onConflict: "id" });
    }
  } catch {}

  const { error } = await admin.from("announcements").insert({
    title,
    content,
    target_audience,
    pinned,
    created_by: profile.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
  revalidatePath("/principal");
  revalidatePath("/student");
  revalidatePath("/teacher");
}
export const postAnnouncement = createAnnouncementAction;

export async function togglePinAnnouncementAction(f: FormData) {
  return togglePin(f);
}

export async function togglePin(f: FormData) {
  const { sb } = await requireRole(["principal"]);
  const id = s(f, "id");
  const pinned = s(f, "pinned") !== "true";
  
  await sb.from("announcements").update({ pinned }).eq("id", id);
  
  revalidatePath("/", "layout");
  revalidatePath("/principal");
  revalidatePath("/student");
  revalidatePath("/teacher");
}

export async function deleteAnnouncementAction(f: FormData) {
  const { sb } = await requireRole(["principal"]);
  const id = s(f, "id");
  if (!id) return;

  const { error } = await sb.from("announcements").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
  revalidatePath("/principal");
  revalidatePath("/student");
  revalidatePath("/teacher");
}
export const deleteAnnouncement = deleteAnnouncementAction;

// ---- Past Papers Upload & Delete (Principal & Teacher) ----
export async function uploadPastPaperAction(f: FormData) {
  const { sb, profile } = await requireRole(["principal", "teacher"]);
  const title = s(f, "title");
  const class_name = s(f, "class_name");
  const file = f.get("file");

  if (!title || !class_name) {
    throw new Error("Exam Title and Target Class are required.");
  }

  const url = await upload(sb, file, "papers");
  if (!url) throw new Error("Please choose a valid file to upload.");

  const { error } = await createAdmin().from("past_papers").insert({
    title,
    class_name,
    file_url: url,
    uploaded_by_role: profile.role,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
  revalidatePath("/principal");
  revalidatePath("/student");
  revalidatePath("/teacher");
}
export const uploadPaper = uploadPastPaperAction;
export const uploadPaperAction = uploadPastPaperAction;

export async function deletePaperAction(f: FormData) {
  const { sb } = await requireRole(["principal", "teacher"]);
  const id = s(f, "id");
  const url = s(f, "url");

  if (url) {
    const isSchoolAssets = url.includes("/school-assets/");
    const isFiles = url.includes("/files/");
    const path = isSchoolAssets ? url.split("/school-assets/")[1] : isFiles ? url.split("/files/")[1] : null;
    const bucket = isSchoolAssets ? "school-assets" : "files";
    if (path) {
      try {
        await createAdmin().storage.from(bucket).remove([decodeURIComponent(path)]);
      } catch {}
    }
  }

  await createAdmin().from("past_papers").delete().eq("id", id);
  revalidatePath("/", "layout");
  revalidatePath("/principal");
  revalidatePath("/student");
  revalidatePath("/teacher");
}
export const deletePaper = deletePaperAction;

// ---- Homework / Diary (Principal & Teacher) ----
export async function createHomeworkAction(f: FormData) {
  const { sb, profile } = await requireRole(["principal", "teacher"]);
  const class_name = s(f, "class_name");
  const subject = s(f, "subject");
  const date = s(f, "date") || new Date().toISOString().slice(0, 10);
  const description = s(f, "description");
  const file = f.get("file");

  if (!class_name || !subject || !description) {
    throw new Error("Class, Subject, and Description are required.");
  }

  const attachment_url = await upload(sb, file, "diary");

  const admin = createAdmin();
  try {
    const { data: profExists } = await admin.from("profiles").select("id").eq("id", profile.id).maybeSingle();
    if (!profExists) {
      await admin.from("profiles").upsert({
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name || "Teacher",
        role: profile.role || "teacher",
      }, { onConflict: "id" });
    }
  } catch {}

  const { error } = await admin.from("diary_homework").insert({
    class_name,
    subject,
    date,
    description,
    attachment_url,
    created_by: profile.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
  revalidatePath("/principal");
  revalidatePath("/student");
  revalidatePath("/teacher");
}
export const addDiary = createHomeworkAction;

export async function deleteHomeworkAction(f: FormData) {
  const { sb, profile } = await requireRole(["principal", "teacher"]);
  const id = s(f, "id");
  const attachment_url = s(f, "url");

  if (attachment_url) {
    const isSchoolAssets = attachment_url.includes("/school-assets/");
    const isFiles = attachment_url.includes("/files/");
    const path = isSchoolAssets
      ? attachment_url.split("/school-assets/")[1]
      : isFiles
      ? attachment_url.split("/files/")[1]
      : null;
    const bucket = isSchoolAssets ? "school-assets" : "files";
    if (path) {
      try {
        await createAdmin().storage.from(bucket).remove([decodeURIComponent(path)]);
      } catch {}
    }
  }

  await createAdmin().from("diary_homework").delete().eq("id", id);

  revalidatePath("/", "layout");
  revalidatePath("/principal");
  revalidatePath("/student");
  revalidatePath("/teacher");
}

// ---- Principal: Settings ----
export async function updateSettingsAction(f: FormData) {
  const { sb } = await requireRole(["principal"]);
  const youtube_url = s(f, "youtube_url");
  const whatsapp_number = s(f, "whatsapp_number");
  const contact_email = s(f, "contact_email");

  const { data } = await sb.from("school_settings").select("id").limit(1).maybeSingle();
  if (data?.id) {
    await sb.from("school_settings").update({
      youtube_url,
      whatsapp_number,
      contact_email,
    }).eq("id", data.id);
  } else {
    await sb.from("school_settings").insert({
      youtube_url,
      whatsapp_number,
      contact_email,
    });
  }

  revalidatePath("/", "layout");
  revalidatePath("/principal");
  revalidatePath("/student");
}
export const saveSettingsAction = updateSettingsAction;
export const saveSettings = updateSettingsAction;

// ---- Principal: Student Management ----
export async function addStudentByPrincipalAction(f: FormData) {
  await requireRole(["principal"]);
  const email = s(f, "email");
  const password = s(f, "password");
  const full_name = s(f, "full_name");
  const roll_number = s(f, "roll_number");
  const class_name = s(f, "class_name");

  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  const admin = createAdmin();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name,
      roll_number,
      class_name,
    },
  });

  if (error) throw new Error(error.message);

  if (data?.user) {
    // Upsert directly into public.profiles to guarantee immediate reactivity
    const { error: pErr } = await admin.from("profiles").upsert(
      {
        id: data.user.id,
        full_name: full_name || email,
        roll_number: roll_number || null,
        class_name: class_name || null,
        email,
        role: "student",
      },
      { onConflict: "id" }
    );
    if (pErr) console.error("Profile upsert error:", pErr);
  }

  revalidatePath("/principal");
}
export const createStudent = addStudentByPrincipalAction;

export async function updateStudentAction(f: FormData) {
  const { sb } = await requireRole(["principal"]);
  const id = s(f, "id");
  const full_name = s(f, "full_name");
  const roll_number = s(f, "roll_number");
  const class_name = s(f, "class_name");

  await sb.from("profiles").update({
    full_name,
    roll_number,
    class_name,
  }).eq("id", id);

  revalidatePath("/principal");
  revalidatePath(`/principal/students/${id}`);
}
export const updateStudent = updateStudentAction;

export async function deleteStudentAction(f: FormData) {
  await requireRole(["principal"]);
  const id = s(f, "id");
  if (!id) return;

  const admin = createAdmin();
  try {
    await admin.auth.admin.deleteUser(id);
  } catch {}
  await admin.from("profiles").delete().eq("id", id);

  revalidatePath("/principal");
}
export const deleteStudent = deleteStudentAction;

export async function deleteStudentAndRedirectAction(f: FormData) {
  await deleteStudentAction(f);
  redirect("/principal");
}

export async function syncStudentProfileAction(userData: {
  id: string;
  email: string;
  full_name?: string;
  roll_number?: string;
  class_name?: string;
  role?: string;
}) {
  try {
    const admin = createAdmin();
    const role = (userData.role || "student").trim().toLowerCase();

    // 1. Ensure user_metadata has role in auth.users
    await admin.auth.admin.updateUserById(userData.id, {
      user_metadata: {
        full_name: userData.full_name || "",
        roll_number: userData.roll_number || "",
        class_name: userData.class_name || "",
        role: role,
      },
    });

    // 2. Upsert into profiles table if table exists
    await admin.from("profiles").upsert(
      {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name || "Student",
        roll_number: userData.roll_number || null,
        class_name: userData.class_name || null,
        role: role,
      },
      { onConflict: "id" }
    );
  } catch (err) {
    console.warn("syncStudentProfileAction warning:", err);
  }
}

export async function syncUserRoleOnLoginAction(userId: string, targetRole?: string) {
  try {
    const admin = createAdmin();
    const { data: user } = await admin.auth.admin.getUserById(userId);
    if (!user?.user) return null;

    const currentRole = (
      user.user.user_metadata?.role ||
      targetRole ||
      "student"
    ).toString().trim().toLowerCase();

    // Ensure user_metadata has role
    if (!user.user.user_metadata?.role) {
      await admin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...user.user.user_metadata,
          role: currentRole,
        },
      });
    }

    // Try ensuring profiles row exists
    try {
      const { data: profile } = await admin
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (!profile) {
        await admin.from("profiles").upsert(
          {
            id: userId,
            email: user.user.email,
            full_name: user.user.user_metadata?.full_name || "Student",
            roll_number: user.user.user_metadata?.roll_number || null,
            class_name: user.user.user_metadata?.class_name || null,
            role: currentRole,
          },
          { onConflict: "id" }
        );
      }
    } catch {}

    return currentRole;
  } catch (err) {
    console.warn("syncUserRoleOnLoginAction warning:", err);
    return null;
  }
}

export async function syncUserProfileOnSignupAction(userData: {
  id: string;
  email: string;
  full_name?: string;
  roll_number?: string;
  class_name?: string;
  role: "student" | "teacher" | string;
}) {
  try {
    const admin = createAdmin();
    const role = (userData.role || "student").trim().toLowerCase();

    // 1. Ensure user_metadata in auth.users
    await admin.auth.admin.updateUserById(userData.id, {
      user_metadata: {
        full_name: userData.full_name || "",
        roll_number: userData.roll_number || "",
        class_name: userData.class_name || "",
        role: role,
      },
    });

    // 2. Upsert into public.profiles
    await admin.from("profiles").upsert(
      {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name || (role === "teacher" ? "Teacher" : "Student"),
        roll_number: userData.roll_number || null,
        class_name: userData.class_name || null,
        role: role,
      },
      { onConflict: "id" }
    );
  } catch (err) {
    console.warn("syncUserProfileOnSignupAction warning:", err);
  }
}

export async function recordLoginLogAction(logData: {
  user_id: string;
  email: string;
  role: string;
  full_name: string;
}) {
  try {
    const admin = createAdmin();
    await admin.from("login_logs").insert({
      user_id: logData.user_id,
      email: logData.email,
      role: logData.role,
      full_name: logData.full_name,
      logged_in_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("recordLoginLogAction warning:", err);
  }
}

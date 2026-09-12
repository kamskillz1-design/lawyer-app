import { supabase } from "@/api/supabaseClient";

export const DOCUMENTS_BUCKET = "documents";

export async function uploadFile({ file }) {
  if (!file) throw new Error("file is required");
  const { data: sessionData } = await supabase.auth.getSession();
  const uid = sessionData?.session?.user?.id || "public";
  const safeName = String(file.name || "upload").replace(/[^\w.\-]+/g, "_");
  const path = `${uid}/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(DOCUMENTS_BUCKET).getPublicUrl(path);
  return { file_url: data.publicUrl, path };
}

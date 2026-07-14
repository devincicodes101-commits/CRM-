import { createServiceClient } from "@/lib/supabase/server";

// Supabase Storage helper — Base44's Core.UploadFile equivalent.
// Buckets (create in Supabase dashboard or a migration):
//   logos, job-photos, signatures, certificates, receipts
// Server-side only (uses the service-role client).

export type UploadResult =
  | { ok: true; path: string; publicUrl: string }
  | { ok: false; error: string };

export async function uploadFile(
  bucket: string,
  path: string,
  body: ArrayBuffer | Blob | Buffer | Uint8Array,
  contentType?: string
): Promise<UploadResult> {
  const supabase = await createServiceClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, body, { contentType, upsert: true });

  if (error) return { ok: false, error: error.message };

  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return { ok: true, path: data.path, publicUrl: pub.publicUrl };
}

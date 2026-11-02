import type { UploadUrlResponse } from "@civicpulse/contract";
import { post } from "./api";
import { MEDIA_BUCKET, supabase } from "./supabase";

export type MediaStage = "original" | "on_site" | "proof";

/** Upload one file through a signed URL and return the media id to attach to a report. */
export async function uploadFile(file: File, stage: MediaStage = "original"): Promise<string> {
  const kind = file.type.startsWith("video/") ? "video" : "photo";
  const signed = await post<UploadUrlResponse>("/media/upload-url", { kind, contentType: file.type, stage });
  const { error } = await supabase.storage.from(MEDIA_BUCKET).uploadToSignedUrl(signed.path, signed.token, file);
  if (error) throw error;
  return signed.mediaId;
}

export async function uploadFiles(files: File[], stage: MediaStage = "original"): Promise<string[]> {
  const ids: string[] = [];
  for (const f of files) ids.push(await uploadFile(f, stage));
  return ids;
}

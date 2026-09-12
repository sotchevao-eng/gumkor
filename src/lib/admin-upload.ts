import { supabase } from "@/integrations/supabase/client";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const DOC_TYPES = ["application/pdf"];
const MAX_BYTES = 10 * 1024 * 1024;

function extensionOf(file: File) {
  const parts = file.name.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "bin";
}

export async function uploadImage(bucket: string, file: File) {
  if (!IMAGE_TYPES.includes(file.type)) {
    throw new Error("Фото принимаются в формате JPG, PNG или WEBP");
  }
  return upload(bucket, file);
}

export async function uploadDocument(bucket: string, file: File) {
  if (![...IMAGE_TYPES, ...DOC_TYPES].includes(file.type)) {
    throw new Error("Документы принимаются в формате PDF, JPG или PNG");
  }
  return upload(bucket, file);
}

async function upload(bucket: string, file: File) {
  if (file.size > MAX_BYTES) {
    throw new Error("Файл больше 10 МБ — уменьшите размер");
  }
  const path = `${crypto.randomUUID()}.${extensionOf(file)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return path;
}

export async function signedUrl(bucket: string, path: string, seconds = 60 * 60 * 6) {
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, seconds);
  return data?.signedUrl ?? null;
}

export async function signedUrls(bucket: string, paths: string[], seconds = 60 * 60 * 6) {
  if (paths.length === 0) return new Map<string, string>();
  const { data } = await supabase.storage.from(bucket).createSignedUrls(paths, seconds);
  const map = new Map<string, string>();
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) map.set(item.path, item.signedUrl);
  }
  return map;
}

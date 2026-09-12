import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type PublicReport = {
  id: string;
  title: string;
  reportDate: string;
  summary: string;
  body: string;
  photoUrls: string[];
  documents: { name: string; url: string }[];
  needTitle: string | null;
};

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export const listPublishedReports = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicReport[]> => {
    const supabase = publicClient();

    const { data, error } = await supabase
      .from("reports")
      .select("id, title, report_date, summary, body, photo_paths, document_paths, need_id")
      .eq("status", "published")
      .order("report_date", { ascending: false });
    if (error) throw new Error(error.message);

    const rows = data ?? [];
    const needIds = rows.map((row) => row.need_id).filter((id): id is string => Boolean(id));
    const needTitles = new Map<string, string>();
    if (needIds.length > 0) {
      const { data: needs } = await supabase.from("needs").select("id, title").in("id", needIds);
      for (const need of needs ?? []) needTitles.set(need.id, need.title);
    }

    const allPaths = rows.flatMap((row) => [
      ...(row.photo_paths ?? []),
      ...(row.document_paths ?? []),
    ]);
    const signed = new Map<string, string>();
    if (allPaths.length > 0) {
      const { data: urls } = await supabase.storage
        .from("report-files")
        .createSignedUrls(allPaths, 60 * 60 * 12);
      for (const item of urls ?? []) {
        if (item.path && item.signedUrl) signed.set(item.path, item.signedUrl);
      }
    }

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      reportDate: row.report_date,
      summary: row.summary ?? "",
      body: row.body ?? "",
      photoUrls: (row.photo_paths ?? [])
        .map((path) => signed.get(path))
        .filter((url): url is string => Boolean(url)),
      documents: (row.document_paths ?? [])
        .map((path, index) => {
          const url = signed.get(path);
          return url ? { name: `Документ ${index + 1}`, url } : null;
        })
        .filter((item): item is { name: string; url: string } => item !== null),
      needTitle: row.need_id ? (needTitles.get(row.need_id) ?? null) : null,
    }));
  },
);

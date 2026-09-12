import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import type { NeedGoalType } from "./needs-types";

export type PublicReport = {
  id: string;
  title: string;
  reportDate: string;
  summary: string;
  body: string;
  categoryName: string | null;
  needId: string | null;
  needTitle: string | null;
  needGoalType: NeedGoalType;
  unit: string | null;
  targetAmount: number | null;
  collectedAmount: number | null;
  spentAmount: number | null;
  deliveredAmount: number | null;
  purchasedItems: string;
  coordinatorNote: string;
  isDemo: boolean;
  photoUrls: string[];
  documents: { name: string; url: string }[];
};

const SELECT =
  "id, title, report_date, summary, body, photo_paths, document_paths, document_names, public_document_paths, need_id, need_title, need_goal_type, unit, target_amount, collected_amount, spent_amount, delivered_amount, purchased_items, coordinator_note, category_id, is_demo";

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

type Row = {
  id: string;
  title: string;
  report_date: string;
  summary: string | null;
  body: string | null;
  photo_paths: string[] | null;
  document_paths: string[] | null;
  document_names: string[] | null;
  public_document_paths: string[] | null;
  need_id: string | null;
  need_title: string | null;
  need_goal_type: string | null;
  unit: string | null;
  target_amount: number | null;
  collected_amount: number | null;
  spent_amount: number | null;
  delivered_amount: number | null;
  purchased_items: string | null;
  coordinator_note: string | null;
  category_id: string | null;
  is_demo: boolean;
};

async function mapRows(
  supabase: ReturnType<typeof publicClient>,
  rows: Row[],
): Promise<PublicReport[]> {
  const categoryIds = rows.map((row) => row.category_id).filter((id): id is string => Boolean(id));
  const categoryNames = new Map<string, string>();
  if (categoryIds.length > 0) {
    const { data } = await supabase.from("need_categories").select("id, name").in("id", categoryIds);
    for (const item of data ?? []) categoryNames.set(item.id, item.name);
  }

  const needIds = rows.map((row) => row.need_id).filter((id): id is string => Boolean(id));
  const needTitles = new Map<string, string>();
  if (needIds.length > 0) {
    const { data } = await supabase.from("needs").select("id, title").in("id", needIds);
    for (const need of data ?? []) needTitles.set(need.id, need.title);
  }

  const allPaths = rows.flatMap((row) => [
    ...(row.photo_paths ?? []),
    ...(row.public_document_paths ?? []),
  ]);
  const signed = new Map<string, string>();
  if (allPaths.length > 0) {
    const { data } = await supabase.storage
      .from("report-files")
      .createSignedUrls(allPaths, 60 * 60 * 12);
    for (const item of data ?? []) {
      if (item.path && item.signedUrl) signed.set(item.path, item.signedUrl);
    }
  }

  return rows.map((row) => {
    const paths = row.document_paths ?? [];
    const names = row.document_names ?? [];
    const publicPaths = row.public_document_paths ?? [];
    return {
      id: row.id,
      title: row.title,
      reportDate: row.report_date,
      summary: row.summary ?? "",
      body: row.body ?? "",
      categoryName: row.category_id ? (categoryNames.get(row.category_id) ?? null) : null,
      needId: row.need_id,
      needTitle:
        row.need_title ||
        (row.need_id ? (needTitles.get(row.need_id) ?? null) : null) ||
        null,
      needGoalType: (row.need_goal_type as NeedGoalType) ?? "descriptive",
      unit: row.unit,
      targetAmount: row.target_amount === null ? null : Number(row.target_amount),
      collectedAmount: row.collected_amount === null ? null : Number(row.collected_amount),
      spentAmount: row.spent_amount === null ? null : Number(row.spent_amount),
      deliveredAmount: row.delivered_amount === null ? null : Number(row.delivered_amount),
      purchasedItems: row.purchased_items ?? "",
      coordinatorNote: row.coordinator_note ?? "",
      isDemo: row.is_demo,
      photoUrls: (row.photo_paths ?? [])
        .map((path) => signed.get(path))
        .filter((url): url is string => Boolean(url)),
      documents: publicPaths
        .map((path) => {
          const url = signed.get(path);
          if (!url) return null;
          const index = paths.indexOf(path);
          const name = (index >= 0 ? names[index] : "") || "Документ";
          return { name, url };
        })
        .filter((item): item is { name: string; url: string } => item !== null),
    };
  });
}

export const listPublishedReports = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicReport[]> => {
    const supabase = publicClient();
    const { data, error } = await supabase
      .from("reports")
      .select(SELECT)
      .eq("status", "published")
      .order("report_date", { ascending: false });
    if (error) throw new Error(error.message);
    return mapRows(supabase, (data ?? []) as Row[]);
  },
);

export const getPublishedReport = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }): Promise<PublicReport | null> => {
    const supabase = publicClient();
    const { data: rows, error } = await supabase
      .from("reports")
      .select(SELECT)
      .eq("status", "published")
      .eq("id", data.id)
      .limit(1);
    if (error) throw new Error(error.message);
    const mapped = await mapRows(supabase, (rows ?? []) as Row[]);
    return mapped[0] ?? null;
  });

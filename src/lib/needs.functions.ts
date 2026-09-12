import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { Need, NeedCategory } from "./needs-types";

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

export const listNeeds = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ needs: Need[]; categories: NeedCategory[] }> => {
    const supabase = publicClient();

    const [needsResult, categoriesResult] = await Promise.all([
      supabase
        .from("needs")
        .select(
          "id, title, description, category_id, published_at, priority, status, goal_type, required_amount, collected_amount, unit, photo_url, report_url, is_demo, pay_phone, pay_bank, pay_recipient, pay_purpose",
        )
        .neq("status", "draft")
        .order("published_at", { ascending: false }),
      supabase.from("need_categories").select("id, name, sort_order").order("sort_order"),
    ]);

    if (needsResult.error) throw new Error(needsResult.error.message);
    if (categoriesResult.error) throw new Error(categoriesResult.error.message);

    const categories: NeedCategory[] = (categoriesResult.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      sortOrder: row.sort_order,
    }));
    const categoryNames = new Map(categories.map((c) => [c.id, c.name]));

    const rows = needsResult.data ?? [];

    // Опубликованные отчёты по потребностям — для кнопки «Смотреть отчёт»
    const reportByNeed = new Map<string, string>();
    if (rows.length > 0) {
      const { data: reportRows } = await supabase
        .from("reports")
        .select("id, need_id, report_date")
        .eq("status", "published")
        .in(
          "need_id",
          rows.map((row) => row.id),
        )
        .order("report_date", { ascending: false });
      for (const report of reportRows ?? []) {
        if (report.need_id && !reportByNeed.has(report.need_id)) {
          reportByNeed.set(report.need_id, report.id);
        }
      }
    }
    const photoPaths = rows.map((row) => row.photo_url).filter((p): p is string => Boolean(p));
    const signed = new Map<string, string>();
    if (photoPaths.length > 0) {
      const { data } = await supabase.storage
        .from("need-photos")
        .createSignedUrls(photoPaths, 60 * 60 * 12);
      for (const item of data ?? []) {
        if (item.path && item.signedUrl) signed.set(item.path, item.signedUrl);
      }
    }

    const needs: Need[] = rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      categoryId: row.category_id,
      categoryName: row.category_id ? (categoryNames.get(row.category_id) ?? null) : null,
      publishedAt: row.published_at,
      priority: row.priority,
      status: row.status,
      goalType: row.goal_type,
      requiredAmount: row.required_amount === null ? null : Number(row.required_amount),
      collectedAmount: Number(row.collected_amount ?? 0),
      unit: row.unit,
      photoPath: row.photo_url,
      photoUrl: row.photo_url ? (signed.get(row.photo_url) ?? null) : null,
      reportUrl: row.report_url,
      isDemo: row.is_demo,
      payPhone: row.pay_phone,
      payBank: row.pay_bank,
      payRecipient: row.pay_recipient,
      payPurpose: row.pay_purpose,
    }));

    return { needs, categories };
  },
);

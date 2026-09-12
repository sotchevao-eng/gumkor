import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  GOAL_TYPE_LABELS,
  PRIORITY_META,
  STATUS_META,
  formatAmount,
  formatDate,
  type NeedGoalType,
  type NeedPriority,
  type NeedStatus,
} from "@/lib/needs-types";
import { formatDateTime } from "@/lib/admin-types";
import { uploadImage } from "@/lib/admin-upload";

export const Route = createFileRoute("/_authenticated/admin/needs")({
  component: AdminNeeds,
});

type NeedRecord = {
  id: string;
  title: string;
  description: string;
  category_id: string | null;
  published_at: string;
  priority: NeedPriority;
  status: NeedStatus;
  goal_type: NeedGoalType;
  required_amount: number | null;
  collected_amount: number;
  unit: string | null;
  photo_url: string | null;
  report_url: string | null;
  is_demo: boolean;
  pay_phone: string | null;
  pay_bank: string | null;
  pay_recipient: string | null;
  pay_purpose: string | null;
};

type FormState = {
  title: string;
  description: string;
  categoryId: string;
  publishedAt: string;
  priority: NeedPriority;
  status: NeedStatus;
  goalType: NeedGoalType;
  requiredAmount: string;
  collectedAmount: string;
  unit: string;
  reportUrl: string;
  payPhone: string;
  payBank: string;
  payRecipient: string;
  payPurpose: string;
};

const emptyForm: FormState = {
  title: "",
  description: "",
  categoryId: "",
  publishedAt: new Date().toISOString().slice(0, 10),
  priority: "normal",
  status: "active",
  goalType: "descriptive",
  requiredAmount: "",
  collectedAmount: "0",
  unit: "",
  reportUrl: "",
  payPhone: "",
  payBank: "",
  payRecipient: "",
  payPurpose: "",
};

const UNIT_SUGGESTIONS = ["шт.", "комплект", "коробка", "упаковка", "кг", "л", "пара"];

const STATUS_FILTERS: { key: "all" | NeedStatus; label: string }[] = [
  { key: "all", label: "Все" },
  { key: "draft", label: "Черновики" },
  { key: "active", label: "Активные" },
  { key: "partial", label: "Частично закрытые" },
  { key: "closed", label: "Закрытые" },
];

type SortKey = "new" | "old" | "urgent" | "category" | "progress";

const SORT_LABELS: Record<SortKey, string> = {
  new: "Новые сначала",
  old: "Старые сначала",
  urgent: "Сначала срочные",
  category: "По категории",
  progress: "По прогрессу",
};

const PRIORITY_WEIGHT: Record<NeedPriority, number> = { urgent: 0, important: 1, normal: 2 };

function progressPercent(need: NeedRecord) {
  if (need.status === "closed") return 100;
  if (!need.required_amount || need.required_amount <= 0) return null;
  return Math.min(100, Math.round((Number(need.collected_amount ?? 0) / need.required_amount) * 100));
}

function AdminNeeds() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<"all" | NeedStatus>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("new");

  const [progressTarget, setProgressTarget] = useState<NeedRecord | null>(null);
  const [progressValue, setProgressValue] = useState("");
  const [historyTarget, setHistoryTarget] = useState<NeedRecord | null>(null);
  const [closeTarget, setCloseTarget] = useState<NeedRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NeedRecord | null>(null);
  const [closedNeed, setClosedNeed] = useState<NeedRecord | null>(null);

  const needsQuery = useQuery({
    queryKey: ["needs", "admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("needs")
        .select("*")
        .order("published_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as NeedRecord[];
    },
  });

  const categoriesQuery = useQuery({
    queryKey: ["need-categories", "admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("need_categories")
        .select("id, name, sort_order, is_hidden")
        .order("sort_order");
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const historyQuery = useQuery({
    queryKey: ["need-history", historyTarget?.id],
    enabled: Boolean(historyTarget),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("need_history")
        .select("id, summary, changed_by_email, created_at")
        .eq("need_id", historyTarget!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const categoryName = new Map((categoriesQuery.data ?? []).map((c) => [c.id, c.name]));

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["needs"] });
    queryClient.invalidateQueries({ queryKey: ["need-history"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
  }

  async function logHistory(needId: string, summaries: string[]) {
    if (summaries.length === 0) return;
    const { data } = await supabase.auth.getUser();
    const email = data.user?.email ?? "";
    await supabase.from("need_history").insert(
      summaries.map((summary) => ({
        need_id: needId,
        changed_by: data.user?.id ?? null,
        changed_by_email: email,
        summary,
      })),
    );
  }

  function unitLabel(need: NeedRecord) {
    return need.unit ?? (need.goal_type === "money" ? "₽" : "");
  }

  const createCategory = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from("need_categories")
        .insert({ name: name.trim() })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return data.id as string;
    },
    onSuccess: (id) => {
      toast.success("Категория создана");
      setForm((prev) => ({ ...prev, categoryId: id }));
      queryClient.invalidateQueries({ queryKey: ["need-categories"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const saveNeed = useMutation({
    mutationFn: async (statusOverride?: NeedStatus) => {
      if (!form.title.trim()) throw new Error("Укажите название потребности");
      const goalType = form.goalType;
      if (goalType !== "descriptive" && !form.requiredAmount) {
        throw new Error(
          goalType === "money" ? "Укажите требуемую сумму" : "Укажите требуемое количество",
        );
      }
      let photoPath: string | null | undefined;
      if (photoFile) photoPath = await uploadImage("need-photos", photoFile);

      const status = statusOverride ?? form.status;
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category_id: form.categoryId || null,
        published_at: form.publishedAt,
        priority: form.priority,
        status,
        goal_type: goalType,
        required_amount:
          goalType === "descriptive" || form.requiredAmount === ""
            ? null
            : Number(form.requiredAmount),
        collected_amount: goalType === "descriptive" ? 0 : Number(form.collectedAmount || 0),
        unit:
          goalType === "descriptive"
            ? null
            : form.unit.trim() || (goalType === "money" ? "₽" : null),
        report_url: form.reportUrl.trim() || null,
        pay_phone: goalType === "money" ? form.payPhone.trim() || null : null,
        pay_bank: goalType === "money" ? form.payBank.trim() || null : null,
        pay_recipient: goalType === "money" ? form.payRecipient.trim() || null : null,
        pay_purpose: goalType === "money" ? form.payPurpose.trim() || null : null,
        ...(photoPath !== undefined ? { photo_url: photoPath } : {}),
      };

      if (editingId) {
        const before = (needsQuery.data ?? []).find((item) => item.id === editingId);
        const { error } = await supabase.from("needs").update(payload).eq("id", editingId);
        if (error) throw new Error(error.message);
        const changes: string[] = [];
        if (before) {
          if (before.title !== payload.title)
            changes.push(`Название изменено: ${before.title} → ${payload.title}`);
          if (before.status !== status)
            changes.push(
              `Статус изменён: ${STATUS_META[before.status].label} → ${STATUS_META[status].label}`,
            );
          if (Number(before.collected_amount ?? 0) !== Number(payload.collected_amount))
            changes.push(
              `Собрано изменено: ${before.collected_amount} → ${payload.collected_amount}`,
            );
          if (Number(before.required_amount ?? 0) !== Number(payload.required_amount ?? 0))
            changes.push(
              `Цель изменена: ${before.required_amount ?? "—"} → ${payload.required_amount ?? "—"}`,
            );
          if (before.priority !== payload.priority)
            changes.push(
              `Приоритет изменён: ${PRIORITY_META[before.priority].label} → ${PRIORITY_META[payload.priority].label}`,
            );
          if (changes.length === 0) changes.push("Потребность отредактирована");
        }
        await logHistory(editingId, changes);
      } else {
        const { data, error } = await supabase.from("needs").insert(payload).select("id").single();
        if (error) throw new Error(error.message);
        await logHistory(data.id as string, [
          status === "draft" ? "Создан черновик потребности" : "Потребность создана и опубликована",
        ]);
      }
      return status;
    },
    onSuccess: (status) => {
      toast.success(
        editingId
          ? "Изменения сохранены"
          : status === "draft"
            ? "Черновик сохранён — на сайте не показывается"
            : "Потребность опубликована",
      );
      setDialogOpen(false);
      setPhotoFile(null);
      setPhotoPreview(null);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const changeStatus = useMutation({
    mutationFn: async ({ need, status }: { need: NeedRecord; status: NeedStatus }) => {
      const update: Record<string, unknown> = { status };
      if (status === "closed" && need.required_amount) {
        update["collected_amount"] = need.required_amount;
      }
      const { error } = await supabase.from("needs").update(update).eq("id", need.id);
      if (error) throw new Error(error.message);
      await logHistory(need.id, [
        `Статус изменён: ${STATUS_META[need.status].label} → ${STATUS_META[status].label}`,
      ]);
      return { need, status };
    },
    onSuccess: ({ need, status }) => {
      toast.success("Статус изменён");
      if (status === "closed") setClosedNeed(need);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateProgress = useMutation({
    mutationFn: async ({ need, value }: { need: NeedRecord; value: number }) => {
      const { error } = await supabase
        .from("needs")
        .update({ collected_amount: value })
        .eq("id", need.id);
      if (error) throw new Error(error.message);
      await logHistory(need.id, [
        `Собрано изменено: ${formatAmount(Number(need.collected_amount ?? 0), unitLabel(need))} → ${formatAmount(value, unitLabel(need))}`,
      ]);
    },
    onSuccess: () => {
      toast.success("Прогресс обновлён");
      setProgressTarget(null);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeNeed = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("needs").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Потребность удалена");
      setDeleteTarget(null);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeDemo = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("needs").delete().eq("is_demo", true);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("DEMO-потребности удалены, реальные записи сохранены");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setPhotoFile(null);
    setPhotoPreview(null);
    setDialogOpen(true);
  }

  function openEdit(need: NeedRecord) {
    setEditingId(need.id);
    setForm({
      title: need.title,
      description: need.description ?? "",
      categoryId: need.category_id ?? "",
      publishedAt: need.published_at,
      priority: need.priority,
      status: need.status,
      goalType: need.goal_type,
      requiredAmount: need.required_amount === null ? "" : String(need.required_amount),
      collectedAmount: String(need.collected_amount ?? 0),
      unit: need.unit ?? "",
      reportUrl: need.report_url ?? "",
      payPhone: need.pay_phone ?? "",
      payBank: need.pay_bank ?? "",
      payRecipient: need.pay_recipient ?? "",
      payPurpose: need.pay_purpose ?? "",
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setDialogOpen(true);
  }

  function createReport(need: NeedRecord) {
    navigate({ to: "/admin/reports", search: { needId: need.id } });
  }

  const needs = needsQuery.data ?? [];

  const visibleNeeds = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = needs.filter(
      (need) =>
        (statusFilter === "all" || need.status === statusFilter) &&
        (categoryFilter === "all" || need.category_id === categoryFilter) &&
        (query === "" || need.title.toLowerCase().includes(query)),
    );
    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sort) {
        case "old":
          return a.published_at.localeCompare(b.published_at);
        case "urgent":
          return PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
        case "category":
          return (categoryName.get(a.category_id ?? "") ?? "яя").localeCompare(
            categoryName.get(b.category_id ?? "") ?? "яя",
          );
        case "progress":
          return (progressPercent(b) ?? -1) - (progressPercent(a) ?? -1);
        default:
          return b.published_at.localeCompare(a.published_at);
      }
    });
    return sorted;
  }, [needs, statusFilter, categoryFilter, search, sort, categoryName]);

  function remaining(need: NeedRecord) {
    if (need.required_amount === null) return "—";
    const left =
      need.status === "closed"
        ? 0
        : Math.max(0, need.required_amount - Number(need.collected_amount ?? 0));
    return formatAmount(left, unitLabel(need));
  }

  function Actions({ need }: { need: NeedRecord }) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => openEdit(need)}>
          Редактировать
        </Button>
        {need.goal_type !== "descriptive" ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setProgressTarget(need);
              setProgressValue(String(need.collected_amount ?? 0));
            }}
          >
            Обновить собрано
          </Button>
        ) : null}
        {need.status === "draft" ? (
          <Button size="sm" onClick={() => changeStatus.mutate({ need, status: "active" })}>
            Опубликовать
          </Button>
        ) : null}
        {need.status !== "closed" ? (
          <Button size="sm" variant="outline" onClick={() => setCloseTarget(need)}>
            Закрыть
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => changeStatus.mutate({ need, status: "active" })}
          >
            Вернуть в активные
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={() => createReport(need)}>
          Создать отчёт
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setHistoryTarget(need)}>
          История
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(need)}>
          Удалить
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl">Потребности</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Создание, публикация, обновление собранного, приоритет, закрытие и история изменений.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="lg" onClick={openCreate}>
            + Добавить потребность
          </Button>
          {needs.some((need) => need.is_demo) ? (
            <Button size="lg" variant="outline" onClick={() => removeDemo.mutate()}>
              Удалить все DEMO-потребности
            </Button>
          ) : null}
        </div>
      </div>

      {/* Фильтры, поиск, сортировка */}
      <div className="card-elevated grid gap-3 p-4">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setStatusFilter(filter.key)}
              className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                statusFilter === filter.key
                  ? "border-navy bg-navy text-navy-foreground"
                  : "border-border bg-card text-foreground hover:border-sky"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="grid gap-1.5">
            <Label htmlFor="search">Поиск по названию</Label>
            <Input
              id="search"
              value={search}
              placeholder="Например: материалы"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Категория</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                {(categoriesQuery.data ?? []).map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Сортировка</Label>
            <Select value={sort} onValueChange={(value) => setSort(value as SortKey)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {SORT_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {needsQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Загружаем список…</p>
      ) : visibleNeeds.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ничего не найдено по выбранным условиям.</p>
      ) : (
        <>
          {/* Таблица для компьютера */}
          <div className="card-elevated hidden overflow-x-auto p-2 lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-muted-foreground">
                  <th className="p-3">Название</th>
                  <th className="p-3">Категория</th>
                  <th className="p-3">Тип</th>
                  <th className="p-3">Статус</th>
                  <th className="p-3">Приоритет</th>
                  <th className="p-3">Требуется</th>
                  <th className="p-3">Собрано</th>
                  <th className="p-3">Осталось</th>
                  <th className="p-3">Прогресс</th>
                  <th className="p-3">Дата</th>
                  <th className="p-3">Действия</th>
                </tr>
              </thead>
              <tbody>
                {visibleNeeds.map((need) => {
                  const percent = progressPercent(need);
                  return (
                    <tr key={need.id} className="border-t border-border/70 align-top">
                      <td className="p-3 font-medium">
                        {need.title}
                        {need.is_demo ? (
                          <span className="ml-2 rounded-sm bg-warning px-1.5 py-0.5 text-xs text-warning-foreground">
                            DEMO
                          </span>
                        ) : null}
                      </td>
                      <td className="p-3">
                        {need.category_id ? (categoryName.get(need.category_id) ?? "—") : "—"}
                      </td>
                      <td className="p-3">{GOAL_TYPE_LABELS[need.goal_type]}</td>
                      <td className="p-3">
                        <span
                          className={`rounded-sm px-2 py-1 text-xs ${STATUS_META[need.status].className}`}
                        >
                          {STATUS_META[need.status].label}
                        </span>
                      </td>
                      <td className="p-3">{PRIORITY_META[need.priority].label}</td>
                      <td className="p-3">
                        {need.required_amount === null
                          ? "—"
                          : formatAmount(need.required_amount, unitLabel(need))}
                      </td>
                      <td className="p-3">
                        {need.goal_type === "descriptive"
                          ? "—"
                          : formatAmount(Number(need.collected_amount ?? 0), unitLabel(need))}
                      </td>
                      <td className="p-3">{remaining(need)}</td>
                      <td className="p-3">
                        {percent === null ? (
                          "—"
                        ) : (
                          <span className="flex items-center gap-2">
                            <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                              <span
                                className="block h-full rounded-full bg-sky"
                                style={{ width: `${percent}%` }}
                              />
                            </span>
                            {percent}%
                          </span>
                        )}
                      </td>
                      <td className="p-3">{formatDate(need.published_at)}</td>
                      <td className="p-3">
                        <Actions need={need} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Карточки для телефона */}
          <div className="grid gap-3 lg:hidden">
            {visibleNeeds.map((need) => {
              const percent = progressPercent(need);
              return (
                <article key={need.id} className="card-elevated grid gap-3 p-4">
                  <div>
                    <h3 className="text-lg">
                      {need.title}
                      {need.is_demo ? (
                        <span className="ml-2 rounded-sm bg-warning px-1.5 py-0.5 text-xs text-warning-foreground">
                          DEMO
                        </span>
                      ) : null}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {need.category_id
                        ? (categoryName.get(need.category_id) ?? "Без категории")
                        : "Без категории"}{" "}
                      · {formatDate(need.published_at)}
                    </p>
                  </div>
                  <p className="text-sm">
                    <span
                      className={`rounded-sm px-2 py-1 text-xs ${STATUS_META[need.status].className}`}
                    >
                      {STATUS_META[need.status].label}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      {PRIORITY_META[need.priority].label} · {GOAL_TYPE_LABELS[need.goal_type]}
                    </span>
                  </p>
                  {need.required_amount !== null ? (
                    <div className="grid gap-1.5 text-sm text-muted-foreground">
                      <p>
                        Требуется {formatAmount(need.required_amount, unitLabel(need))} · собрано{" "}
                        {formatAmount(Number(need.collected_amount ?? 0), unitLabel(need))} · осталось{" "}
                        {remaining(need)}
                      </p>
                      {percent !== null ? (
                        <span className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <span
                            className="block h-full rounded-full bg-sky"
                            style={{ width: `${percent}%` }}
                          />
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  <Actions need={need} />
                </article>
              );
            })}
          </div>
        </>
      )}

      {/* Форма создания / редактирования */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Изменить потребность" : "Новая потребность"}</DialogTitle>
            <DialogDescription>
              Тип потребности определяет, нужны ли количество или сумма. Черновик на сайте не
              показывается.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Название</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Категория</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(value) => setForm({ ...form, categoryId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {(categoriesQuery.data ?? [])
                      .filter((category) => !category.is_hidden)
                      .map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="justify-self-start px-0 text-xs"
                  onClick={() => {
                    const name = window.prompt("Название новой категории");
                    if (name && name.trim()) createCategory.mutate(name);
                  }}
                >
                  + Создать категорию
                </Button>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="published">Дата публикации</Label>
                <Input
                  id="published"
                  type="date"
                  value={form.publishedAt}
                  onChange={(e) => setForm({ ...form, publishedAt: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Приоритет</Label>
                <Select
                  value={form.priority}
                  onValueChange={(value) => setForm({ ...form, priority: value as NeedPriority })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PRIORITY_META) as NeedPriority[]).map((key) => (
                      <SelectItem key={key} value={key}>
                        {PRIORITY_META[key].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Статус</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) => setForm({ ...form, status: value as NeedStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_META) as NeedStatus[]).map((key) => (
                      <SelectItem key={key} value={key}>
                        {STATUS_META[key].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Тип потребности</Label>
              <Select
                value={form.goalType}
                onValueChange={(value) => setForm({ ...form, goalType: value as NeedGoalType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(GOAL_TYPE_LABELS) as NeedGoalType[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {GOAL_TYPE_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.goalType !== "descriptive" ? (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="required">
                      {form.goalType === "money" ? "Целевая сумма" : "Нужно количество"}
                    </Label>
                    <Input
                      id="required"
                      type="number"
                      min="0"
                      value={form.requiredAmount}
                      onChange={(e) => setForm({ ...form, requiredAmount: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="collected">Уже собрано</Label>
                    <Input
                      id="collected"
                      type="number"
                      min="0"
                      value={form.collectedAmount}
                      onChange={(e) => setForm({ ...form, collectedAmount: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="unit">
                      {form.goalType === "money" ? "Валюта" : "Единица измерения"}
                    </Label>
                    <Input
                      id="unit"
                      placeholder={form.goalType === "money" ? "₽" : "шт."}
                      value={form.unit}
                      onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    />
                    {form.goalType === "quantity" ? (
                      <div className="flex flex-wrap gap-1">
                        {UNIT_SUGGESTIONS.map((unit) => (
                          <button
                            key={unit}
                            type="button"
                            onClick={() => setForm({ ...form, unit })}
                            className="rounded-sm bg-muted px-2 py-0.5 text-xs text-foreground"
                          >
                            {unit}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Осталось:{" "}
                  {formatAmount(
                    Math.max(
                      0,
                      Number(form.requiredAmount || 0) - Number(form.collectedAmount || 0),
                    ),
                    form.unit || (form.goalType === "money" ? "₽" : ""),
                  )}{" "}
                  · Прогресс:{" "}
                  {Number(form.requiredAmount) > 0
                    ? Math.min(
                        100,
                        Math.round(
                          (Number(form.collectedAmount || 0) / Number(form.requiredAmount)) * 100,
                        ),
                      )
                    : 0}
                  %
                </p>
              </>
            ) : null}

            {form.goalType === "money" ? (
              <div className="grid gap-4 rounded-lg border border-border p-4">
                <p className="font-display text-sm uppercase">Реквизиты для перевода</p>
                <p className="text-xs text-muted-foreground">
                  Показываются посетителю в окне «Помочь сейчас». Только для денежных сборов.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="pay-phone">Номер телефона</Label>
                    <Input
                      id="pay-phone"
                      value={form.payPhone}
                      onChange={(e) => setForm({ ...form, payPhone: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pay-bank">Банк</Label>
                    <Input
                      id="pay-bank"
                      value={form.payBank}
                      onChange={(e) => setForm({ ...form, payBank: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pay-recipient">Получатель</Label>
                    <Input
                      id="pay-recipient"
                      value={form.payRecipient}
                      onChange={(e) => setForm({ ...form, payRecipient: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pay-purpose">Назначение платежа</Label>
                    <Input
                      id="pay-purpose"
                      value={form.payPurpose}
                      onChange={(e) => setForm({ ...form, payPurpose: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            <div className="grid gap-2">
              <Label htmlFor="photo">Фото (JPG, PNG или WEBP, до 10 МБ)</Label>
              <Input
                id="photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setPhotoFile(file);
                  setPhotoPreview(file ? URL.createObjectURL(file) : null);
                }}
              />
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Предпросмотр фото"
                  className="mt-1 h-32 w-full rounded-md object-cover"
                />
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="report">Ссылка на отчёт</Label>
              <Input
                id="report"
                placeholder="https://..."
                value={form.reportUrl}
                onChange={(e) => setForm({ ...form, reportUrl: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            {editingId ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    const need = needs.find((item) => item.id === editingId);
                    if (need) {
                      setDialogOpen(false);
                      setCloseTarget(need);
                    }
                  }}
                >
                  Закрыть потребность
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    const need = needs.find((item) => item.id === editingId);
                    if (need) {
                      setDialogOpen(false);
                      setDeleteTarget(need);
                    }
                  }}
                >
                  Удалить
                </Button>
                <Button onClick={() => saveNeed.mutate(undefined)} disabled={saveNeed.isPending}>
                  Сохранить изменения
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => saveNeed.mutate("draft")}
                  disabled={saveNeed.isPending}
                >
                  Сохранить как черновик
                </Button>
                <Button onClick={() => saveNeed.mutate("active")} disabled={saveNeed.isPending}>
                  Опубликовать
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Быстрое обновление собранного */}
      <Dialog open={Boolean(progressTarget)} onOpenChange={(open) => !open && setProgressTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Обновить собрано</DialogTitle>
            <DialogDescription>{progressTarget?.title}</DialogDescription>
          </DialogHeader>
          {progressTarget ? (
            <div className="grid gap-3">
              <p className="text-sm text-muted-foreground">
                Текущее значение:{" "}
                {formatAmount(Number(progressTarget.collected_amount ?? 0), unitLabel(progressTarget))}
              </p>
              <div className="grid gap-2">
                <Label htmlFor="new-collected">Новое значение собрано</Label>
                <Input
                  id="new-collected"
                  type="number"
                  min="0"
                  value={progressValue}
                  onChange={(e) => setProgressValue(e.target.value)}
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setProgressTarget(null)}>
              Отмена
            </Button>
            <Button
              disabled={updateProgress.isPending}
              onClick={() =>
                progressTarget &&
                updateProgress.mutate({
                  need: progressTarget,
                  value: Number(progressValue || 0),
                })
              }
            >
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* История изменений */}
      <Dialog open={Boolean(historyTarget)} onOpenChange={(open) => !open && setHistoryTarget(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>История изменений</DialogTitle>
            <DialogDescription>{historyTarget?.title}</DialogDescription>
          </DialogHeader>
          {historyQuery.isPending ? (
            <p className="text-sm text-muted-foreground">Загружаем…</p>
          ) : (historyQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Изменений пока не было.</p>
          ) : (
            <ul className="grid gap-3">
              {(historyQuery.data ?? []).map((item) => (
                <li key={item.id} className="border-b border-border/60 pb-2 text-sm">
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(item.created_at)}
                    {item.changed_by_email ? ` · ${item.changed_by_email}` : ""}
                  </p>
                  <p>{item.summary}</p>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      {/* Подтверждение закрытия */}
      <AlertDialog open={Boolean(closeTarget)} onOpenChange={(open) => !open && setCloseTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы действительно хотите закрыть эту потребность?</AlertDialogTitle>
            <AlertDialogDescription>
              После закрытия кнопки помощи на сайте отключаются, прогресс отображается как
              выполненный.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                closeTarget && changeStatus.mutate({ need: closeTarget, status: "closed" })
              }
            >
              Закрыть потребность
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Предложение создать отчёт после закрытия */}
      <Dialog open={Boolean(closedNeed)} onOpenChange={(open) => !open && setClosedNeed(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Потребность закрыта</DialogTitle>
            <DialogDescription>
              Можно сразу подготовить отчёт по «{closedNeed?.title}».
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClosedNeed(null)}>
              Позже
            </Button>
            <Button
              onClick={() => {
                if (closedNeed) createReport(closedNeed);
                setClosedNeed(null);
              }}
            >
              Создать отчёт по потребности
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Подтверждение удаления */}
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить потребность без возможности восстановления?</AlertDialogTitle>
            <AlertDialogDescription>
              «{deleteTarget?.title}» будет удалена вместе с историей изменений. Для опубликованных
              сборов лучше использовать статус «Закрыто».
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && removeNeed.mutate(deleteTarget.id)}>
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

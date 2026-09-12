import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { REPORT_STATUS_META, type ReportStatus } from "@/lib/admin-types";
import { formatDate, GOAL_TYPE_LABELS, type NeedGoalType } from "@/lib/needs-types";
import { signedUrls, uploadDocument, uploadImage } from "@/lib/admin-upload";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  validateSearch: (search: Record<string, unknown>): { needId?: string } =>
    typeof search["needId"] === "string" ? { needId: search["needId"] } : {},
  component: AdminReports,
});

const BUCKET = "report-files";

type ReportRecord = {
  id: string;
  title: string;
  need_id: string | null;
  need_title: string;
  need_goal_type: string;
  category_id: string | null;
  report_date: string;
  summary: string;
  body: string;
  purchased_items: string;
  coordinator_note: string;
  unit: string | null;
  target_amount: number | null;
  collected_amount: number | null;
  spent_amount: number | null;
  delivered_amount: number | null;
  photo_paths: string[];
  document_paths: string[];
  document_names: string[];
  public_document_paths: string[];
  status: ReportStatus;
  is_demo: boolean;
};

type FormState = {
  title: string;
  needId: string;
  needTitle: string;
  needGoalType: NeedGoalType;
  categoryId: string;
  reportDate: string;
  summary: string;
  body: string;
  purchasedItems: string;
  coordinatorNote: string;
  unit: string;
  targetAmount: string;
  collectedAmount: string;
  spentAmount: string;
  deliveredAmount: string;
  photoPaths: string[];
  documentPaths: string[];
  documentNames: string[];
  publicDocumentPaths: string[];
  status: ReportStatus;
};

const emptyForm: FormState = {
  title: "",
  needId: "",
  needTitle: "",
  needGoalType: "descriptive",
  categoryId: "",
  reportDate: new Date().toISOString().slice(0, 10),
  summary: "",
  body: "",
  purchasedItems: "",
  coordinatorNote: "",
  unit: "",
  targetAmount: "",
  collectedAmount: "",
  spentAmount: "",
  deliveredAmount: "",
  photoPaths: [],
  documentPaths: [],
  documentNames: [],
  publicDocumentPaths: [],
  status: "draft",
};

function AdminReports() {
  const { needId } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | ReportStatus>("all");
  const [deleteTarget, setDeleteTarget] = useState<ReportRecord | null>(null);

  const reportsQuery = useQuery({
    queryKey: ["reports", "admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("report_date", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as ReportRecord[];
    },
  });

  const needsQuery = useQuery({
    queryKey: ["needs", "admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("needs")
        .select(
          "id, title, category_id, status, goal_type, collected_amount, required_amount, unit, published_at",
        )
        .order("published_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
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

  const previewsQuery = useQuery({
    queryKey: ["reports", "previews", form.photoPaths, form.documentPaths],
    enabled: dialogOpen && form.photoPaths.length + form.documentPaths.length > 0,
    queryFn: () => signedUrls(BUCKET, [...form.photoPaths, ...form.documentPaths]),
  });

  function fillFromNeed(needIdValue: string) {
    const need = (needsQuery.data ?? []).find((item) => item.id === needIdValue);
    if (!need) {
      setForm((prev) => ({ ...prev, needId: needIdValue }));
      return;
    }
    const goalType = need.goal_type as NeedGoalType;
    const unit = need.unit ?? (goalType === "money" ? "₽" : "");
    setForm((prev) => ({
      ...prev,
      needId: need.id,
      needTitle: need.title,
      needGoalType: goalType,
      categoryId: need.category_id ?? "",
      unit,
      targetAmount: need.required_amount === null ? "" : String(need.required_amount),
      collectedAmount: String(need.collected_amount ?? 0),
      title: prev.title || `Отчёт: ${need.title}`,
      reportDate: prev.reportDate,
      summary:
        prev.summary ||
        (need.required_amount !== null
          ? `Итог: собрано ${need.collected_amount ?? 0} из ${need.required_amount} ${unit}`.trim()
          : ""),
    }));
  }

  // Создание отчёта из закрытой потребности: автоподстановка данных
  useEffect(() => {
    if (!needId || !needsQuery.data) return;
    const need = needsQuery.data.find((item) => item.id === needId);
    if (!need) return;
    const goalType = need.goal_type as NeedGoalType;
    const unit = need.unit ?? (goalType === "money" ? "₽" : "");
    setEditingId(null);
    setForm({
      ...emptyForm,
      title: `Отчёт: ${need.title}`,
      needId: need.id,
      needTitle: need.title,
      needGoalType: goalType,
      categoryId: need.category_id ?? "",
      unit,
      targetAmount: need.required_amount === null ? "" : String(need.required_amount),
      collectedAmount: String(need.collected_amount ?? 0),
      summary:
        need.required_amount !== null
          ? `Итог: собрано ${need.collected_amount ?? 0} из ${need.required_amount} ${unit}`.trim()
          : "",
    });
    setDialogOpen(true);
    navigate({ to: "/admin/reports", search: {}, replace: true });
  }, [needId, needsQuery.data, navigate]);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["reports"] });
    queryClient.invalidateQueries({ queryKey: ["needs"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
  }

  function numberOrNull(value: string) {
    return value.trim() === "" ? null : Number(value);
  }

  const saveReport = useMutation({
    mutationFn: async (statusOverride?: ReportStatus) => {
      if (!form.title.trim()) throw new Error("Укажите название отчёта");
      const payload = {
        title: form.title.trim(),
        need_id: form.needId || null,
        need_title: form.needTitle.trim(),
        need_goal_type: form.needGoalType,
        category_id: form.categoryId || null,
        report_date: form.reportDate,
        summary: form.summary.trim(),
        body: form.body.trim(),
        purchased_items: form.purchasedItems.trim(),
        coordinator_note: form.coordinatorNote.trim(),
        unit: form.unit.trim() || null,
        target_amount: numberOrNull(form.targetAmount),
        collected_amount: numberOrNull(form.collectedAmount),
        spent_amount: numberOrNull(form.spentAmount),
        delivered_amount: numberOrNull(form.deliveredAmount),
        photo_paths: form.photoPaths,
        document_paths: form.documentPaths,
        document_names: form.documentNames,
        public_document_paths: form.publicDocumentPaths,
        status: statusOverride ?? form.status,
      };
      if (editingId) {
        const { error } = await supabase.from("reports").update(payload).eq("id", editingId);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("reports").insert(payload);
        if (error) throw new Error(error.message);
      }
      return payload.status;
    },
    onSuccess: (status) => {
      toast.success(
        status === "published" ? "Отчёт опубликован" : "Черновик сохранён — на сайте не виден",
      );
      setDialogOpen(false);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const togglePublish = useMutation({
    mutationFn: async (report: ReportRecord) => {
      const status: ReportStatus = report.status === "published" ? "draft" : "published";
      const { error } = await supabase.from("reports").update({ status }).eq("id", report.id);
      if (error) throw new Error(error.message);
      return status;
    },
    onSuccess: (status) => {
      toast.success(status === "published" ? "Отчёт опубликован" : "Отчёт снят с публикации");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeReport = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reports").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Отчёт удалён");
      setDeleteTarget(null);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeDemo = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("reports").delete().eq("is_demo", true);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("DEMO-отчёты удалены");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function addFiles(files: FileList | null, kind: "photo" | "document") {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: { path: string; name: string }[] = [];
      for (const file of Array.from(files)) {
        const path =
          kind === "photo" ? await uploadImage(BUCKET, file) : await uploadDocument(BUCKET, file);
        uploaded.push({ path, name: file.name });
      }
      setForm((prev) =>
        kind === "photo"
          ? { ...prev, photoPaths: [...prev.photoPaths, ...uploaded.map((item) => item.path)] }
          : {
              ...prev,
              documentPaths: [...prev.documentPaths, ...uploaded.map((item) => item.path)],
              documentNames: [...prev.documentNames, ...uploaded.map((item) => item.name)],
            },
      );
      toast.success("Файлы загружены");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось загрузить файл");
    } finally {
      setUploading(false);
    }
  }

  function removeDocument(path: string) {
    const index = form.documentPaths.indexOf(path);
    setForm({
      ...form,
      documentPaths: form.documentPaths.filter((item) => item !== path),
      documentNames: form.documentNames.filter((_, i) => i !== index),
      publicDocumentPaths: form.publicDocumentPaths.filter((item) => item !== path),
    });
  }

  function toggleDocumentPublic(path: string, checked: boolean) {
    setForm({
      ...form,
      publicDocumentPaths: checked
        ? [...form.publicDocumentPaths, path]
        : form.publicDocumentPaths.filter((item) => item !== path),
    });
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(report: ReportRecord) {
    setEditingId(report.id);
    setForm({
      title: report.title,
      needId: report.need_id ?? "",
      needTitle: report.need_title ?? "",
      needGoalType: (report.need_goal_type as NeedGoalType) ?? "descriptive",
      categoryId: report.category_id ?? "",
      reportDate: report.report_date,
      summary: report.summary ?? "",
      body: report.body ?? "",
      purchasedItems: report.purchased_items ?? "",
      coordinatorNote: report.coordinator_note ?? "",
      unit: report.unit ?? "",
      targetAmount: report.target_amount === null ? "" : String(report.target_amount),
      collectedAmount: report.collected_amount === null ? "" : String(report.collected_amount),
      spentAmount: report.spent_amount === null ? "" : String(report.spent_amount),
      deliveredAmount: report.delivered_amount === null ? "" : String(report.delivered_amount),
      photoPaths: report.photo_paths ?? [],
      documentPaths: report.document_paths ?? [],
      documentNames: report.document_names ?? [],
      publicDocumentPaths: report.public_document_paths ?? [],
      status: report.status,
    });
    setDialogOpen(true);
  }

  const reports = (reportsQuery.data ?? []).filter(
    (report) => statusFilter === "all" || report.status === statusFilter,
  );
  const needTitle = new Map((needsQuery.data ?? []).map((need) => [need.id, need.title]));
  const categoryName = new Map((categoriesQuery.data ?? []).map((c) => [c.id, c.name]));

  function Actions({ report }: { report: ReportRecord }) {
    return (
      <div className="flex flex-wrap gap-2">
        {report.status === "published" ? (
          <Button size="sm" variant="outline" asChild>
            <a href={`/reports/${report.id}`} target="_blank" rel="noreferrer">
              Открыть
            </a>
          </Button>
        ) : null}
        <Button size="sm" variant="outline" onClick={() => openEdit(report)}>
          Редактировать
        </Button>
        <Button size="sm" variant="outline" onClick={() => togglePublish.mutate(report)}>
          {report.status === "published" ? "Снять с публикации" : "Опубликовать"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(report)}>
          Удалить
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl">Отчёты</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Черновики видны только здесь. На сайте показываются опубликованные отчёты и только те
            документы, которые вы отметили как публичные.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="lg" onClick={openCreate}>
            + Добавить отчёт
          </Button>
          {(reportsQuery.data ?? []).some((report) => report.is_demo) ? (
            <Button size="lg" variant="outline" onClick={() => removeDemo.mutate()}>
              Удалить все DEMO-отчёты
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: "all", label: "Все" },
            { key: "draft", label: "Черновики" },
            { key: "published", label: "Опубликованные" },
          ] as const
        ).map((filter) => (
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

      {reportsQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Загружаем отчёты…</p>
      ) : reports.length === 0 ? (
        <p className="text-sm text-muted-foreground">Отчётов пока нет.</p>
      ) : (
        <>
          {/* Таблица для компьютера */}
          <div className="card-elevated hidden overflow-x-auto p-2 lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-muted-foreground">
                  <th className="p-3">Название</th>
                  <th className="p-3">Потребность</th>
                  <th className="p-3">Дата</th>
                  <th className="p-3">Категория</th>
                  <th className="p-3">Файлы</th>
                  <th className="p-3">Статус</th>
                  <th className="p-3">Действия</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="border-t border-border/70 align-top">
                    <td className="p-3 font-medium">
                      {report.title}
                      {report.is_demo ? (
                        <span className="ml-2 rounded-sm bg-warning px-1.5 py-0.5 text-xs text-warning-foreground">
                          DEMO
                        </span>
                      ) : null}
                    </td>
                    <td className="p-3">
                      {report.need_title ||
                        (report.need_id ? (needTitle.get(report.need_id) ?? "—") : "—")}
                    </td>
                    <td className="p-3">{formatDate(report.report_date)}</td>
                    <td className="p-3">
                      {report.category_id ? (categoryName.get(report.category_id) ?? "—") : "—"}
                    </td>
                    <td className="p-3">
                      фото {report.photo_paths?.length ?? 0} · док.{" "}
                      {report.document_paths?.length ?? 0} (публично{" "}
                      {report.public_document_paths?.length ?? 0})
                    </td>
                    <td className="p-3">
                      <span
                        className={`rounded-sm px-2 py-1 text-xs ${REPORT_STATUS_META[report.status].className}`}
                      >
                        {REPORT_STATUS_META[report.status].label}
                      </span>
                    </td>
                    <td className="p-3">
                      <Actions report={report} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Карточки для телефона */}
          <div className="grid gap-3 lg:hidden">
            {reports.map((report) => (
              <article key={report.id} className="card-elevated grid gap-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg">
                      {report.title}
                      {report.is_demo ? (
                        <span className="ml-2 rounded-sm bg-warning px-1.5 py-0.5 text-xs text-warning-foreground">
                          DEMO
                        </span>
                      ) : null}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(report.report_date)}
                      {report.need_title ? ` · ${report.need_title}` : ""}
                    </p>
                  </div>
                  <span
                    className={`rounded-sm px-2 py-1 text-xs ${REPORT_STATUS_META[report.status].className}`}
                  >
                    {REPORT_STATUS_META[report.status].label}
                  </span>
                </div>
                {report.summary ? <p className="text-sm">{report.summary}</p> : null}
                <Actions report={report} />
              </article>
            ))}
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Изменить отчёт" : "Новый отчёт"}</DialogTitle>
            <DialogDescription>
              Отчёт можно связать с закрытой потребностью, добавить фото, документы и чеки. Цифры
              вводите сами — автоматически ничего не рассчитывается.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="report-title">Название</Label>
              <Input
                id="report-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Связанная потребность</Label>
                <Select value={form.needId} onValueChange={fillFromNeed}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите потребность" />
                  </SelectTrigger>
                  <SelectContent>
                    {(needsQuery.data ?? []).map((need) => (
                      <SelectItem key={need.id} value={need.id}>
                        {need.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.needTitle ? (
                  <p className="text-xs text-muted-foreground">
                    Подставлено: {form.needTitle} · {GOAL_TYPE_LABELS[form.needGoalType]}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="report-date">Дата</Label>
                <Input
                  id="report-date"
                  type="date"
                  value={form.reportDate}
                  onChange={(e) => setForm({ ...form, reportDate: e.target.value })}
                />
              </div>
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
              </div>
              <div className="grid gap-2">
                <Label>Тип отчёта</Label>
                <Select
                  value={form.needGoalType}
                  onValueChange={(value) =>
                    setForm({ ...form, needGoalType: value as NeedGoalType })
                  }
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
            </div>

            {form.needGoalType !== "descriptive" ? (
              <div className="grid gap-4 rounded-lg border border-border p-4">
                <p className="font-display text-sm uppercase">
                  {form.needGoalType === "money" ? "Денежный итог" : "Количественный итог"}
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="target">
                      {form.needGoalType === "money" ? "Цель сбора" : "Требовалось"}
                    </Label>
                    <Input
                      id="target"
                      type="number"
                      min="0"
                      value={form.targetAmount}
                      onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="collected">Собрано</Label>
                    <Input
                      id="collected"
                      type="number"
                      min="0"
                      value={form.collectedAmount}
                      onChange={(e) => setForm({ ...form, collectedAmount: e.target.value })}
                    />
                  </div>
                  {form.needGoalType === "money" ? (
                    <div className="grid gap-2">
                      <Label htmlFor="spent">Потрачено</Label>
                      <Input
                        id="spent"
                        type="number"
                        min="0"
                        value={form.spentAmount}
                        onChange={(e) => setForm({ ...form, spentAmount: e.target.value })}
                      />
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      <Label htmlFor="delivered">Передано</Label>
                      <Input
                        id="delivered"
                        type="number"
                        min="0"
                        value={form.deliveredAmount}
                        onChange={(e) => setForm({ ...form, deliveredAmount: e.target.value })}
                      />
                    </div>
                  )}
                  <div className="grid gap-2">
                    <Label htmlFor="report-unit">
                      {form.needGoalType === "money" ? "Валюта" : "Единица измерения"}
                    </Label>
                    <Input
                      id="report-unit"
                      placeholder={form.needGoalType === "money" ? "₽" : "шт."}
                      value={form.unit}
                      onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            <div className="grid gap-2">
              <Label htmlFor="report-summary">Итог (кратко)</Label>
              <Input
                id="report-summary"
                placeholder="Например: передано 40 из 40 комплектов"
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="report-purchased">Что приобретено и передано</Label>
              <Textarea
                id="report-purchased"
                rows={3}
                value={form.purchasedItems}
                onChange={(e) => setForm({ ...form, purchasedItems: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="report-body">Полный текст отчёта</Label>
              <Textarea
                id="report-body"
                rows={4}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="report-note">Примечание координатора</Label>
              <Textarea
                id="report-note"
                rows={2}
                value={form.coordinatorNote}
                onChange={(e) => setForm({ ...form, coordinatorNote: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="report-photos">Фото (JPG, PNG, WEBP, до 10 МБ)</Label>
              <Input
                id="report-photos"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                disabled={uploading}
                onChange={(e) => void addFiles(e.target.files, "photo")}
              />
              <p className="text-xs text-muted-foreground">
                Первое фото используется как главное в списке отчётов.
              </p>
              {form.photoPaths.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {form.photoPaths.map((path) => (
                    <div key={path} className="relative">
                      <img
                        src={previewsQuery.data?.get(path) ?? ""}
                        alt="Фото отчёта"
                        className="aspect-square w-full rounded-md bg-muted object-cover"
                      />
                      <button
                        type="button"
                        aria-label="Удалить фото"
                        className="absolute right-1 top-1 rounded-sm bg-background/90 px-1.5 text-sm"
                        onClick={() =>
                          setForm({
                            ...form,
                            photoPaths: form.photoPaths.filter((item) => item !== path),
                          })
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="report-docs">Документы и чеки (PDF, JPG, PNG, до 10 МБ)</Label>
              <Input
                id="report-docs"
                type="file"
                multiple
                accept="application/pdf,image/jpeg,image/png"
                disabled={uploading}
                onChange={(e) => void addFiles(e.target.files, "document")}
              />
              <p className="text-xs text-muted-foreground">
                Документы не публикуются автоматически — отметьте те, которые можно показать на
                сайте.
              </p>
              {form.documentPaths.length > 0 ? (
                <ul className="grid gap-2 text-sm">
                  {form.documentPaths.map((path, index) => (
                    <li key={path} className="flex items-center gap-2">
                      <Checkbox
                        id={`public-${path}`}
                        checked={form.publicDocumentPaths.includes(path)}
                        onCheckedChange={(checked) => toggleDocumentPublic(path, checked === true)}
                      />
                      <Label htmlFor={`public-${path}`} className="text-xs">
                        публично
                      </Label>
                      <a
                        href={previewsQuery.data?.get(path) ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="min-w-0 flex-1 truncate text-accent hover:underline"
                      >
                        {form.documentNames[index] || path}
                      </a>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => removeDocument(path)}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              variant="outline"
              onClick={() => saveReport.mutate("draft")}
              disabled={saveReport.isPending || uploading}
            >
              Сохранить как черновик
            </Button>
            <Button
              onClick={() => saveReport.mutate("published")}
              disabled={saveReport.isPending || uploading}
            >
              Опубликовать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Удалить отчёт без возможности восстановления?</AlertDialogTitle>
          <AlertDialogHeader>
            <AlertDialogDescription>
              «{deleteTarget?.title}» исчезнет с сайта вместе с фотографиями и документами.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && removeReport.mutate(deleteTarget.id)}>
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import { REPORT_STATUS_META, type ReportStatus } from "@/lib/admin-types";
import { formatDate } from "@/lib/needs-types";
import { signedUrls, uploadDocument, uploadImage } from "@/lib/admin-upload";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  validateSearch: (search: Record<string, unknown>): { needId?: string } => ({
    needId: typeof search["needId"] === "string" ? search["needId"] : undefined,
  }),
  component: AdminReports,
});

const BUCKET = "report-files";

type ReportRecord = {
  id: string;
  title: string;
  need_id: string | null;
  category_id: string | null;
  report_date: string;
  summary: string;
  body: string;
  photo_paths: string[];
  document_paths: string[];
  status: ReportStatus;
  is_demo: boolean;
};

type FormState = {
  title: string;
  needId: string;
  categoryId: string;
  reportDate: string;
  summary: string;
  body: string;
  photoPaths: string[];
  documentPaths: string[];
  status: ReportStatus;
};

const emptyForm: FormState = {
  title: "",
  needId: "",
  categoryId: "",
  reportDate: new Date().toISOString().slice(0, 10),
  summary: "",
  body: "",
  photoPaths: [],
  documentPaths: [],
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

  const reportsQuery = useQuery({
    queryKey: ["reports", "admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select(
          "id, title, need_id, category_id, report_date, summary, body, photo_paths, document_paths, status, is_demo",
        )
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
        .select("id, title, category_id, status, collected_amount, required_amount, unit")
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

  // Создание отчёта из закрытой потребности: автоподстановка данных
  useEffect(() => {
    if (!needId || !needsQuery.data) return;
    const need = needsQuery.data.find((item) => item.id === needId);
    if (!need) return;
    setEditingId(null);
    setForm({
      ...emptyForm,
      title: `Отчёт: ${need.title}`,
      needId: need.id,
      categoryId: need.category_id ?? "",
      summary:
        need.required_amount !== null
          ? `Итог: ${need.collected_amount ?? 0} из ${need.required_amount} ${need.unit ?? ""}`.trim()
          : "",
      body: `Потребность: ${need.title}`,
    });
    setDialogOpen(true);
    navigate({ to: "/admin/reports", search: {}, replace: true });
  }, [needId, needsQuery.data, navigate]);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["reports"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
  }

  const saveReport = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) throw new Error("Укажите название отчёта");
      const payload = {
        title: form.title.trim(),
        need_id: form.needId || null,
        category_id: form.categoryId || null,
        report_date: form.reportDate,
        summary: form.summary.trim(),
        body: form.body.trim(),
        photo_paths: form.photoPaths,
        document_paths: form.documentPaths,
        status: form.status,
      };
      if (editingId) {
        const { error } = await supabase.from("reports").update(payload).eq("id", editingId);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("reports").insert(payload);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Отчёт обновлён" : "Отчёт создан");
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
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function addFiles(files: FileList | null, kind: "photo" | "document") {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const paths: string[] = [];
      for (const file of Array.from(files)) {
        paths.push(
          kind === "photo" ? await uploadImage(BUCKET, file) : await uploadDocument(BUCKET, file),
        );
      }
      setForm((prev) =>
        kind === "photo"
          ? { ...prev, photoPaths: [...prev.photoPaths, ...paths] }
          : { ...prev, documentPaths: [...prev.documentPaths, ...paths] },
      );
      toast.success("Файлы загружены");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось загрузить файл");
    } finally {
      setUploading(false);
    }
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
      categoryId: report.category_id ?? "",
      reportDate: report.report_date,
      summary: report.summary ?? "",
      body: report.body ?? "",
      photoPaths: report.photo_paths ?? [],
      documentPaths: report.document_paths ?? [],
      status: report.status,
    });
    setDialogOpen(true);
  }

  const reports = reportsQuery.data ?? [];
  const needTitle = new Map((needsQuery.data ?? []).map((need) => [need.id, need.title]));

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl">Отчёты</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Черновики видны только здесь. На сайте показываются опубликованные отчёты.
          </p>
        </div>
        <Button size="lg" onClick={openCreate}>
          Добавить отчёт
        </Button>
      </div>

      {reportsQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Загружаем отчёты…</p>
      ) : reports.length === 0 ? (
        <p className="text-sm text-muted-foreground">Отчётов пока нет.</p>
      ) : (
        <div className="grid gap-3">
          {reports.map((report) => (
            <article key={report.id} className="card-elevated grid gap-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg">{report.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(report.report_date)}
                    {report.need_id ? ` · ${needTitle.get(report.need_id) ?? ""}` : ""}
                    {` · фото: ${report.photo_paths.length} · документы: ${report.document_paths.length}`}
                  </p>
                </div>
                <span
                  className={`rounded-sm px-2 py-1 text-xs ${REPORT_STATUS_META[report.status].className}`}
                >
                  {REPORT_STATUS_META[report.status].label}
                </span>
              </div>
              {report.summary ? <p className="text-sm">{report.summary}</p> : null}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(report)}>
                  Редактировать
                </Button>
                <Button size="sm" variant="outline" onClick={() => togglePublish.mutate(report)}>
                  {report.status === "published" ? "Снять с публикации" : "Опубликовать"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => removeReport.mutate(report.id)}>
                  Удалить
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Изменить отчёт" : "Новый отчёт"}</DialogTitle>
            <DialogDescription>
              Отчёт можно связать с закрытой потребностью, добавить фото и документы.
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
                <Label>Потребность</Label>
                <Select
                  value={form.needId}
                  onValueChange={(value) => setForm({ ...form, needId: value })}
                >
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
                <Label>Статус</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) => setForm({ ...form, status: value as ReportStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(REPORT_STATUS_META) as ReportStatus[]).map((key) => (
                      <SelectItem key={key} value={key}>
                        {REPORT_STATUS_META[key].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="report-summary">Итог</Label>
              <Input
                id="report-summary"
                placeholder="Например: передано 40 из 40 комплектов"
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="report-body">Описание</Label>
              <Textarea
                id="report-body"
                rows={4}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="report-photos">Фото (JPG или PNG, до 10 МБ)</Label>
              <Input
                id="report-photos"
                type="file"
                multiple
                accept="image/jpeg,image/png"
                disabled={uploading}
                onChange={(e) => void addFiles(e.target.files, "photo")}
              />
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
              {form.documentPaths.length > 0 ? (
                <ul className="grid gap-1 text-sm">
                  {form.documentPaths.map((path) => (
                    <li key={path} className="flex items-center justify-between gap-2">
                      <a
                        href={previewsQuery.data?.get(path) ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-accent hover:underline"
                      >
                        {path}
                      </a>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          setForm({
                            ...form,
                            documentPaths: form.documentPaths.filter((item) => item !== path),
                          })
                        }
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={() => saveReport.mutate()}
              disabled={saveReport.isPending || uploading}
            >
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

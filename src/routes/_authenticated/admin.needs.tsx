import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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
  GOAL_TYPE_LABELS,
  PRIORITY_META,
  STATUS_META,
  formatDate,
  type NeedGoalType,
  type NeedPriority,
  type NeedStatus,
} from "@/lib/needs-types";
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

function AdminNeeds() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

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

  const categoryName = new Map((categoriesQuery.data ?? []).map((c) => [c.id, c.name]));

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["needs"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
  }

  const saveNeed = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) throw new Error("Укажите название потребности");
      if (form.goalType !== "descriptive" && !form.requiredAmount) {
        throw new Error(
          form.goalType === "money" ? "Укажите требуемую сумму" : "Укажите требуемое количество",
        );
      }
      let photoPath: string | null | undefined;
      if (photoFile) photoPath = await uploadImage("need-photos", photoFile);

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category_id: form.categoryId || null,
        published_at: form.publishedAt,
        priority: form.priority,
        status: form.status,
        goal_type: form.goalType,
        required_amount:
          form.goalType === "descriptive" || form.requiredAmount === ""
            ? null
            : Number(form.requiredAmount),
        collected_amount: form.goalType === "descriptive" ? 0 : Number(form.collectedAmount || 0),
        unit: form.goalType === "descriptive" ? null : form.unit.trim() || null,
        report_url: form.reportUrl.trim() || null,
        ...(photoPath !== undefined ? { photo_url: photoPath } : {}),
      };

      if (editingId) {
        const { error } = await supabase.from("needs").update(payload).eq("id", editingId);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("needs").insert(payload);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Потребность обновлена" : "Потребность добавлена");
      setDialogOpen(false);
      setPhotoFile(null);
      setPhotoPreview(null);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const changeStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: NeedStatus }) => {
      const { error } = await supabase.from("needs").update({ status }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Статус изменён");
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
      toast.success("Demo-потребности удалены");
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
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setDialogOpen(true);
  }

  function createReport(need: NeedRecord) {
    navigate({ to: "/admin/reports", search: { needId: need.id } });
  }

  const needs = needsQuery.data ?? [];

  function remaining(need: NeedRecord) {
    if (need.required_amount === null) return "—";
    return `${Math.max(0, need.required_amount - (need.collected_amount ?? 0))} ${need.unit ?? ""}`;
  }

  function Actions({ need }: { need: NeedRecord }) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => openEdit(need)}>
          Редактировать
        </Button>
        {need.status !== "closed" ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => changeStatus.mutate({ id: need.id, status: "closed" })}
          >
            Закрыть
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => changeStatus.mutate({ id: need.id, status: "active" })}
          >
            Вернуть в активные
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={() => createReport(need)}>
          Создать отчёт
        </Button>
        <Button size="sm" variant="ghost" onClick={() => removeNeed.mutate(need.id)}>
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
            Публикация, обновление собранного, приоритет и закрытие потребностей.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="lg" onClick={openCreate}>
            Добавить потребность
          </Button>
          {needs.some((need) => need.is_demo) ? (
            <Button size="lg" variant="outline" onClick={() => removeDemo.mutate()}>
              Удалить все demo
            </Button>
          ) : null}
        </div>
      </div>

      {needsQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Загружаем список…</p>
      ) : needs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Потребностей пока нет.</p>
      ) : (
        <>
          {/* Таблица для компьютера */}
          <div className="card-elevated hidden overflow-x-auto p-2 lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-muted-foreground">
                  <th className="p-3">Название</th>
                  <th className="p-3">Категория</th>
                  <th className="p-3">Статус</th>
                  <th className="p-3">Приоритет</th>
                  <th className="p-3">Требуется</th>
                  <th className="p-3">Собрано</th>
                  <th className="p-3">Осталось</th>
                  <th className="p-3">Дата</th>
                  <th className="p-3">Действия</th>
                </tr>
              </thead>
              <tbody>
                {needs.map((need) => (
                  <tr key={need.id} className="border-t border-border/70 align-top">
                    <td className="p-3 font-medium">
                      {need.title}
                      {need.is_demo ? (
                        <span className="ml-2 rounded-sm border border-border px-1.5 py-0.5 text-xs text-muted-foreground">
                          demo
                        </span>
                      ) : null}
                    </td>
                    <td className="p-3">
                      {need.category_id ? (categoryName.get(need.category_id) ?? "—") : "—"}
                    </td>
                    <td className="p-3">
                      <span
                        className={`rounded-sm px-2 py-1 text-xs ${STATUS_META[need.status].className}`}
                      >
                        {STATUS_META[need.status].label}
                      </span>
                    </td>
                    <td className="p-3">{PRIORITY_META[need.priority].label}</td>
                    <td className="p-3">
                      {need.required_amount ?? "—"} {need.unit ?? ""}
                    </td>
                    <td className="p-3">{need.collected_amount}</td>
                    <td className="p-3">{remaining(need)}</td>
                    <td className="p-3">{formatDate(need.published_at)}</td>
                    <td className="p-3">
                      <Actions need={need} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Карточки для телефона */}
          <div className="grid gap-3 lg:hidden">
            {needs.map((need) => (
              <article key={need.id} className="card-elevated grid gap-3 p-4">
                <div>
                  <h3 className="text-lg">
                    {need.title}
                    {need.is_demo ? (
                      <span className="ml-2 rounded-sm border border-border px-1.5 py-0.5 text-xs text-muted-foreground">
                        demo
                      </span>
                    ) : null}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {need.category_id ? (categoryName.get(need.category_id) ?? "Без категории") : "Без категории"}{" "}
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
                  <p className="text-sm text-muted-foreground">
                    Требуется {need.required_amount} {need.unit ?? ""} · собрано{" "}
                    {need.collected_amount} · осталось {remaining(need)}
                  </p>
                ) : null}
                <Actions need={need} />
              </article>
            ))}
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Изменить потребность" : "Новая потребность"}</DialogTitle>
            <DialogDescription>
              Тип потребности определяет, нужны ли количество или сумма.
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
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="required">
                    {form.goalType === "money" ? "Требуемая сумма" : "Требуемое количество"}
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
                  <Label htmlFor="unit">Единица измерения</Label>
                  <Input
                    id="unit"
                    placeholder={form.goalType === "money" ? "₽" : "шт."}
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  />
                </div>
              </div>
            ) : null}

            <div className="grid gap-2">
              <Label htmlFor="photo">Фото (JPG или PNG, до 10 МБ)</Label>
              <Input
                id="photo"
                type="file"
                accept="image/jpeg,image/png"
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

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={() => saveNeed.mutate()} disabled={saveNeed.isPending}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

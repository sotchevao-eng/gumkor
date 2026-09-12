import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHero } from "@/components/page-hero";
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
  type NeedGoalType,
  type NeedPriority,
  type NeedStatus,
} from "@/lib/needs-types";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Управление потребностями — РяZань ZA ВДВ" },
      {
        name: "description",
        content: "Служебный раздел: публикация и обновление потребностей группы «РяZань ZA ВДВ».",
      },
      { property: "og:title", content: "Управление потребностями — РяZань ZA ВДВ" },
      { property: "og:description", content: "Служебный раздел координатора." },
    ],
  }),
  component: AdminPage,
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
};

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    let active = true;
    supabase.rpc("claim_first_admin").then(({ data }) => {
      if (active) setIsAdmin(Boolean(data));
    });
    return () => {
      active = false;
    };
  }, []);

  const needsQuery = useQuery({
    queryKey: ["needs", "admin"],
    enabled: isAdmin === true,
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
    enabled: isAdmin === true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("need_categories")
        .select("id, name, sort_order")
        .order("sort_order");
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["needs"] });
    queryClient.invalidateQueries({ queryKey: ["need-categories"] });
  }

  async function uploadPhoto(file: File) {
    const extension = file.name.split(".").pop() ?? "jpg";
    const path = `${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from("need-photos").upload(path, file);
    if (error) throw new Error(error.message);
    return path;
  }

  const saveNeed = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) throw new Error("Укажите название потребности");
      let photoPath: string | null | undefined;
      if (photoFile) photoPath = await uploadPhoto(photoFile);

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

  const addCategory = useMutation({
    mutationFn: async () => {
      const name = newCategory.trim();
      if (!name) throw new Error("Укажите название категории");
      const { error } = await supabase.from("need_categories").insert({ name, sort_order: 100 });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setNewCategory("");
      toast.success("Категория добавлена");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("need_categories").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Категория удалена");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setPhotoFile(null);
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
    setDialogOpen(true);
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (isAdmin === false) {
    return (
      <section className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl">Нет прав администратора</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Этот аккаунт не управляет потребностями. Войдите под аккаунтом координатора.
        </p>
        <Button className="mt-6" onClick={signOut}>
          Выйти
        </Button>
      </section>
    );
  }

  return (
    <>
      <PageHero
        eyebrow="Служебный раздел"
        title="Управление потребностями"
        description="Публикация, обновление собранного, приоритет, статус и закрытие потребностей."
      />

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={openCreate}>Добавить потребность</Button>
          {(needsQuery.data ?? []).some((need) => need.is_demo) ? (
            <Button variant="outline" onClick={() => removeDemo.mutate()}>
              Удалить все demo
            </Button>
          ) : null}
          <Button variant="ghost" className="ml-auto" onClick={signOut}>
            Выйти
          </Button>
        </div>

        <div className="mt-8 grid gap-4">
          {needsQuery.isPending ? (
            <p className="text-sm text-muted-foreground">Загружаем список…</p>
          ) : (needsQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Потребностей пока нет.</p>
          ) : (
            (needsQuery.data ?? []).map((need) => (
              <article key={need.id} className="card-elevated flex flex-col gap-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
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
                      {STATUS_META[need.status].label} · {PRIORITY_META[need.priority].label} ·{" "}
                      {GOAL_TYPE_LABELS[need.goal_type]}
                      {need.required_amount
                        ? ` · ${need.collected_amount} из ${need.required_amount} ${need.unit ?? ""}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(need)}>
                      Изменить
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeNeed.mutate(need.id)}
                    >
                      Удалить
                    </Button>
                  </div>
                </div>
                {need.status === "closed" && !need.report_url ? (
                  <div className="rounded-md bg-muted p-3 text-sm">
                    Потребность закрыта — добавьте ссылку на отчёт.
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-3"
                      onClick={() => openEdit(need)}
                    >
                      Создать отчёт по этой потребности
                    </Button>
                  </div>
                ) : null}
              </article>
            ))
          )}
        </div>

        <div className="card-elevated mt-10 p-5">
          <h2 className="text-lg">Категории</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {(categoriesQuery.data ?? []).map((category) => (
              <span
                key={category.id}
                className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5 text-sm"
              >
                {category.name}
                <button
                  type="button"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => removeCategory.mutate(category.id)}
                  aria-label={`Удалить категорию ${category.name}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Новая категория"
              className="max-w-xs"
            />
            <Button variant="outline" onClick={() => addCategory.mutate()}>
              Добавить
            </Button>
          </div>
        </div>
      </section>

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
              <Label htmlFor="description">Краткое описание</Label>
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
                    {(categoriesQuery.data ?? []).map((category) => (
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
                  <Label htmlFor="required">Требуется</Label>
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
                  <Label htmlFor="unit">Единица</Label>
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
              <Label htmlFor="photo">Фото</Label>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              />
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
    </>
  );
}

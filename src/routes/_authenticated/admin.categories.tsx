import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: AdminCategories,
});

type Category = { id: string; name: string; sort_order: number; is_hidden: boolean };

function AdminCategories() {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const categories = useQuery({
    queryKey: ["need-categories", "admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("need_categories")
        .select("id, name, sort_order, is_hidden")
        .order("sort_order")
        .order("name");
      if (error) throw new Error(error.message);
      return (data ?? []) as Category[];
    },
  });

  const usage = useQuery({
    queryKey: ["need-categories", "usage"],
    queryFn: async () => {
      const { data, error } = await supabase.from("needs").select("category_id");
      if (error) throw new Error(error.message);
      const used = new Set<string>();
      for (const row of data ?? []) if (row.category_id) used.add(row.category_id);
      return used;
    },
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["need-categories"] });
    queryClient.invalidateQueries({ queryKey: ["needs"] });
  }

  const addCategory = useMutation({
    mutationFn: async () => {
      const name = newName.trim();
      if (!name) throw new Error("Укажите название категории");
      const { error } = await supabase.from("need_categories").insert({ name, sort_order: 100 });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setNewName("");
      toast.success("Категория добавлена");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const renameCategory = useMutation({
    mutationFn: async () => {
      const name = editingName.trim();
      if (!editingId || !name) throw new Error("Укажите новое название");
      const { error } = await supabase
        .from("need_categories")
        .update({ name })
        .eq("id", editingId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setEditingId(null);
      toast.success("Название обновлено");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const toggleHidden = useMutation({
    mutationFn: async (category: Category) => {
      const { error } = await supabase
        .from("need_categories")
        .update({ is_hidden: !category.is_hidden })
        .eq("id", category.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Видимость категории изменена");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeCategory = useMutation({
    mutationFn: async (category: Category) => {
      if (usage.data?.has(category.id)) {
        throw new Error("Категория используется в потребностях — сначала освободите её");
      }
      const { error } = await supabase.from("need_categories").delete().eq("id", category.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Категория удалена");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl">Категории</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Справочник категорий потребностей. Скрытые категории не предлагаются на сайте.
        </p>
      </div>

      <div className="card-elevated p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Новая категория, например «Инструменты»"
          />
          <Button onClick={() => addCategory.mutate()} disabled={addCategory.isPending}>
            Добавить категорию
          </Button>
        </div>
      </div>

      <div className="grid gap-3">
        {(categories.data ?? []).map((category) => (
          <div
            key={category.id}
            className="card-elevated flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
          >
            {editingId === category.id ? (
              <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => renameCategory.mutate()}>
                    Сохранить
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1">
                  <p className="font-medium">
                    {category.name}
                    {category.is_hidden ? (
                      <span className="ml-2 rounded-sm bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        скрыта
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {usage.data?.has(category.id) ? "Используется в потребностях" : "Не используется"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(category.id);
                      setEditingName(category.name);
                    }}
                  >
                    Переименовать
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toggleHidden.mutate(category)}>
                    {category.is_hidden ? "Показать" : "Скрыть"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => removeCategory.mutate(category)}>
                    Удалить
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}
        {categories.isPending ? (
          <p className="text-sm text-muted-foreground">Загружаем категории…</p>
        ) : null}
      </div>
    </div>
  );
}

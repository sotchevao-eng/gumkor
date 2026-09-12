import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
import { useCanSeePersonalData } from "@/lib/staff-context";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

async function countRows(
  table: "needs" | "help_requests" | "reports",
  filter?: { column: string; value: string | boolean },
) {
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  if (filter) query = query.eq(filter.column, filter.value);
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | undefined;
  hint?: string;
}) {
  return (
    <div className="card-elevated p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl">{value ?? "—"}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function AdminDashboard() {
  const canSeePersonalData = useCanSeePersonalData();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const stats = useQuery({
    queryKey: ["admin", "dashboard", canSeePersonalData ? "admin" : "tester"],
    queryFn: async () => {
      const [active, partial, closed, published, demoNeeds, demoReports] = await Promise.all([
        countRows("needs", { column: "status", value: "active" }),
        countRows("needs", { column: "status", value: "partial" }),
        countRows("needs", { column: "status", value: "closed" }),
        countRows("reports", { column: "status", value: "published" }),
        countRows("needs", { column: "is_demo", value: true }),
        countRows("reports", { column: "is_demo", value: true }),
      ]);
      const demoRequests = await countRows("help_requests", { column: "is_demo", value: true });
      if (!canSeePersonalData) {
        return {
          active,
          partial,
          closed,
          newRequests: 0,
          unprocessed: 0,
          published,
          demo: demoNeeds + demoReports + demoRequests,
        };
      }
      const [newRequests, openRequests, doneRequests] = await Promise.all([
        countRows("help_requests", { column: "status", value: "new" }),
        countRows("help_requests"),
        countRows("help_requests", { column: "status", value: "done" }),
      ]);
      return {
        active,
        partial,
        closed,
        newRequests,
        unprocessed: Math.max(0, openRequests - doneRequests),
        published,
        demo: demoNeeds + demoReports + demoRequests,
      };
    },
  });

  const purgeDemo = useMutation({
    mutationFn: async () => {
      for (const table of ["help_requests", "reports", "needs"] as const) {
        const { error } = await supabase.from(table).delete().eq("is_demo", true);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success("Все demo-данные удалены");
      setConfirmOpen(false);
      queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const data = stats.data;

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-2xl">Обзор</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Текущее состояние потребностей, заявок и отчётов. Учебные записи помечены словом DEMO.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Активные потребности" value={data?.active} />
        <StatCard label="Частично закрытые" value={data?.partial} />
        <StatCard label="Закрытые потребности" value={data?.closed} />
        {canSeePersonalData ? (
          <>
            <StatCard label="Новые заявки" value={data?.newRequests} />
            <StatCard label="Необработанные заявки" value={data?.unprocessed} />
          </>
        ) : null}
        <StatCard label="Опубликованные отчёты" value={data?.published} />
        <StatCard
          label="DEMO-записи"
          value={data?.demo}
          hint="Учебные примеры: потребности, отчёты и заявки"
        />
      </div>

      <div className="card-elevated p-5">
        <h2 className="text-lg">Быстрые действия</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/admin/needs">Добавить потребность</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/admin/reports" search={{}}>
              Добавить отчёт
            </Link>
          </Button>
          {canSeePersonalData ? (
            <Button asChild size="lg" variant="outline">
              <Link to="/admin/requests">Посмотреть заявки</Link>
            </Button>
          ) : null}
          <Button asChild size="lg" variant="outline">
            <Link to="/admin/categories">Управление категориями</Link>
          </Button>
        </div>
      </div>

      {canSeePersonalData ? (
        <div className="card-elevated p-5">
          <h2 className="text-lg">Перед запуском сайта</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Одной кнопкой удаляются все учебные записи с пометкой DEMO: потребности, отчёты и
            заявки. Реальные данные не затрагиваются.
          </p>
          <Button
            className="mt-4"
            variant="destructive"
            disabled={purgeDemo.isPending || (data?.demo ?? 0) === 0}
            onClick={() => setConfirmOpen(true)}
          >
            Удалить все DEMO-данные
          </Button>

          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Удалить все DEMO-данные?</AlertDialogTitle>
                <AlertDialogDescription>
                  Будут удалены все записи с пометкой DEMO ({data?.demo ?? 0}). Действие нельзя
                  отменить.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    purgeDemo.mutate();
                  }}
                >
                  Удалить
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : null}
    </div>
  );
}

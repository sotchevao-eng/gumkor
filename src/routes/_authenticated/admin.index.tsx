import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

async function countRows(
  table: "needs" | "help_requests" | "reports",
  filter?: { column: string; value: string },
) {
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  if (filter) query = query.eq(filter.column, filter.value);
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

function StatCard({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="card-elevated p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl">{value ?? "—"}</p>
    </div>
  );
}

function AdminDashboard() {
  const stats = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const [active, partial, closed, newRequests, openRequests, published] = await Promise.all([
        countRows("needs", { column: "status", value: "active" }),
        countRows("needs", { column: "status", value: "partial" }),
        countRows("needs", { column: "status", value: "closed" }),
        countRows("help_requests", { column: "status", value: "new" }),
        countRows("help_requests"),
        countRows("reports", { column: "status", value: "published" }),
      ]);
      const doneRequests = await countRows("help_requests", { column: "status", value: "done" });
      return {
        active,
        partial,
        closed,
        newRequests,
        unprocessed: Math.max(0, openRequests - doneRequests),
        published,
      };
    },
  });

  const data = stats.data;

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-2xl">Обзор</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Текущее состояние потребностей, заявок и отчётов.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Активные потребности" value={data?.active} />
        <StatCard label="Частично закрытые" value={data?.partial} />
        <StatCard label="Закрытые потребности" value={data?.closed} />
        <StatCard label="Новые заявки" value={data?.newRequests} />
        <StatCard label="Необработанные заявки" value={data?.unprocessed} />
        <StatCard label="Опубликованные отчёты" value={data?.published} />
      </div>

      <div className="card-elevated p-5">
        <h2 className="text-lg">Быстрые действия</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/admin/needs" search={{ new: true }}>
              Добавить потребность
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/admin/reports" search={{ new: true }}>
              Добавить отчёт
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/admin/requests">Посмотреть заявки</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/admin/categories">Управление категориями</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

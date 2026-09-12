import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  REQUEST_STATUS_META,
  REQUEST_STATUS_ORDER,
  formatDateTime,
  type RequestStatus,
} from "@/lib/admin-types";
import { useCanSeePersonalData } from "@/lib/staff-context";

export const Route = createFileRoute("/_authenticated/admin/requests")({
  component: AdminRequests,
});

type RequestRecord = {
  id: string;
  name: string;
  contact: string;
  help_way: string;
  need_id: string | null;
  comment: string;
  status: RequestStatus;
  is_demo: boolean;
  created_at: string;
};

function AdminRequests() {
  const queryClient = useQueryClient();
  const canSeePersonalData = useCanSeePersonalData();
  const [filter, setFilter] = useState<"all" | RequestStatus>("all");

  // Tester видит только demo-заявки: реальные персональные данные закрыты политикой в базе.
  const requestsQuery = useQuery({
    queryKey: ["help-requests", canSeePersonalData ? "all" : "demo"],
    queryFn: async () => {
      let query = supabase
        .from("help_requests")
        .select("id, name, contact, help_way, need_id, comment, status, is_demo, created_at")
        .order("created_at", { ascending: false });
      if (!canSeePersonalData) query = query.eq("is_demo", true);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data ?? []) as RequestRecord[];
    },
  });

  const needsQuery = useQuery({
    queryKey: ["needs", "titles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("needs").select("id, title");
      if (error) throw new Error(error.message);
      return new Map((data ?? []).map((row) => [row.id, row.title]));
    },
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["help-requests"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
  }

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: RequestStatus }) => {
      const { error } = await supabase.from("help_requests").update({ status }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Статус заявки обновлён");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeRequest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("help_requests").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Заявка удалена");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const requests = (requestsQuery.data ?? []).filter(
    (request) => filter === "all" || request.status === filter,
  );

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl">Заявки</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {canSeePersonalData
            ? "Заявки содержат персональные данные и видны только координатору. В публичной части сайта они не отображаются."
            : "Тестовый режим: показываются только demo-заявки. Реальные заявки, телефоны и комментарии людей тестовому доступу закрыты."}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          Все
        </Button>
        {REQUEST_STATUS_ORDER.map((status) => (
          <Button
            key={status}
            size="sm"
            variant={filter === status ? "default" : "outline"}
            onClick={() => setFilter(status)}
          >
            {REQUEST_STATUS_META[status].label}
          </Button>
        ))}
      </div>

      {requestsQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Загружаем заявки…</p>
      ) : requests.length === 0 ? (
        <p className="text-sm text-muted-foreground">Заявок в этом статусе нет.</p>
      ) : (
        <div className="grid gap-3">
          {requests.map((request) => (
            <article key={request.id} className="card-elevated grid gap-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg">
                    {request.name}
                    {request.is_demo ? (
                      <span className="ml-2 rounded-sm border border-border px-1.5 py-0.5 text-xs text-muted-foreground">
                        demo
                      </span>
                    ) : null}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Контакт: {request.contact}
                  </p>
                </div>
                <span
                  className={`rounded-sm px-2 py-1 text-xs ${REQUEST_STATUS_META[request.status].className}`}
                >
                  {REQUEST_STATUS_META[request.status].label}
                </span>
              </div>

              <dl className="grid gap-1 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase text-muted-foreground">Способ помощи</dt>
                  <dd>{request.help_way || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-muted-foreground">Потребность</dt>
                  <dd>
                    {request.need_id ? (needsQuery.data?.get(request.need_id) ?? "—") : "Без привязки"}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase text-muted-foreground">Комментарий</dt>
                  <dd>{request.comment || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-muted-foreground">Дата и время</dt>
                  <dd>{formatDateTime(request.created_at)}</dd>
                </div>
              </dl>

              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={request.status}
                  onValueChange={(value) =>
                    setStatus.mutate({ id: request.id, status: value as RequestStatus })
                  }
                >
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REQUEST_STATUS_ORDER.map((status) => (
                      <SelectItem key={status} value={status}>
                        {REQUEST_STATUS_META[status].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="ghost" onClick={() => removeRequest.mutate(request.id)}>
                  Удалить заявку
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

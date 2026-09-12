import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAdminGate, useIdleSignOut } from "@/lib/use-admin";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Админ-панель — РяZань ZA ВДВ" },
      {
        name: "description",
        content: "Служебная панель координатора: потребности, заявки, отчёты, категории, настройки.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Админ-панель — РяZань ZA ВДВ" },
      { property: "og:description", content: "Служебный раздел координатора группы." },
    ],
  }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Обзор", exact: true },
  { to: "/admin/needs", label: "Потребности" },
  { to: "/admin/requests", label: "Заявки" },
  { to: "/admin/reports", label: "Отчёты" },
  { to: "/admin/categories", label: "Категории" },
  { to: "/admin/settings", label: "Настройки сайта" },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAdmin = useAdminGate();

  const signOut = useCallback(async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }, [navigate, queryClient]);

  useIdleSignOut(() => void signOut(), 30);

  if (isAdmin === null) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center text-sm text-muted-foreground">
        Проверяем доступ…
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <section className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl">Нет прав администратора</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Этот аккаунт не управляет сайтом. Войдите под аккаунтом координатора.
        </p>
        <Button className="mt-6" onClick={() => void signOut()}>
          Выйти
        </Button>
      </section>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <header className="surface-navy">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-4">
          <div>
            <p className="font-display text-base uppercase tracking-wide text-navy-foreground">
              Админ-панель
            </p>
            <p className="text-xs text-navy-foreground/70">Координатор группы «РяZань ZA ВДВ»</p>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Link
              to="/"
              className="rounded-md px-3 py-2 text-sm text-navy-foreground/80 hover:text-navy-foreground"
            >
              На сайт
            </Link>
            <Button size="sm" variant="secondary" onClick={() => void signOut()}>
              Выйти
            </Button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl flex-wrap gap-1 px-2 pb-3">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: Boolean((item as { exact?: boolean }).exact) }}
              activeProps={{ className: "bg-sky text-sky-foreground" }}
              className="rounded-md px-3 py-2 text-sm font-medium text-navy-foreground/80 transition-colors hover:bg-navy-foreground/10 hover:text-navy-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {/* Required: nested admin routes render here. */}
        <Outlet />
      </main>
    </div>
  );
}

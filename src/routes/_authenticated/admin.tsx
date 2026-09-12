import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { STAFF_ROLE_LABEL, useIdleSignOut, useStaffRole } from "@/lib/use-admin";
import { StaffRoleProvider } from "@/lib/staff-context";

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
  { to: "/admin", label: "Обзор", exact: true, adminOnly: false },
  { to: "/admin/needs", label: "Потребности", adminOnly: false },
  { to: "/admin/requests", label: "Заявки", adminOnly: true },
  { to: "/admin/reports", label: "Отчёты", adminOnly: false },
  { to: "/admin/categories", label: "Категории", adminOnly: false },
  { to: "/admin/settings", label: "Настройки сайта", adminOnly: false },
  { to: "/admin/access", label: "Доступы", adminOnly: true },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const role = useStaffRole();
  const isAdmin = role === null ? null : role !== "none";

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

  const staffRole = role ?? "none";
  const nav = NAV.filter((item) => !item.adminOnly || staffRole === "admin");

  return (
    <StaffRoleProvider value={staffRole}>
      <div className="flex min-h-screen flex-col bg-muted/40">
        <header className="surface-navy">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-4">
            <div>
              <p className="font-display text-base uppercase tracking-wide text-navy-foreground">
                Админ-панель
              </p>
              <p className="text-xs text-navy-foreground/70">Координатор группы «РяZань ZA ВДВ»</p>
            </div>
            {staffRole !== "none" ? (
              <span
                className={`rounded-sm px-2 py-1 font-display text-[11px] uppercase ${
                  staffRole === "tester"
                    ? "bg-warning text-warning-foreground"
                    : "bg-sky text-sky-foreground"
                }`}
              >
                {STAFF_ROLE_LABEL[staffRole]}
              </span>
            ) : null}
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
            {nav.map((item) => (
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
    </StaffRoleProvider>
  );
}

import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState } from "react";
import { SiteLogo } from "./site-logo";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/", label: "Главная" },
  { to: "/needs", label: "Потребности" },
  { to: "/help", label: "Как помочь" },
  { to: "/reports", label: "Отчётность" },
  { to: "/contacts", label: "Контакты" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="surface-navy sticky top-0 z-50 border-b border-navy-foreground/10">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:gap-4">
        <Link to="/" className="flex min-w-0 items-center gap-3" onClick={() => setOpen(false)}>
          <SiteLogo className="h-11 w-11 sm:h-14 sm:w-14" />
          <span className="min-w-0">
            <span className="block truncate font-display text-lg leading-tight tracking-wide uppercase sm:text-xl">
              РяZань ZA ВДВ
            </span>
            <span className="block truncate text-xs text-navy-foreground/70">
              Помощь 2 батальону 137 гв. ПДП
            </span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-sm px-3 py-2 text-sm text-navy-foreground/80 transition-colors hover:bg-navy-foreground/10 hover:text-navy-foreground"
              activeProps={{ className: "bg-navy-foreground/12 text-navy-foreground font-bold" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Меню"
          className="ml-auto text-navy-foreground hover:bg-navy-foreground/10 hover:text-navy-foreground lg:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          <Menu />
        </Button>
      </div>

      {open && (
        <nav className="border-t border-navy-foreground/10 px-4 pb-3 lg:hidden">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              onClick={() => setOpen(false)}
              className="block rounded-sm px-2 py-3 text-sm text-navy-foreground/85"
              activeProps={{ className: "text-navy-foreground font-bold" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}

      <div className="ribbon-guard h-1 w-full opacity-90" />
    </header>
  );
}

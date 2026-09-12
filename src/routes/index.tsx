import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ClipboardList,
  FileCheck2,
  HandHeart,
  PackageCheck,
  Send,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import heroImage from "@/assets/hero-sky.jpg";
import { Button } from "@/components/ui/button";
import { HelpRequestDialog } from "@/components/help-request-dialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "РяZань ZA ВДВ — помощь 2 батальону 137 гв. ПДП" },
      {
        name: "description",
        content:
          "Волонтёрская группа «РяZань ZA ВДВ»: актуальные потребности, понятный способ помочь и прозрачная отчётность в одном месте.",
      },
      { property: "og:title", content: "РяZань ZA ВДВ — своих не бросаем" },
      {
        property: "og:description",
        content:
          "Актуальные потребности, способы помощи и отчётность группы помощи 2 батальону 137 гв. ПДП.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <section className="relative isolate overflow-hidden">
        <img
          src={heroImage}
          alt="Рязань, голубое небо и десантники на парашютах"
          width={1920}
          height={1088}
          className="hero-photo absolute inset-0 size-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ backgroundImage: "var(--gradient-hero-veil)" }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-navy-foreground sm:py-28">
          <p className="eyebrow drop-shadow">Волонтёрская группа · Рязань</p>
          <h1 className="mt-4 max-w-3xl text-5xl leading-[1.02] uppercase drop-shadow-lg sm:text-7xl">
            Своих не бросаем
          </h1>
          <p className="mt-5 max-w-xl text-lg text-navy-foreground drop-shadow sm:text-xl">
            Актуальные потребности, понятный способ помочь и прозрачная отчётность — в одном месте
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" variant="secondary">
              <Link to="/needs">Смотреть потребности</Link>
            </Button>
            <HelpRequestDialog
              trigger={
                <Button
                  size="lg"
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  Помочь сейчас
                </Button>
              }
            />
          </div>
          <ul className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
            {[
              { icon: PackageCheck, label: "Собираем" },
              { icon: Truck, label: "Передаём" },
              { icon: FileCheck2, label: "Отчитываемся" },
            ].map((item) => (
              <li
                key={item.label}
                className="flex items-center gap-2 rounded-xl border border-navy-foreground/25 bg-navy/45 px-3 py-2 backdrop-blur-sm"
              >
                <item.icon className="size-5 text-sky" />
                <span className="font-display text-sm uppercase tracking-wider">{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="ribbon-guard absolute bottom-0 h-1.5 w-full opacity-95" />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: ClipboardList,
              title: "Потребности",
              text: "Конкретные позиции со статусом и прогрессом сбора — видно, что нужно сейчас.",
              to: "/needs" as const,
              link: "Открыть список",
            },
            {
              icon: HandHeart,
              title: "Как помочь",
              text: "Вещами, финансово, транспортом, услугами или информационно — выберите формат.",
              to: "/help" as const,
              link: "Выбрать способ",
            },
            {
              icon: ShieldCheck,
              title: "Отчётность",
              text: "По закрытым потребностям публикуются отчёты с фотографиями и документами.",
              to: "/reports" as const,
              link: "Смотреть отчёты",
            },
          ].map((card) => (
            <article
              key={card.title}
              className="card-elevated card-interactive card-interactive-hover flex flex-col p-6"
            >
              <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-secondary text-accent">
                <card.icon className="size-7" />
              </span>
              <h2 className="mt-4 text-xl uppercase">{card.title}</h2>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{card.text}</p>
              <Link
                to={card.to}
                className="mt-4 font-display text-sm uppercase text-accent hover:underline"
              >
                {card.link}
              </Link>
            </article>
          ))}

          <article className="card-interactive card-interactive-hover flex flex-col bg-accent p-6 text-accent-foreground">
            <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-navy-foreground/15 text-accent-foreground">
              <Send className="size-7" />
            </span>
            <h2 className="mt-4 text-xl uppercase">Могу помочь</h2>
            <p className="mt-2 flex-1 text-sm text-accent-foreground/90">
              Оставьте заявку — координатор свяжется с вами и подскажет, что нужно прямо сейчас.
            </p>
            <HelpRequestDialog
              trigger={
                <Button variant="secondary" className="mt-4 w-full">
                  <Sparkles className="size-4" /> Оставить заявку
                </Button>
              }
            />
          </article>
        </div>
      </section>

      <section className="surface-navy">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow">Наша задача</p>
            <h2 className="mt-1 text-2xl uppercase sm:text-3xl">
              Помощь 2 батальону 137 гв. ПДП
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-navy-foreground/85">
              Собираем то, что действительно запрошено, и отчитываемся по каждой закрытой позиции.
            </p>
          </div>
          <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to="/contacts">Связаться с координатором</Link>
          </Button>
        </div>
        <div className="ribbon-guard h-1 w-full opacity-90" />
      </section>
    </>
  );
}

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
          className="absolute inset-0 size-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ backgroundImage: "var(--gradient-hero-veil)" }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-navy-foreground sm:py-28">
          <p className="eyebrow">Волонтёрская группа · Рязань</p>
          <h1 className="mt-4 max-w-3xl text-4xl leading-[1.05] uppercase sm:text-6xl">
            Своих не бросаем
          </h1>
          <p className="mt-5 max-w-xl text-base text-navy-foreground/85 sm:text-lg">
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
        </div>
        <div className="ribbon-guard absolute bottom-0 h-1.5 w-full opacity-95" />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="grid gap-5 sm:grid-cols-3">
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
              text: "Вещами, финансово, транспортом, услугами или информационно — выберите удобный формат.",
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
            <article key={card.title} className="card-elevated flex flex-col p-5">
              <span className="inline-flex size-10 items-center justify-center rounded-sm bg-secondary text-primary">
                <card.icon className="size-5" />
              </span>
              <h2 className="mt-4 text-xl">{card.title}</h2>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{card.text}</p>
              <Link to={card.to} className="mt-4 font-display text-sm uppercase text-accent hover:underline">
                {card.link}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-navy">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <h2 className="text-2xl uppercase sm:text-3xl">Помощь 2 батальону 137 гв. ПДП</h2>
            <p className="mt-3 max-w-2xl text-navy-foreground/80">
              Группа собирает то, что действительно запрошено, и отчитывается по каждой закрытой
              позиции. Если готовы участвовать — свяжитесь с координатором.
            </p>
          </div>
          <Button asChild size="lg" variant="secondary">
            <Link to="/contacts">Контакты координатора</Link>
          </Button>
        </div>
        <div className="ribbon-guard h-1 w-full opacity-90" />
      </section>
    </>
  );
}

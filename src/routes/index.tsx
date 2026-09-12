import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, HandHeart, Send, ShieldCheck, Sparkles } from "lucide-react";
import heroAsset from "@/assets/hero-humanitarian-2.png.asset.json";
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
      <section className="relative isolate">
        <img
          src={heroAsset.url}
          alt="Военнослужащий, коробки гуманитарной помощи, грузовик «РяZань ZA ВДВ», парашюты и панорама Рязани с надписью «Своих не бросаем»"
          className="h-[42vw] max-h-[520px] min-h-[220px] w-full object-cover object-[60%_center] sm:object-center"
        />
        <div className="ribbon-guard absolute bottom-0 h-1.5 w-full opacity-95" />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: ClipboardList,
              title: "Потребности",
              text: "Что нужно сейчас",
              to: "/needs" as const,
              link: "Открыть список",
            },
            {
              icon: HandHeart,
              title: "Как помочь",
              text: "Вещами, деньгами, делом",
              to: "/help" as const,
              link: "Выбрать способ",
            },
            {
              icon: ShieldCheck,
              title: "Отчётность",
              text: "Что собрано и передано",
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
            <p className="mt-2 flex-1 text-sm text-accent-foreground/90">Оставить заявку</p>
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

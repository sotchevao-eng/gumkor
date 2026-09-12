import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";
import { HelpRequestDialog } from "@/components/help-request-dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/needs")({
  head: () => ({
    meta: [
      { title: "Актуальные потребности — РяZань ZA ВДВ" },
      {
        name: "description",
        content:
          "Список актуальных потребностей 2 батальона 137 гв. ПДП: статус, категория, сколько требуется и сколько собрано.",
      },
      { property: "og:title", content: "Актуальные потребности — РяZань ZA ВДВ" },
      {
        property: "og:description",
        content: "Что нужно сейчас: статусы «Активно», «Частично собрано», «Закрыто».",
      },
    ],
  }),
  component: NeedsPage,
});

export type NeedStatus = "active" | "partial" | "closed";

export type Need = {
  id: string;
  title: string;
  category: string;
  description: string;
  required: number;
  collected: number;
  unit: string;
  status: NeedStatus;
};

// Данные потребностей заполняет координатор. Выдуманные позиции и суммы не добавляем.
const needs: Need[] = [];

const statusMeta: Record<NeedStatus, { label: string; className: string }> = {
  active: { label: "Активно", className: "bg-warning text-warning-foreground" },
  partial: { label: "Частично собрано", className: "bg-sky text-sky-foreground" },
  closed: { label: "Закрыто", className: "bg-success text-success-foreground" },
};

function NeedCard({ need }: { need: Need }) {
  const percent =
    need.required > 0 ? Math.min(100, Math.round((need.collected / need.required) * 100)) : 0;
  const meta = statusMeta[need.status];

  return (
    <article className="card-elevated flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">{need.category}</p>
          <h3 className="mt-1 text-lg leading-snug">{need.title}</h3>
        </div>
        <span
          className={`shrink-0 rounded-sm px-2 py-1 font-display text-[11px] uppercase ${meta.className}`}
        >
          {meta.label}
        </span>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">{need.description}</p>

      <div className="mt-4">
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-muted-foreground">
            Собрано {need.collected} из {need.required} {need.unit}
          </span>
          <span className="font-display">{percent}%</span>
        </div>
        <Progress value={percent} className="mt-2" />
      </div>

      {need.status !== "closed" && (
        <HelpRequestDialog
          trigger={
            <Button className="mt-5 w-full" variant="default">
              Могу помочь
            </Button>
          }
        />
      )}
    </article>
  );
}

function NeedsPage() {
  return (
    <>
      <PageHero
        eyebrow="Что нужно сейчас"
        title="Потребности"
        description="Каждая позиция публикуется с категорией, объёмом, прогрессом сбора и статусом. Как только список обновляется координатором, он появляется здесь."
      />

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(statusMeta) as NeedStatus[]).map((key) => (
            <span
              key={key}
              className={`rounded-sm px-2 py-1 font-display text-[11px] uppercase ${statusMeta[key].className}`}
            >
              {statusMeta[key].label}
            </span>
          ))}
        </div>

        {needs.length > 0 ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {needs.map((need) => (
              <NeedCard key={need.id} need={need} />
            ))}
          </div>
        ) : (
          <div className="card-elevated mt-6 p-8 text-center">
            <h2 className="text-xl">Список пока не заполнен</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              Актуальные потребности публикует координатор. Чтобы узнать, что требуется прямо
              сейчас, свяжитесь с координатором или оставьте заявку — мы сообщим, чем можно помочь.
            </p>
            <HelpRequestDialog
              trigger={
                <Button className="mt-6" size="lg">
                  Могу помочь
                </Button>
              }
            />
          </div>
        )}
      </section>
    </>
  );
}

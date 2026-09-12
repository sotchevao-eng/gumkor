import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHero } from "@/components/page-hero";
import { NeedCard } from "@/components/need-card";
import { HelpRequestDialog } from "@/components/help-request-dialog";
import { Button } from "@/components/ui/button";
import { listNeeds } from "@/lib/needs.functions";
import { STATUS_META, type NeedStatus } from "@/lib/needs-types";

const needsQueryOptions = queryOptions({
  queryKey: ["needs", "public"],
  queryFn: () => listNeeds(),
});

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
        content: "Что нужно сейчас: статусы «Активно», «Частично закрыто», «Закрыто».",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(needsQueryOptions),
  component: NeedsPage,
  errorComponent: () => (
    <section className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl">Список потребностей не загрузился</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Обновите страницу или свяжитесь с координатором по телефону +7 953 733-10-20.
      </p>
    </section>
  ),
});

type StatusFilter = "all" | NeedStatus;

const statusFilters: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Все" },
  { key: "active", label: "Активные" },
  { key: "partial", label: "Частично закрытые" },
  { key: "closed", label: "Закрытые" },
];

function NeedsPage() {
  const { data } = useSuspenseQuery(needsQueryOptions);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [category, setCategory] = useState<string>("all");

  const visible = data.needs.filter(
    (need) =>
      (status === "all" || need.status === status) &&
      (category === "all" || need.categoryId === category),
  );

  const usedCategories = data.categories.filter((c) =>
    data.needs.some((need) => need.categoryId === c.id),
  );

  return (
    <>
      <PageHero
        eyebrow="Что нужно сейчас"
        title="Потребности"
        description="Каждая позиция публикуется с категорией, объёмом, прогрессом сбора и статусом. Список ведёт координатор."
      />

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setStatus(filter.key)}
              className={`rounded-md border px-3 py-1.5 font-display text-xs uppercase transition-colors ${
                status === filter.key
                  ? "border-navy bg-navy text-navy-foreground"
                  : "border-border bg-card text-foreground hover:border-sky"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {usedCategories.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory("all")}
              className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                category === "all" ? "bg-sky text-sky-foreground" : "bg-muted text-foreground"
              }`}
            >
              Все категории
            </button>
            {usedCategories.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategory(item.id)}
                className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                  category === item.id ? "bg-sky text-sky-foreground" : "bg-muted text-foreground"
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2 text-xs">
          {(Object.keys(STATUS_META) as NeedStatus[]).map((key) => (
            <span
              key={key}
              className={`rounded-sm px-2 py-1 font-display text-[11px] uppercase ${STATUS_META[key].className}`}
            >
              {STATUS_META[key].label}
            </span>
          ))}
        </div>

        {visible.length > 0 ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((need) => (
              <NeedCard key={need.id} need={need} />
            ))}
          </div>
        ) : (
          <div className="card-elevated mt-6 p-8 text-center">
            <h2 className="text-xl">
              {data.needs.length === 0 ? "Список пока не заполнен" : "По выбранным фильтрам ничего нет"}
            </h2>
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

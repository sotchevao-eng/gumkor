import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { listPublishedReports, type PublicReport } from "@/lib/reports.functions";
import { formatDate } from "@/lib/needs-types";

const reportsQueryOptions = queryOptions({
  queryKey: ["reports", "public"],
  queryFn: () => listPublishedReports(),
});

export const Route = createFileRoute("/reports/")({
  head: () => ({
    meta: [
      { title: "Отчётность — РяZань ZA ВДВ" },
      {
        name: "description",
        content:
          "Прозрачная отчётность группы: дата, описание, фотографии, документы и чеки по каждой закрытой потребности.",
      },
      { property: "og:title", content: "Отчётность — РяZань ZA ВДВ" },
      {
        property: "og:description",
        content: "Что собрано и передано: отчёты с фотографиями и документами.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(reportsQueryOptions),
  component: ReportsPage,
  errorComponent: () => (
    <section className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl">Отчёты не загрузились</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Обновите страницу или свяжитесь с координатором по телефону +7 953 733-10-20.
      </p>
    </section>
  ),
  notFoundComponent: () => (
    <section className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl">Страница не найдена</h1>
    </section>
  ),
});

function ReportCard({ report }: { report: PublicReport }) {
  return (
    <article className="card-elevated flex flex-col overflow-hidden">
      {report.photoUrls[0] ? (
        <img
          src={report.photoUrls[0]}
          alt={report.title}
          loading="lazy"
          className="h-44 w-full object-cover"
        />
      ) : null}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          {report.categoryName ? <p className="eyebrow">{report.categoryName}</p> : <span />}
          <time className="font-display text-sm text-muted-foreground">
            {formatDate(report.reportDate)}
          </time>
        </div>
        <h3 className="mt-1 text-lg leading-snug">
          {report.title}
          {report.isDemo ? (
            <span className="ml-2 rounded-sm border border-border px-1.5 py-0.5 text-xs text-muted-foreground">
              DEMO
            </span>
          ) : null}
        </h3>
        {report.needTitle ? (
          <p className="mt-2 text-xs text-muted-foreground">Потребность: {report.needTitle}</p>
        ) : null}
        {report.summary ? <p className="mt-2 text-sm font-medium">{report.summary}</p> : null}
        {report.body ? (
          <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{report.body}</p>
        ) : null}
        <p className="mt-3 inline-block self-start rounded-sm bg-success px-2 py-1 font-display text-[11px] uppercase text-success-foreground">
          Отчёт опубликован
        </p>
        <div className="mt-auto pt-5">
          <Button asChild variant="outline" className="w-full">
            <Link to="/reports/$reportId" params={{ reportId: report.id }}>
              Подробнее
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

function ReportsPage() {
  const { data: reports } = useSuspenseQuery(reportsQueryOptions);
  const [category, setCategory] = useState("all");
  const [order, setOrder] = useState<"new" | "old">("new");

  const categories = useMemo(
    () =>
      Array.from(
        new Set(reports.map((report) => report.categoryName).filter((name): name is string => !!name)),
      ),
    [reports],
  );

  const visible = useMemo(() => {
    const list = reports.filter(
      (report) => category === "all" || report.categoryName === category,
    );
    return [...list].sort((a, b) =>
      order === "new"
        ? b.reportDate.localeCompare(a.reportDate)
        : a.reportDate.localeCompare(b.reportDate),
    );
  }, [reports, category, order]);

  return (
    <>
      <PageHero
        eyebrow="Прозрачно"
        title="Отчётность"
        description="По каждой закрытой потребности публикуется отчёт: дата, описание, фотографии, документы и чеки."
      />

      <section className="mx-auto max-w-6xl px-4 py-10">
        {reports.length > 0 ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCategory("all")}
                className={`rounded-md border px-3 py-1.5 font-display text-xs uppercase transition-colors ${
                  category === "all"
                    ? "border-navy bg-navy text-navy-foreground"
                    : "border-border bg-card text-foreground hover:border-sky"
                }`}
              >
                Все
              </button>
              {categories.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setCategory(name)}
                  className={`rounded-md border px-3 py-1.5 font-display text-xs uppercase transition-colors ${
                    category === name
                      ? "border-navy bg-navy text-navy-foreground"
                      : "border-border bg-card text-foreground hover:border-sky"
                  }`}
                >
                  {name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setOrder(order === "new" ? "old" : "new")}
                className="ml-auto rounded-md bg-muted px-3 py-1.5 text-xs text-foreground"
              >
                {order === "new" ? "Сначала новые" : "Сначала старые"}
              </button>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {visible.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          </>
        ) : (
          <div className="card-elevated p-8">
            <h2 className="text-xl">Отчёты пока не опубликованы</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Раздел готов к публикации. Каждый отчёт будет содержать перечисленные ниже элементы —
              так видно, куда пошла помощь.
            </p>
            <ul className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
              {[
                "Дата отчёта",
                "Название отчёта",
                "Описание переданного",
                "Фотографии",
                "Документы и чеки",
                "Статус закрытой потребности",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 rounded-sm bg-secondary px-3 py-2">
                  <ImageIcon className="size-4 text-accent" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </>
  );
}

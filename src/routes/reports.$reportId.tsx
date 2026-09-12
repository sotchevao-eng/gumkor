import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPublishedReport } from "@/lib/reports.functions";
import { formatAmount, formatDate } from "@/lib/needs-types";

const reportQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["reports", "public", id],
    queryFn: () => getPublishedReport({ data: { id } }),
  });

export const Route = createFileRoute("/reports/$reportId")({
  loader: async ({ context, params }) => {
    const report = await context.queryClient.ensureQueryData(reportQueryOptions(params.reportId));
    if (!report) throw notFound();
    return report;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Отчёт"} — РяZань ZA ВДВ` },
      {
        name: "description",
        content:
          loaderData?.summary ||
          "Отчёт о собранной помощи: что требовалось, что собрано и что передано.",
      },
      { property: "og:title", content: loaderData?.title ?? "Отчёт" },
      {
        property: "og:description",
        content: loaderData?.summary || "Отчёт о собранной и переданной помощи.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportPage,
  errorComponent: () => (
    <section className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl">Отчёт не загрузился</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Обновите страницу или откройте список отчётов.
      </p>
    </section>
  ),
  notFoundComponent: () => (
    <section className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl">Отчёт не найден</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Возможно, он ещё не опубликован.
      </p>
      <Button asChild variant="outline" className="mt-4">
        <Link to="/reports">Все отчёты</Link>
      </Button>
    </section>
  ),
});

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/60 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function ReportPage() {
  const { reportId } = Route.useParams();
  const { data: report } = useSuspenseQuery(reportQueryOptions(reportId));
  if (!report) return null;

  const unit = report.unit ?? (report.needGoalType === "money" ? "₽" : "");
  const money = report.needGoalType === "money";
  const quantity = report.needGoalType === "quantity";
  const remainder =
    money && report.collectedAmount !== null && report.spentAmount !== null
      ? report.collectedAmount - report.spentAmount
      : null;

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/reports" className="text-sm text-accent hover:underline">
        ← Все отчёты
      </Link>

      <header className="mt-4">
        {report.categoryName ? <p className="eyebrow">{report.categoryName}</p> : null}
        <h1 className="mt-1 text-3xl leading-tight">{report.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {formatDate(report.reportDate)}
          {report.needTitle ? ` · потребность: ${report.needTitle}` : ""}
        </p>
        {report.summary ? <p className="mt-3 text-base font-medium">{report.summary}</p> : null}
      </header>

      {money || quantity ? (
        <section className="card-elevated mt-6 p-5">
          <h2 className="font-display text-sm uppercase">Итоги сбора</h2>
          <div className="mt-3">
            {report.targetAmount !== null ? (
              <Row
                label={money ? "Цель сбора" : "Требовалось"}
                value={formatAmount(report.targetAmount, unit)}
              />
            ) : null}
            {report.collectedAmount !== null ? (
              <Row label="Собрано" value={formatAmount(report.collectedAmount, unit)} />
            ) : null}
            {money && report.spentAmount !== null ? (
              <Row label="Потрачено" value={formatAmount(report.spentAmount, unit)} />
            ) : null}
            {quantity && report.deliveredAmount !== null ? (
              <Row label="Передано" value={formatAmount(report.deliveredAmount, unit)} />
            ) : null}
            {remainder !== null ? (
              remainder === 0 ? (
                <p className="mt-3 inline-block rounded-sm bg-success px-2 py-1 font-display text-[11px] uppercase text-success-foreground">
                  Сбор закрыт полностью
                </p>
              ) : (
                <Row label="Остаток" value={formatAmount(remainder, unit)} />
              )
            ) : null}
          </div>
        </section>
      ) : null}

      {report.purchasedItems ? (
        <section className="mt-6">
          <h2 className="font-display text-sm uppercase">Что приобретено и передано</h2>
          <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
            {report.purchasedItems}
          </p>
        </section>
      ) : null}

      {report.body ? (
        <section className="mt-6">
          <h2 className="font-display text-sm uppercase">Текст отчёта</h2>
          <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{report.body}</p>
        </section>
      ) : null}

      {report.photoUrls.length > 0 ? (
        <section className="mt-6">
          <h2 className="font-display text-sm uppercase">Фотографии</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {report.photoUrls.map((src) => (
              <a key={src} href={src} target="_blank" rel="noreferrer">
                <img
                  src={src}
                  alt={report.title}
                  loading="lazy"
                  className="aspect-square w-full rounded-sm object-cover"
                />
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {report.documents.length > 0 ? (
        <section className="mt-6">
          <h2 className="font-display text-sm uppercase">Подтверждающие документы</h2>
          <ul className="mt-3 grid gap-2">
            {report.documents.map((doc) => (
              <li
                key={doc.url}
                className="flex items-center justify-between gap-3 rounded-sm bg-secondary px-3 py-2 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <FileText className="size-4 shrink-0 text-accent" />
                  <span className="truncate">{doc.name}</span>
                </span>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-accent hover:underline"
                >
                  Открыть
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {report.coordinatorNote ? (
        <section className="mt-6 rounded-lg border border-border p-4">
          <h2 className="font-display text-sm uppercase">Примечание координатора</h2>
          <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
            {report.coordinatorNote}
          </p>
        </section>
      ) : null}
    </article>
  );
}

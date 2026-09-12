import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { FileText, Image as ImageIcon } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { listPublishedReports, type PublicReport } from "@/lib/reports.functions";
import { formatDate } from "@/lib/needs-types";

const reportsQueryOptions = queryOptions({
  queryKey: ["reports", "public"],
  queryFn: () => listPublishedReports(),
});

export const Route = createFileRoute("/reports")({
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
});

function ReportCard({ report }: { report: PublicReport }) {
  return (
    <article className="card-elevated p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg">{report.title}</h3>
        <time className="font-display text-sm text-muted-foreground">
          {formatDate(report.reportDate)}
        </time>
      </div>
      {report.body ? <p className="mt-2 text-sm text-muted-foreground">{report.body}</p> : null}
      {report.summary ? <p className="mt-2 text-sm font-medium">{report.summary}</p> : null}
      {report.needTitle ? (
        <p className="mt-3 inline-block rounded-sm bg-success px-2 py-1 font-display text-[11px] uppercase text-success-foreground">
          Закрыто: {report.needTitle}
        </p>
      ) : null}

      {report.photoUrls.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {report.photoUrls.map((src) => (
            <img
              key={src}
              src={src}
              alt={report.title}
              loading="lazy"
              className="aspect-square w-full rounded-sm object-cover"
            />
          ))}
        </div>
      )}

      {report.documents.length > 0 && (
        <ul className="mt-4 space-y-2">
          {report.documents.map((doc) => (
            <li key={doc.url}>
              <a
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
              >
                <FileText className="size-4" />
                {doc.name}
              </a>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function ReportsPage() {
  const { data: reports } = useSuspenseQuery(reportsQueryOptions);

  return (
    <>
      <PageHero
        eyebrow="Прозрачно"
        title="Отчётность"
        description="По каждой закрытой потребности публикуется отчёт: дата, описание, фотографии, документы и чеки."
      />

      <section className="mx-auto max-w-6xl px-4 py-10">
        {reports.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2">
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
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

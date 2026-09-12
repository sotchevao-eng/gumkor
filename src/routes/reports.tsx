import { createFileRoute } from "@tanstack/react-router";
import { FileText, Image as ImageIcon } from "lucide-react";
import { PageHero } from "@/components/page-hero";

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
  component: ReportsPage,
});

export type Report = {
  id: string;
  date: string;
  title: string;
  description: string;
  photos: string[];
  documents: { name: string; url: string }[];
  closedNeed: string;
};

// Отчёты публикует координатор. Выдуманные отчёты, чеки и суммы не добавляем.
const reports: Report[] = [];

function ReportCard({ report }: { report: Report }) {
  return (
    <article className="card-elevated p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg">{report.title}</h3>
        <time className="font-display text-sm text-muted-foreground">{report.date}</time>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{report.description}</p>
      <p className="mt-3 inline-block rounded-sm bg-success px-2 py-1 font-display text-[11px] uppercase text-success-foreground">
        Закрыто: {report.closedNeed}
      </p>

      {report.photos.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {report.photos.map((src) => (
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

import { HelpRequestDialog } from "@/components/help-request-dialog";
import { DonateDialog } from "@/components/donate-dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  formatAmount,
  formatDate,
  needProgress,
  PRIORITY_META,
  STATUS_META,
  type Need,
} from "@/lib/needs-types";

export function NeedCard({ need }: { need: Need }) {
  const status = STATUS_META[need.status];
  const priority = PRIORITY_META[need.priority];
  const progress = needProgress(need);
  const isClosed = need.status === "closed";
  const isMoney = need.goalType === "money";

  return (
    <article className="card-elevated flex flex-col overflow-hidden">
      {need.photoUrl ? (
        <img
          src={need.photoUrl}
          alt={need.title}
          loading="lazy"
          className="h-44 w-full object-cover"
        />
      ) : null}

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            {need.categoryName ? <p className="eyebrow">{need.categoryName}</p> : null}
            <h3 className="mt-1 text-lg leading-snug">{need.title}</h3>
          </div>
          <span
            className={`shrink-0 rounded-sm px-2 py-1 font-display text-[11px] uppercase ${status.className}`}
          >
            {status.label}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className={`font-display uppercase ${priority.className}`}>{priority.label}</span>
          <span className="text-muted-foreground">от {formatDate(need.publishedAt)}</span>
          {need.isDemo ? (
            <span className="rounded-sm border border-border px-1.5 py-0.5 text-muted-foreground">
              demo
            </span>
          ) : null}
        </div>

        {need.description ? (
          <p className="mt-3 text-sm text-muted-foreground">{need.description}</p>
        ) : null}

        {progress ? (
          <div className="mt-4">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-muted-foreground">
                Собрано {formatAmount(progress.collected, progress.unit)} из{" "}
                {formatAmount(progress.required, progress.unit)}
              </span>
              <span className="font-display">{progress.percent}%</span>
            </div>
            <Progress value={progress.percent} className="mt-2" />
            {!isClosed && progress.remaining > 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Осталось {formatAmount(progress.remaining, progress.unit)}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-auto pt-5">
          {isClosed ? (
            need.reportUrl ? (
              <div>
                <p className="font-display text-xs uppercase text-success">Отчёт опубликован</p>
                <Button asChild variant="outline" className="mt-2 w-full">
                  <a href={need.reportUrl} target="_blank" rel="noreferrer">
                    Открыть отчёт
                  </a>
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Потребность закрыта. Отчёт готовится к публикации.
              </p>
            )
          ) : isMoney ? (
            <div className="grid gap-2">
              <DonateDialog
                need={need}
                trigger={<Button className="w-full">Помочь сейчас</Button>}
              />
              <HelpRequestDialog
                trigger={
                  <Button variant="outline" className="w-full">
                    Могу помочь
                  </Button>
                }
                defaultWay="Финансово"
              />
            </div>
          ) : (
            <HelpRequestDialog
              trigger={<Button className="w-full">Могу помочь</Button>}
              defaultWay="Вещами и материалами"
            />
          )}
        </div>
      </div>
    </article>
  );
}

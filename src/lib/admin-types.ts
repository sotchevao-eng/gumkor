export type RequestStatus =
  | "new"
  | "in_progress"
  | "contacted"
  | "agreed"
  | "done"
  | "rejected";

export type ReportStatus = "draft" | "published";

export const REQUEST_STATUS_META: Record<RequestStatus, { label: string; className: string }> = {
  new: { label: "Новая", className: "bg-sky text-sky-foreground" },
  in_progress: { label: "В работе", className: "bg-warning text-warning-foreground" },
  contacted: { label: "Связались", className: "bg-secondary text-secondary-foreground" },
  agreed: { label: "Помощь согласована", className: "bg-secondary text-secondary-foreground" },
  done: { label: "Завершено", className: "bg-success text-success-foreground" },
  rejected: { label: "Отказ / неактуально", className: "bg-muted text-muted-foreground" },
};

export const REQUEST_STATUS_ORDER: RequestStatus[] = [
  "new",
  "in_progress",
  "contacted",
  "agreed",
  "done",
  "rejected",
];

export const REPORT_STATUS_META: Record<ReportStatus, { label: string; className: string }> = {
  draft: { label: "Черновик", className: "bg-muted text-muted-foreground" },
  published: { label: "Опубликован", className: "bg-success text-success-foreground" },
};

export function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

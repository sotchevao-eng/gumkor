export type NeedStatus = "active" | "partial" | "closed";
export type NeedPriority = "normal" | "important" | "urgent";
export type NeedGoalType = "quantity" | "money" | "descriptive";

export type Need = {
  id: string;
  title: string;
  description: string;
  categoryId: string | null;
  categoryName: string | null;
  publishedAt: string;
  priority: NeedPriority;
  status: NeedStatus;
  goalType: NeedGoalType;
  requiredAmount: number | null;
  collectedAmount: number;
  unit: string | null;
  photoPath: string | null;
  photoUrl: string | null;
  reportUrl: string | null;
  isDemo: boolean;
  payPhone: string | null;
  payBank: string | null;
  payRecipient: string | null;
  payPurpose: string | null;
};

export type NeedCategory = { id: string; name: string; sortOrder: number };

export const STATUS_META: Record<NeedStatus, { label: string; className: string }> = {
  active: { label: "Активно", className: "bg-sky text-sky-foreground" },
  partial: { label: "Частично закрыто", className: "bg-warning text-warning-foreground" },
  closed: { label: "Закрыто", className: "bg-success text-success-foreground" },
};

export const PRIORITY_META: Record<NeedPriority, { label: string; className: string }> = {
  normal: { label: "Обычный", className: "text-muted-foreground" },
  important: { label: "Важно", className: "text-sky" },
  urgent: { label: "Срочно", className: "text-guard" },
};

export const GOAL_TYPE_LABELS: Record<NeedGoalType, string> = {
  quantity: "Количественная",
  money: "Денежная",
  descriptive: "Описательная",
};

export function needProgress(need: Need) {
  if (need.goalType === "descriptive" || !need.requiredAmount || need.requiredAmount <= 0) {
    return null;
  }
  const percent = Math.min(100, Math.round((need.collectedAmount / need.requiredAmount) * 100));
  return {
    percent: need.status === "closed" ? 100 : percent,
    required: need.requiredAmount,
    collected: need.status === "closed" ? need.requiredAmount : need.collectedAmount,
    remaining: Math.max(0, need.requiredAmount - need.collectedAmount),
    unit: need.unit ?? "",
  };
}

export function formatAmount(value: number, unit: string) {
  const formatted = new Intl.NumberFormat("ru-RU").format(value);
  return unit ? `${formatted} ${unit}` : formatted;
}

export function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
}

import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpRequestForm } from "./help-request-form";
import { formatAmount, type Need } from "@/lib/needs-types";

async function copy(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} скопирован`);
  } catch {
    toast.error("Не удалось скопировать — выделите текст вручную");
  }
}

/** Реквизиты денежного сбора. Показывается только для потребностей типа «Денежная». */
export function DonateDialog({ need, trigger }: { need: Need; trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const phone = need.payPhone;
  const bank = need.payBank;
  const recipient = need.payRecipient;
  const purpose = need.payPurpose;

  return (
    <>
      <span
        onClick={() => {
          setShowForm(false);
          setOpen(true);
        }}
      >
        {trigger}
      </span>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-card p-0 sm:max-w-md">
          <DialogHeader className="surface-navy space-y-1 rounded-t-lg px-5 py-4 text-left">
            <DialogTitle className="text-navy-foreground">Помочь по сбору</DialogTitle>
            <DialogDescription className="text-navy-foreground/80">
              {need.title}
              {need.requiredAmount
                ? ` · цель ${formatAmount(need.requiredAmount, need.unit ?? "₽")}`
                : null}
            </DialogDescription>
          </DialogHeader>

          {showForm ? (
            <div className="px-5 pb-5">
              <HelpRequestForm defaultWay="Финансово" />
            </div>
          ) : (
            <div className="grid gap-4 px-5 pb-5">
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">
                  Перечисление денежных средств по номеру телефона
                </p>
                <p className="mt-2 font-display text-2xl leading-tight text-navy sm:text-3xl">
                  {phone ?? "Реквизиты уточняются"}
                </p>
                {bank ? <p className="mt-1 font-display text-sm uppercase text-sky">{bank}</p> : null}
                {recipient ? (
                  <p className="mt-3 text-sm">
                    <span className="text-muted-foreground">Получатель: </span>
                    <span className="font-medium">{recipient}</span>
                  </p>
                ) : null}
                {purpose ? (
                  <p className="mt-1 text-sm">
                    <span className="text-muted-foreground">Назначение платежа: </span>
                    <span className="font-medium">{purpose}</span>
                  </p>
                ) : null}
              </div>

              {recipient ? (
                <p className="rounded-lg border border-sky/40 bg-sky/10 p-3 text-sm">
                  Перед переводом обязательно проверьте имя получателя в банковском приложении. Он
                  должен отображаться как <strong>{recipient}</strong>.
                </p>
              ) : null}

              <div className="grid gap-2">
                {phone ? (
                  <Button variant="outline" onClick={() => void copy(phone, "Номер телефона")}>
                    Скопировать номер телефона
                  </Button>
                ) : null}
                {purpose ? (
                  <Button variant="outline" onClick={() => void copy(purpose, "Назначение платежа")}>
                    Скопировать назначение платежа
                  </Button>
                ) : null}
                <Button onClick={() => setShowForm(true)}>Я перевёл / Хочу сообщить о помощи</Button>
              </div>

              <DialogFooter className="sm:justify-start">
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Закрыть
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

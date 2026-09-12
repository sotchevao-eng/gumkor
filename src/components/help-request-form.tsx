import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export const HELP_WAYS = [
  "Вещами и материалами",
  "Финансово",
  "Транспортом",
  "Услугами",
  "Информационно",
] as const;

export function HelpRequestForm({
  defaultWay,
  needId,
  needTitle,
  lockWay = false,
}: {
  defaultWay?: string;
  /** Служебное поле: заявка привязана к конкретной потребности. */
  needId?: string;
  needTitle?: string;
  /** Способ помощи зафиксирован (например, после перевода средств). */
  lockWay?: boolean;
}) {
  const [way, setWay] = useState(defaultWay ?? "");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [consent, setConsent] = useState(false);
  const [lastSentAt, setLastSentAt] = useState(0);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !way) {
      toast.error("Заполните имя, телефон и способ помощи");
      return;
    }
    if (!consent) {
      toast.error("Отметьте согласие на обработку персональных данных");
      return;
    }
    if (Date.now() - lastSentAt < 15000) {
      toast.error("Подождите немного перед повторной отправкой");
      return;
    }
    setLastSentAt(Date.now());
    // Служебные поля привязки заявки к потребности: need_id и need_title.
    const payload = {
      name: name.trim(),
      contact: phone.trim(),
      help_way: way,
      comment: comment.trim(),
      need_id: needId ?? null,
      need_title: needTitle ?? null,
    };
    void payload;
    // Отправка пока не подключена: приём заявок в базу добавляется отдельно.
    toast.success("Заявка подготовлена", {
      description: needTitle
        ? `Потребность: ${needTitle}. Свяжитесь с координатором по телефону +7 953 733-10-20.`
        : "Свяжитесь с координатором по телефону +7 953 733-10-20.",
    });
    setName("");
    setPhone("");
    setComment("");
    setWay(defaultWay ?? "");
    setConsent(false);
  }

  return (
    <form onSubmit={submit} className="grid gap-4" noValidate>
      {needTitle ? (
        <div className="rounded-md border border-sky/40 bg-sky/10 p-3">
          <p className="font-display text-[11px] uppercase tracking-wide text-muted-foreground">
            Потребность
          </p>
          <p className="mt-1 font-medium">{needTitle}</p>
          <input type="hidden" name="need_id" value={needId ?? ""} readOnly />
          <input type="hidden" name="need_title" value={needTitle} readOnly />
        </div>
      ) : null}
      <div className="grid gap-2">
        <Label htmlFor="name">Имя</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Как к вам обращаться"
          autoComplete="name"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="phone">Телефон</Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+7 ___ ___-__-__"
          autoComplete="tel"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="way">Способ помощи</Label>
        {lockWay ? (
          <Input id="way" value={way} readOnly className="bg-muted/50" />
        ) : (
          <Select value={way} onValueChange={setWay}>
            <SelectTrigger id="way">
              <SelectValue placeholder="Выберите вариант" />
            </SelectTrigger>
            <SelectContent>
              {HELP_WAYS.map((w) => (
                <SelectItem key={w} value={w}>
                  {w}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="comment">Комментарий</Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Что именно можете передать, сроки, удобное время"
          rows={4}
        />
      </div>
      <div className="flex items-start gap-3 rounded-md border border-border/70 bg-muted/40 p-3">
        <Checkbox
          id="consent"
          checked={consent}
          onCheckedChange={(v) => setConsent(v === true)}
          className="mt-0.5"
          required
        />
        <Label htmlFor="consent" className="text-sm font-normal leading-snug text-muted-foreground">
          Я даю согласие на обработку моих персональных данных в соответствии с{" "}
          <Link
            to="/privacy"
            className="underline decoration-sky/60 hover:text-foreground"
          >
            Политикой обработки персональных данных
          </Link>
          .
        </Label>
      </div>
      <Button type="submit" size="lg" disabled={!consent}>
        Отправить заявку
      </Button>
      <p className="text-xs text-muted-foreground">
        Приём заявок в базу данных пока не подключён. Заявку можно передать координатору по
        телефону. Мы запрашиваем только минимально необходимые данные для обратной связи.
      </p>
    </form>
  );
}

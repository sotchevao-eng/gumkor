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
import { toast } from "sonner";

export const HELP_WAYS = [
  "Вещами и материалами",
  "Финансово",
  "Транспортом",
  "Услугами",
  "Информационно",
] as const;

export function HelpRequestForm({ defaultWay }: { defaultWay?: string }) {
  const [way, setWay] = useState(defaultWay ?? "");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !way) {
      toast.error("Заполните имя, телефон и способ помощи");
      return;
    }
    // Отправка пока не подключена: база данных и приём заявок добавляются отдельно.
    toast.success("Заявка подготовлена", {
      description: "Свяжитесь с координатором по телефону +7 953 733-10-20.",
    });
    setName("");
    setPhone("");
    setComment("");
    setWay(defaultWay ?? "");
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
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
      <Button type="submit" size="lg">
        Отправить заявку
      </Button>
      <p className="text-xs text-muted-foreground">
        Приём заявок в базу данных пока не подключён. Заявку можно передать координатору по
        телефону.
      </p>
    </form>
  );
}

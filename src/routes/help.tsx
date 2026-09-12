import { createFileRoute } from "@tanstack/react-router";
import { Boxes, Wallet, Truck, Wrench, Megaphone } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { HelpRequestForm } from "@/components/help-request-form";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Как помочь — РяZань ZA ВДВ" },
      {
        name: "description",
        content:
          "Пять способов помочь: вещами и материалами, финансово, транспортом, услугами и информационно.",
      },
      { property: "og:title", content: "Как помочь — РяZань ZA ВДВ" },
      {
        property: "og:description",
        content: "Выберите удобный способ помощи и оставьте заявку координатору.",
      },
    ],
  }),
  component: HelpPage,
});

const ways = [
  {
    icon: Boxes,
    title: "Вещами и материалами",
    text: "Передать то, что указано в актуальных потребностях: расходники, инструмент, снаряжение, материалы.",
  },
  {
    icon: Wallet,
    title: "Финансово",
    text: "Участие в закупке по конкретной потребности. Реквизиты для перевода уточняет координатор.",
  },
  {
    icon: Truck,
    title: "Транспортом",
    text: "Помощь с перевозкой и логистикой: доставка груза к пункту сбора или по маршруту отправки.",
  },
  {
    icon: Wrench,
    title: "Услугами",
    text: "Ремонт, изготовление, пошив, сварка, погрузка, упаковка — любые профессиональные навыки.",
  },
  {
    icon: Megaphone,
    title: "Информационно",
    text: "Распространение актуальных запросов, помощь с публикациями и поиском поставщиков.",
  },
];

function HelpPage() {
  return (
    <>
      <PageHero
        eyebrow="Понятный способ помочь"
        title="Как помочь"
        description="Выберите подходящий формат участия. Если сомневаетесь — оставьте заявку, координатор подскажет, что нужнее всего сейчас."
      />

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ways.map((way) => (
            <article key={way.title} className="card-elevated p-5">
              <span className="inline-flex size-10 items-center justify-center rounded-sm bg-secondary text-primary">
                <way.icon className="size-5" />
              </span>
              <h2 className="mt-4 text-lg">{way.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{way.text}</p>
            </article>
          ))}
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_minmax(0,420px)]">
          <div>
            <h2 className="text-2xl uppercase">Заявка «Могу помочь»</h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Укажите имя, телефон и способ помощи. В комментарии можно написать, что именно вы
              готовы передать и в какое время удобно связаться.
            </p>
            <div className="ribbon-guard mt-6 h-1 w-24 opacity-90" />
          </div>
          <div className="card-elevated p-5 sm:p-6">
            <HelpRequestForm />
          </div>
        </div>
      </section>
    </>
  );
}

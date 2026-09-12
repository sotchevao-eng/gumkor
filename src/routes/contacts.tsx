import { createFileRoute } from "@tanstack/react-router";
import { Phone, ExternalLink } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { HelpRequestForm } from "@/components/help-request-form";

export const Route = createFileRoute("/contacts")({
  head: () => ({
    meta: [
      { title: "Контакты координатора — РяZань ZA ВДВ" },
      {
        name: "description",
        content:
          "Координатор Татьяна, телефон +7 953 733-10-20, группа ВКонтакте vk.ru/ryazanzavdv.",
      },
      { property: "og:title", content: "Контакты координатора — РяZань ZA ВДВ" },
      {
        property: "og:description",
        content: "Связаться с координатором группы «РяZань ZA ВДВ».",
      },
    ],
  }),
  component: ContactsPage,
});

function ContactsPage() {
  return (
    <>
      <PageHero
        eyebrow="Связь"
        title="Контакты"
        description="По вопросам передачи помощи, логистики и актуальных потребностей обращайтесь к координатору группы."
      />

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_minmax(0,420px)]">
        <div className="card-elevated p-6">
          <p className="eyebrow">Координатор</p>
          <h2 className="mt-2 text-2xl">Татьяна</h2>
          <a
            href="tel:+79537331020"
            className="mt-5 inline-flex items-center gap-2 font-display text-xl text-primary hover:text-accent"
          >
            <Phone className="size-5" />
            +7 953 733-10-20
          </a>
          <a
            href="https://vk.ru/ryazanzavdv"
            target="_blank"
            rel="noreferrer"
            className="mt-4 flex items-center gap-2 text-accent hover:underline"
          >
            <ExternalLink className="size-4" />
            vk.ru/ryazanzavdv
          </a>
          <div className="ribbon-guard mt-6 h-1 w-24 opacity-90" />
        </div>

        <div className="card-elevated p-5 sm:p-6">
          <h2 className="text-xl">Могу помочь</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Оставьте заявку — координатор свяжется с вами.
          </p>
          <div className="mt-5">
            <HelpRequestForm />
          </div>
        </div>
      </section>
    </>
  );
}

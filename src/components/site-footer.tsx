import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="surface-navy mt-16">
      <div className="ribbon-guard h-1 w-full opacity-90" />
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-2">
        <div>
          <p className="font-display text-lg uppercase">РяZань ZA ВДВ</p>
          <p className="mt-1 text-sm text-navy-foreground/70">
            Помощь 2 батальону 137 гв. ПДП. Своих не бросаем.
          </p>
        </div>
        <div className="text-sm text-navy-foreground/80">
          <p>Координатор Татьяна</p>
          <p className="mt-1">
            <a href="tel:+79537331020" className="hover:text-navy-foreground">
              +7 953 733-10-20
            </a>
          </p>
          <p className="mt-1">
            <a
              href="https://vk.ru/ryazanzavdv"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-sky/60 hover:text-navy-foreground"
            >
              Группа ВКонтакте
            </a>
          </p>
          <p className="mt-4">
            <Link to="/contacts" className="hover:text-navy-foreground">
              Все контакты
            </Link>
          </p>
        </div>
      </div>
      <div className="border-t border-navy-foreground/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-navy-foreground/60 sm:flex-row">
          <span>
            Разработка сайта —{" "}
            <span className="font-semibold text-navy-foreground">OXANA PROJECTS</span>
          </span>
          <a
            href="https://oxanaprojects.ru/"
            target="_blank"
            rel="noreferrer"
            className="underline decoration-sky/60 hover:text-navy-foreground"
          >
            Портфолио: oxanaprojects.ru
          </a>
        </div>
      </div>
    </footer>
  );
}

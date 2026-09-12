import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="surface-navy mt-10">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-9 sm:grid-cols-2">
        <div>
          <p className="brand-title text-xl leading-tight sm:text-2xl">
            <span className="text-navy-foreground">Ря</span>
            <span className="brand-z">Z</span>
            <span className="text-navy-foreground">ань </span>
            <span className="brand-za">ZA</span>
            <span className="text-navy-foreground"> ВДВ</span>
          </p>
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
            <a
              href="https://oxanaprojects.ru/"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-sky transition-colors hover:text-navy-foreground hover:underline"
            >
              OXANA PROJECTS
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}

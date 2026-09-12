import { useState } from "react";

/**
 * Официальный логотип группы.
 * Загрузите файл логотипа как public/logo.png — он подхватится автоматически.
 * До загрузки показывается нейтральная заглушка (без выдуманной символики).
 */
export function SiteLogo({ className = "h-12 w-12" }: { className?: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`${className} flex shrink-0 items-center justify-center rounded-sm border border-dashed border-navy-foreground/40 text-[10px] leading-tight text-navy-foreground/60`}
        title="Загрузите официальный логотип в public/logo.png"
      >
        ЛОГО
      </div>
    );
  }

  return (
    <img
      src="/logo.png"
      alt="Логотип группы «РяZань ZA ВДВ»"
      className={`${className} shrink-0 object-contain`}
      onError={() => setFailed(true)}
    />
  );
}

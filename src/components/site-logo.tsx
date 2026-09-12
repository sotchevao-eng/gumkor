import { useEffect, useState } from "react";

/**
 * Официальный логотип группы.
 * Загрузите файл логотипа как public/logo.png — он подхватится автоматически.
 * До загрузки показывается нейтральная заглушка (без выдуманной символики).
 */
export function SiteLogo({ className = "h-12 w-12" }: { className?: string }) {
  const [status, setStatus] = useState<"checking" | "ok" | "missing">("checking");

  useEffect(() => {
    const img = new Image();
    img.onload = () => setStatus("ok");
    img.onerror = () => setStatus("missing");
    img.src = "/logo.png";
  }, []);

  if (status === "ok") {
    return (
      <img
        src="/logo.png"
        alt="Логотип группы «РяZань ZA ВДВ»"
        className={`${className} shrink-0 object-contain`}
      />
    );
  }

  return (
    <div
      className={`${className} flex shrink-0 items-center justify-center overflow-hidden rounded-sm border border-dashed border-navy-foreground/40 font-display text-[10px] tracking-widest text-navy-foreground/60`}
      title="Загрузите официальный логотип в public/logo.png"
      aria-hidden={status === "checking"}
    >
      ЛОГО
    </div>
  );
}

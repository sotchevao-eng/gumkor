export function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="surface-navy">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 text-3xl leading-tight uppercase sm:text-4xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-navy-foreground/80">{description}</p>
      </div>
      <div className="ribbon-guard h-1 w-full opacity-90" />
    </section>
  );
}

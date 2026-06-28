export function Footer() {
  return (
    <footer className="mx-auto max-w-[1400px] px-5 pb-12">
      <div className="hairline mb-5" />
      <div className="flex flex-wrap items-center justify-between gap-2 text-meta text-muted-foreground-strong">
        <span>Companion atlas to the DIALECT manuscript.</span>
        <a
          className="focus-ring rounded transition-colors hover:text-foreground"
          href="https://github.com/raphael-group/dialect"
          target="_blank"
          rel="noreferrer"
        >
          raphael-group/dialect
        </a>
      </div>
    </footer>
  );
}

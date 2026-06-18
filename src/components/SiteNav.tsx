import { Github } from "lucide-react";

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-[#0a0a0a]/70 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1640px] items-center justify-between px-5">
        <a href="#" className="font-serif text-[19px] tracking-tight">
          <span className="text-foreground">DIALECT</span> <span className="text-brand">atlas</span>
        </a>
        <nav className="flex items-center gap-5">
          <span className="eyebrow hidden md:inline">69 cohorts · 3 BMR models</span>
          <a
            href="https://github.com/raphael-group/dialect"
            target="_blank"
            rel="noreferrer"
            className="focus-ring flex items-center gap-1.5 rounded-md text-[13px] text-muted-foreground-strong transition-colors hover:text-foreground"
          >
            <Github className="size-4" /> code
          </a>
        </nav>
      </div>
    </header>
  );
}

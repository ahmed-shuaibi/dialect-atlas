import { ArrowUpRight, Github, Mail } from "lucide-react";
import { ATLAS_LINKS } from "@/features/atlas/lib/atlas-metadata";

export function ContactView() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-15rem)] max-w-7xl flex-col justify-center py-14 sm:py-20">
      <p className="text-sm font-semibold text-muted">Contact</p>
      <h1 className="mt-3 max-w-[13ch] text-[clamp(3.2rem,7vw,6.4rem)] font-[650] leading-[0.94] tracking-[-0.05em]">
        Questions about DIALECT or the Atlas?
      </h1>
      <a
        href={`mailto:${ATLAS_LINKS.contactEmail}`}
        className="focus-ring group mt-10 flex max-w-4xl items-center justify-between gap-5 rounded-[28px] border border-line bg-paper p-5 shadow-soft transition-colors hover:border-ink/25 hover:bg-sand sm:p-7"
      >
        <span className="flex min-w-0 items-center gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-brand text-paper">
            <Mail className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 break-all text-[clamp(1.15rem,3vw,2rem)] font-semibold">
            {ATLAS_LINKS.contactEmail}
          </span>
        </span>
        <ArrowUpRight className="size-5 shrink-0 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden />
      </a>
      <div className="mt-6 flex flex-wrap gap-2">
        <a
          href={ATLAS_LINKS.paper}
          target="_blank"
          rel="noreferrer"
          className="focus-ring inline-flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-2.5 text-sm font-semibold hover:bg-sand"
        >
          Read the paper <ArrowUpRight className="size-3.5" aria-hidden />
        </a>
        <a
          href={ATLAS_LINKS.source}
          target="_blank"
          rel="noreferrer"
          className="focus-ring inline-flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-2.5 text-sm font-semibold hover:bg-sand"
        >
          <Github className="size-3.5" aria-hidden />
          View source
        </a>
      </div>
    </section>
  );
}

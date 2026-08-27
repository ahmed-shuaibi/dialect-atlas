import { ArrowUpRight, Github, Mail, UserRound } from "lucide-react";
import { ATLAS_LINKS } from "@/features/atlas/lib/atlas-metadata";

export function ContactView() {
  return (
    <section className="mx-auto max-w-7xl py-12 sm:py-16 lg:py-20">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold text-muted">Contact</p>
        <h1 className="mt-3 max-w-[18ch] text-[clamp(2.1rem,4vw,3.5rem)] font-[650] leading-[1.01] tracking-[-0.045em]">
          Questions about DIALECT or the Atlas?
        </h1>
      </header>

      <div className="surface-card mt-8 max-w-3xl overflow-hidden">
        <a
          href={`mailto:${ATLAS_LINKS.contactEmail}`}
          aria-label={ATLAS_LINKS.contactEmail}
          className="focus-ring group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-sand max-[359px]:px-4 sm:px-6 sm:py-5"
        >
          <span className="flex min-w-0 items-center gap-3.5 max-[359px]:gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-paper max-[359px]:size-9">
              <Mail className="size-4" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-muted">Email</span>
              <span className="block break-words text-base font-semibold max-[359px]:text-[0.95rem] sm:text-lg">
                {ATLAS_LINKS.contactEmail}
              </span>
            </span>
          </span>
          <ArrowUpRight className="size-4 shrink-0 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink max-[359px]:hidden" aria-hidden />
        </a>
        <a
          href={ATLAS_LINKS.personalSite}
          target="_blank"
          rel="noreferrer"
          aria-label="Ahmed Shuaibi personal profile"
          className="focus-ring group flex items-center justify-between gap-4 border-t border-line px-5 py-4 transition-colors hover:bg-sand max-[359px]:px-4 sm:px-6 sm:py-5"
        >
          <span className="flex min-w-0 items-center gap-3.5 max-[359px]:gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sand text-ink max-[359px]:size-9">
              <UserRound className="size-4" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-muted">Personal profile</span>
              <span className="block text-lg font-semibold">ahmedshuaibi.com</span>
            </span>
          </span>
          <ArrowUpRight className="size-4 shrink-0 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink max-[359px]:hidden" aria-hidden />
        </a>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
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

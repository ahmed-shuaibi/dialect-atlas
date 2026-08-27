import { ATLAS_LINKS } from "@/features/atlas/lib/atlas-metadata";

export function Footer({ releaseId }: { releaseId?: string }) {
  return (
    <footer className="site-shell pb-8 pt-16">
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-[13px] font-medium text-muted">
        <span>
          DIALECT Atlas · manuscript companion ·{" "}
          <a href={`mailto:${ATLAS_LINKS.contactEmail}`} className="focus-ring rounded-full underline decoration-line underline-offset-4 hover:text-ink">
            Contact
          </a>
        </span>
        {releaseId && <span className="font-mono text-xs">{releaseId}</span>}
      </div>
    </footer>
  );
}

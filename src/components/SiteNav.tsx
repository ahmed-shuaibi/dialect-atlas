import { Github } from "lucide-react";
import type { AtlasUrlState, AtlasView } from "@/features/atlas/types";
import { serializeAtlasHash } from "@/lib/useHashState";
import { cn } from "@/lib/utils";

const VIEWS: { value: AtlasView; label: string }[] = [
  { value: "explore", label: "Explore" },
  { value: "compare", label: "Compare" },
  { value: "about", label: "About" },
];

export function SiteNav({ state }: { state: AtlasUrlState }) {
  return (
    <>
      <button
        type="button"
        onClick={() => document.getElementById("main")?.focus()}
        className="focus-ring sr-only z-[100] rounded-full bg-ink px-4 py-2 text-paper focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </button>
      <header className="sticky top-0 z-40 border-b border-line/80 bg-canvas/90 backdrop-blur-xl">
        <div className="site-shell flex h-16 items-center justify-between gap-2 sm:gap-4">
          <a
            href={serializeAtlasHash({ ...state, view: "explore", pair: undefined, settings: false })}
            className="focus-ring rounded-full text-sm font-black tracking-[-0.02em]"
          >
            DIALECT <span className="font-medium text-muted">Atlas</span>
          </a>
          <nav aria-label="Primary" className="flex items-center gap-0.5 sm:gap-1">
            {VIEWS.map((view) => (
              <a
                key={view.value}
                href={serializeAtlasHash({ ...state, view: view.value, pair: undefined, settings: false })}
                aria-current={state.view === view.value ? "page" : undefined}
                className={cn(
                  "focus-ring rounded-full px-2 py-2 text-xs font-bold transition-colors sm:px-4",
                  state.view === view.value ? "bg-ink text-paper" : "text-muted hover:bg-ink/[0.05] hover:text-ink",
                )}
              >
                {view.label}
              </a>
            ))}
            <a
              href="https://github.com/raphael-group/dialect"
              target="_blank"
              rel="noreferrer"
              aria-label="DIALECT source code on GitHub"
              className="focus-ring ml-1 hidden size-9 place-items-center rounded-full text-muted transition-colors hover:bg-ink/[0.05] hover:text-ink sm:grid"
            >
              <Github className="size-4" aria-hidden />
            </a>
          </nav>
        </div>
      </header>
    </>
  );
}

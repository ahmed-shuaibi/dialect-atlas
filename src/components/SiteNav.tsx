import { Github } from "lucide-react";
import type { AtlasUrlState, AtlasView } from "@/features/atlas/types";
import { serializeAtlasHash } from "@/lib/useHashState";
import { cn } from "@/lib/utils";

const VIEWS: { value: AtlasView; label: string }[] = [
  { value: "about", label: "About" },
  { value: "explore", label: "Explore" },
  { value: "compare", label: "Compare" },
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
      <header className="sticky top-0 z-40 border-b border-line/90 bg-canvas/95 backdrop-blur-xl">
        <div className="site-shell flex h-[3.75rem] items-center justify-between gap-2 sm:gap-4">
          <a
            href={serializeAtlasHash({ ...state, view: "explore", pair: undefined, settings: false })}
            aria-label="DIALECT Atlas"
            className="focus-ring inline-flex items-center gap-2 rounded-[10px] py-1"
          >
            <img
              src={`${import.meta.env.BASE_URL}brand/dialect-wordmark.png`}
              alt=""
              className="h-[17px] w-auto"
            />
            <span className="border-l border-line pl-2 text-xs font-semibold tracking-[-0.01em] text-muted">
              Atlas
            </span>
          </a>
          <nav aria-label="Primary" className="flex items-center gap-0.5 sm:gap-1">
            {VIEWS.map((view) => (
              <a
                key={view.value}
                href={serializeAtlasHash({ ...state, view: view.value, pair: undefined, settings: false })}
                aria-current={state.view === view.value ? "page" : undefined}
                className={cn(
                  "focus-ring rounded-[10px] px-2.5 py-2 text-xs font-semibold transition-colors sm:px-3.5",
                  state.view === view.value
                    ? "bg-paper text-ink shadow-[inset_0_0_0_1px_var(--line),0_1px_2px_rgba(24,32,37,0.04)]"
                    : "text-muted hover:bg-paper/70 hover:text-ink",
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
              className="focus-ring ml-1 hidden size-9 place-items-center rounded-[10px] text-muted transition-colors hover:bg-paper hover:text-ink sm:grid"
            >
              <Github className="size-4" aria-hidden />
            </a>
          </nav>
        </div>
      </header>
    </>
  );
}

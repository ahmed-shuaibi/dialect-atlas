import { Github, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ui/theme";
import type { AtlasUrlState, AtlasView } from "@/features/atlas/types";
import { ATLAS_LINKS } from "@/features/atlas/lib/atlas-metadata";
import { serializeAtlasHash } from "@/lib/useHashState";
import { cn } from "@/lib/utils";

const VIEWS: { value: AtlasView; label: string }[] = [
  { value: "about", label: "About" },
  { value: "explore", label: "Explore" },
  { value: "compare", label: "Compare" },
  { value: "contact", label: "Contact" },
];

export function SiteNav({ state }: { state: AtlasUrlState }) {
  const { theme, toggleTheme } = useTheme();
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
        <div className="site-shell flex h-16 items-center justify-between gap-1.5 sm:gap-4">
          <a
            href={serializeAtlasHash({ ...state, view: "explore", pair: undefined, settings: false })}
            aria-label="DIALECT Atlas"
            className="focus-ring inline-flex shrink-0 items-center gap-2 rounded-full py-1"
          >
            <img
              src={`${import.meta.env.BASE_URL}brand/dialect-icon.png`}
              alt=""
              className="size-7 sm:hidden"
            />
            <img
              src={`${import.meta.env.BASE_URL}brand/dialect-wordmark.png`}
              alt=""
              className="brand-wordmark hidden h-[18px] w-auto sm:block"
            />
            <span className="hidden border-l border-line pl-2 text-sm font-semibold text-muted sm:inline">
              Atlas
            </span>
          </a>
          <nav aria-label="Primary" className="flex min-w-0 items-center gap-0.5 sm:gap-1">
            {VIEWS.map((view) => (
              <a
                key={view.value}
                href={serializeAtlasHash({ ...state, view: view.value, pair: undefined, settings: false })}
                aria-current={state.view === view.value ? "page" : undefined}
                className={cn(
                  "focus-ring rounded-full px-1.5 py-2 text-[11.5px] font-semibold transition-colors min-[380px]:text-[12.5px] sm:px-3.5 sm:text-sm",
                  state.view === view.value
                    ? "bg-paper text-ink shadow-[inset_0_0_0_1px_var(--line),0_1px_2px_rgba(24,32,37,0.04)]"
                    : "text-muted hover:bg-paper/70 hover:text-ink",
                )}
              >
                {view.label}
              </a>
            ))}
            <a
              href={ATLAS_LINKS.source}
              target="_blank"
              rel="noreferrer"
              aria-label="DIALECT source code on GitHub"
              className="focus-ring ml-1 hidden size-9 place-items-center rounded-full text-muted transition-colors hover:bg-paper hover:text-ink sm:grid"
            >
              <Github className="size-4" aria-hidden />
            </a>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={toggleTheme}
              className="ml-0.5"
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? <Moon className="size-4" aria-hidden /> : <Sun className="size-4" aria-hidden />}
            </Button>
          </nav>
        </div>
      </header>
    </>
  );
}

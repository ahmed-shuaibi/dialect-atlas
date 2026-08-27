import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { ThemeProvider, useTheme } from "@/components/ui/theme";

const STORAGE_KEY = "dialect-atlas-theme";

function ThemeProbe() {
  const { theme, toggleTheme } = useTheme();
  return <button onClick={toggleTheme}>{theme}</button>;
}

afterEach(() => {
  cleanup();
  window.localStorage.removeItem(STORAGE_KEY);
  delete document.documentElement.dataset.theme;
  document.documentElement.style.colorScheme = "";
  document.querySelector('meta[name="theme-color"]')?.remove();
});

describe("ThemeProvider", () => {
  it("bootstraps the saved theme before the application module loads", () => {
    const html = readFileSync("index.html", "utf8");
    const bootstrap = readFileSync("public/theme-bootstrap.js", "utf8");
    const bootstrapPosition = html.indexOf('src="%BASE_URL%theme-bootstrap.js"');
    const entryPosition = html.indexOf('src="/src/main.tsx"');

    expect(html).toContain('<html lang="en" data-theme="light">');
    expect(bootstrap).toContain('const storageKey = "dialect-atlas-theme"');
    expect(bootstrapPosition).toBeGreaterThan(0);
    expect(bootstrapPosition).toBeLessThan(entryPosition);
  });

  it("starts in warm light mode and persists an explicit dark-mode toggle", async () => {
    const user = userEvent.setup();
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.append(meta);

    const { unmount } = render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByRole("button", { name: "light" })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(meta).toHaveAttribute("content", "#f4f1ea");

    await user.click(screen.getByRole("button", { name: "light" }));
    expect(screen.getByRole("button", { name: "dark" })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(meta).toHaveAttribute("content", "#171a1b");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("dark");

    unmount();
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );
    expect(screen.getByRole("button", { name: "dark" })).toBeInTheDocument();
  });

  it("hydrates from the theme applied by the synchronous bootstrap", () => {
    document.documentElement.dataset.theme = "dark";

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByRole("button", { name: "dark" })).toBeInTheDocument();
    expect(document.documentElement).toHaveStyle({ colorScheme: "dark" });
  });
});

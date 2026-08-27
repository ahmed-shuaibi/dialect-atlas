(() => {
  const storageKey = "dialect-atlas-theme";
  const colors = { light: "#f4f1ea", dark: "#171a1b" };
  let theme = "light";
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (stored === "light" || stored === "dark") theme = stored;
  } catch {
    // Storage is optional; retain the warm light default when unavailable.
  }
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", colors[theme]);
})();

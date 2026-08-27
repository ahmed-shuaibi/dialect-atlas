import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/raleway";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./index.css";
import { App } from "@/App";
import { ThemeProvider } from "@/components/ui/theme";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);

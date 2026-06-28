import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

// Minimal flat config — a real guardrail for the committed eslint-disable directives
// (no-explicit-any in NetworkView, exhaustive-deps in useAtlas). Lint with `npm run lint`.
export default tseslint.config(
  { ignores: ["dist", "node_modules", "scripts"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
);

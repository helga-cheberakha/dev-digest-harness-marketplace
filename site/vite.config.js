import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative base so the build works unmodified whether it's served from the
// Pages root or a repo subpath — no hardcoded repo name to keep in sync.
export default defineConfig({
  plugins: [react()],
  base: "./",
});

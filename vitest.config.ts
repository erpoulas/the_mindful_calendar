import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    // Default "threads" pool intermittently fails to start worker threads on
    // this machine, throwing an unrelated-looking "Cannot read properties of
    // undefined (reading 'config')" collection error. Forks (child processes
    // instead of worker threads) doesn't hit this.
    pool: "forks",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

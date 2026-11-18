import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    // On this machine both the default "threads" pool and "forks" fail to
    // start their workers, throwing an unrelated-looking "Cannot read
    // properties of undefined (reading 'config')" error before any test runs
    // ("forks" worked for a while, then started failing the same way).
    // "vmThreads" runs each test file in its own VM context inside a worker
    // and doesn't hit this.
    pool: "vmThreads",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

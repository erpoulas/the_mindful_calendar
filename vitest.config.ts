import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

// Windows drive letters are case-insensitive, but Vitest isn't: VS Code's
// terminal starts in "c:\..." while Node resolves node_modules to "C:\...",
// so vi.mock of a package (like next/navigation) is stored under one spelling
// and looked up under the other, and the real module loads instead.
// Pinning the root to an uppercase drive letter keeps them the same.
const projectRoot = __dirname.replace(/^[a-z]:/, (drive) => drive.toUpperCase());

export default defineConfig({
  root: projectRoot,
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
    // Many tests talk to the real Supabase database, ~100ms per query over
    // the internet, so a busy test can pass the default 5s limit by chance.
    // (withRollback gives its transactions the same 30s.)
    testTimeout: 30_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(projectRoot, "./src"),
    },
  },
});

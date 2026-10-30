import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/global-setup.ts"],
    env: { DATABASE_URL: "file:./test.db", SESSION_SECRET: "test-secret-for-vitest-only-0123456789abcdef" },
    // Integration tests share one SQLite file, so run files one at a time.
    fileParallelism: false,
    coverage: {
      provider: "v8",
      include: ["src/lib/**", "src/server/**"],
      reporter: ["text", "html"],
    },
  },
});

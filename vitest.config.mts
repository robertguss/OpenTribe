import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "edge-runtime",
    server: { deps: { inline: ["convex-test"] } },
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/tests/e2e/**", // E2E tests run with Playwright, not Vitest
    ],
  },
});

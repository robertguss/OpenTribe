# OpenTribe Test Suite

This document describes the testing architecture for OpenTribe.

## Test Stack

| Tool            | Purpose                 | Location              |
| --------------- | ----------------------- | --------------------- |
| **Vitest**      | Unit/Integration tests  | `convex/*.test.ts`    |
| **convex-test** | Convex function testing | `convex/*.test.ts`    |
| **Playwright**  | E2E browser tests       | `tests/e2e/*.spec.ts` |

## Test Coverage Strategy

Based on the TEA Test Design (60/30/10 split):

| Level           | Ratio | What to Test                                         |
| --------------- | ----- | ---------------------------------------------------- |
| **Unit**        | 60%   | Convex functions, permission helpers, business logic |
| **Integration** | 30%   | API contracts, webhook handlers, auth flows          |
| **E2E**         | 10%   | Critical user journeys, auth flows, payments         |

## Quick Start

### Install Dependencies

```bash
# Install Playwright browsers
npx playwright install

# Install project dependencies (if not already done)
pnpm install
```

### Run Tests

```bash
# Unit/Integration tests (Convex functions)
pnpm run test              # Watch mode
pnpm run test:once         # Single run
pnpm run test:coverage     # With coverage report

# E2E tests (Browser)
pnpm run test:e2e          # Headless mode
pnpm run test:e2e:ui       # Interactive UI mode
pnpm run test:e2e:headed   # Headed mode (see browser)
pnpm run test:e2e:critical # Critical path tests only
```

## Directory Structure

```
/
├── convex/                     # Convex backend
│   ├── *.ts                    # Convex functions
│   └── *.test.ts               # Co-located unit tests
│
├── tests/                      # E2E test infrastructure
│   ├── e2e/                    # E2E test files
│   │   ├── auth.setup.ts       # Auth session setup
│   │   ├── auth.critical.spec.ts  # Critical auth tests
│   │   └── example.spec.ts     # Example patterns
│   │
│   ├── support/                # Test infrastructure
│   │   ├── fixtures/           # Playwright fixtures
│   │   │   └── index.ts        # Main fixture exports
│   │   └── helpers/            # Utility functions
│   │
│   └── .auth/                  # Stored auth sessions (gitignored)
│       └── user.json
│
├── test-results/               # Test artifacts (gitignored)
│   ├── html/                   # HTML report
│   └── junit.xml               # CI integration
│
└── playwright.config.ts        # Playwright configuration
```

## Testing Patterns

### Convex Unit Tests (Vitest + convex-test)

```typescript
// convex/myFunctions.test.ts
import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";

it("should test a query", async () => {
  const t = convexTest(schema, modules);
  const result = await t.query(api.myFunctions.myQuery, { arg: "value" });
  expect(result).toBe("expected");
});

// With authentication
it("should test with auth", async () => {
  const t = convexTest(schema, modules);
  const asUser = t.withIdentity({ subject: "user-123", name: "Test User" });
  const result = await asUser.query(api.myFunctions.protectedQuery, {});
  expect(result.viewer).toBe("Test User");
});
```

### E2E Tests (Playwright)

```typescript
// tests/e2e/feature.spec.ts
import { test, expect } from "../support/fixtures";

test.describe("Feature", () => {
  test("should do something", async ({ page }) => {
    // Network-first: Set up interception BEFORE action
    const apiResponse = page.waitForResponse("**/api/data");

    await page.goto("/feature");
    await page.click('[data-testid="load-data"]');

    // Deterministic wait (no hard waits!)
    const response = await apiResponse;
    expect(response.ok()).toBeTruthy();

    // Assert on UI
    await expect(page.getByText("Data loaded")).toBeVisible();
  });

  // Pre-authenticated test
  test("should work for logged-in users", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/dashboard");
    await expect(authenticatedPage).toHaveURL(/dashboard/);
  });
});
```

## Key Principles

### 1. No Hard Waits

```typescript
// BAD
await page.waitForTimeout(3000);

// GOOD - Wait for specific condition
await page.waitForResponse("**/api/data");
await expect(page.getByText("Loaded")).toBeVisible();
```

### 2. Network-First Interception

```typescript
// Set up interception BEFORE the action
const responsePromise = page.waitForResponse("**/api/submit");
await page.click('[data-testid="submit"]');
const response = await responsePromise; // Deterministic
```

### 3. Test Isolation

```typescript
// Each test gets a fresh convex-test environment
it("test 1", async () => {
  const t = convexTest(schema, modules); // Fresh instance
});

it("test 2", async () => {
  const t = convexTest(schema, modules); // Fresh instance
});
```

### 4. Explicit Assertions

```typescript
// Keep assertions in test bodies, not hidden in helpers
const response = await request.post("/api/users", { data: userData });
expect(response.status()).toBe(201); // Visible!
expect(createdUser.email).toBe(userData.email); // Visible!
```

## Environment Variables

Create `.env.local` for test credentials:

```bash
# Test user for E2E tests
TEST_USER_EMAIL=test@opentribe.test
TEST_USER_PASSWORD=TestPassword123!

# Base URL (defaults to localhost:3000)
BASE_URL=http://localhost:3000
```

## CI Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: pnpm install
      - run: npx convex codegen
      - run: pnpm run test:once

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: pnpm install
      - run: npx playwright install --with-deps
      - run: pnpm run test:e2e:critical
```

## Debugging

### Playwright

```bash
# Interactive UI mode
pnpm run test:e2e:ui

# Debug mode with inspector
pnpm run test:e2e -- --debug

# View HTML report
npx playwright show-report test-results/html
```

### Vitest

```bash
# Debug mode
pnpm run test:debug

# Run specific test
pnpm run test -- myFunctions
```

## Adding New Tests

### Convex Function Test

1. Create `convex/featureName.test.ts` next to the function file
2. Import test utilities: `convexTest`, `schema`, `modules`
3. Write tests following the isolation pattern

### E2E Test

1. Create `tests/e2e/feature.spec.ts`
2. Import fixtures: `import { test, expect } from '../support/fixtures'`
3. Use `authenticatedPage` fixture for logged-in tests
4. Follow network-first pattern for API interactions

## References

- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [convex-test Documentation](https://docs.convex.dev/testing)
- [TEA Test Design](../docs/test-design-system.md)

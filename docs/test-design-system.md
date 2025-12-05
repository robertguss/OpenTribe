# System-Level Test Design

**Project:** OpenTribe
**Date:** 2025-12-04
**Author:** Robert (via TEA Agent)
**Status:** Draft

---

## Executive Summary

**Assessment:** PASS with RECOMMENDATIONS

OpenTribe's architecture is **highly testable** due to excellent technology choices. The Convex + Better Auth stack provides strong controllability (API seeding, function isolation), observability (reactive queries, built-in logging), and reliability (stateless functions, automatic persistence). Minor recommendations focus on optimizing the test strategy for the specific tech stack.

---

## Testability Assessment

### Controllability: PASS

**Can we control system state for testing?**

| Aspect                | Assessment | Notes                                                            |
| --------------------- | ---------- | ---------------------------------------------------------------- |
| API Seeding           | PASS       | Convex mutations provide direct data seeding via `convex-test`   |
| Database Reset        | PASS       | `convex-test` creates isolated in-memory environments per test   |
| Auth State            | PASS       | Better Auth sessions can be mocked via `withIdentity()`          |
| External Dependencies | PASS       | Stripe/Resend are Convex components - mockable via actions       |
| Error Injection       | PASS       | Convex functions can throw `ConvexError` for controlled failures |

**Evidence:**

- `convex-test` already configured in `convex/test.setup.ts`
- Pattern: `const t = convexTest(schema, modules)` provides isolated test environment
- Auth mocking: `t.withIdentity({ subject: "user123" })` established pattern

### Observability: PASS

**Can we inspect system state?**

| Aspect                | Assessment | Notes                                                             |
| --------------------- | ---------- | ----------------------------------------------------------------- |
| Query Inspection      | PASS       | Convex queries return typed results, inspectable via `t.query()`  |
| Mutation Verification | PASS       | Direct database access via `t.run(async (ctx) => ctx.db.query())` |
| Real-time State       | PASS       | Convex reactive subscriptions provide immediate state visibility  |
| Logs                  | PASS       | Convex dashboard provides function execution logs                 |
| Errors                | PASS       | `ConvexError` provides structured user-facing errors              |

**Evidence:**

- Architecture mandates `ConvexError` for all user-facing errors (searchable, structured)
- Convex dashboard provides execution traces for debugging
- TypeScript validators on all functions ensure predictable return shapes

### Reliability: PASS

**Are tests isolated and reproducible?**

| Aspect                | Assessment | Notes                                                    |
| --------------------- | ---------- | -------------------------------------------------------- |
| Test Isolation        | PASS       | `convexTest()` creates fresh environment per test        |
| Parallel Safety       | PASS       | In-memory mock environment prevents cross-test pollution |
| Deterministic Results | PASS       | No race conditions - Convex functions are transactional  |
| Cleanup Discipline    | PASS       | convex-test auto-cleans per test instance                |

**Evidence:**

- Testing pattern from `CLAUDE.md`: "Create a new `convexTest(schema, modules)` instance in each test for isolation"
- Convex's transactional model prevents partial state updates

---

## Architecturally Significant Requirements (ASRs)

Based on PRD NFRs and architecture decisions, these quality requirements drive testability:

| ID     | Requirement                              | Category | Probability | Impact | Score | Test Approach                          |
| ------ | ---------------------------------------- | -------- | ----------- | ------ | ----- | -------------------------------------- |
| ASR-1  | 500 concurrent users without degradation | PERF     | 2           | 3      | 6     | k6 load testing against staging        |
| ASR-2  | 2s page load on standard connections     | PERF     | 2           | 2      | 4     | Lighthouse CI, Playwright timing       |
| ASR-3  | 500ms real-time updates                  | PERF     | 2           | 2      | 4     | Playwright network timing              |
| ASR-4  | Better Auth session validation           | SEC      | 2           | 3      | 6     | E2E auth flows, middleware testing     |
| ASR-5  | Role-based access (Admin/Mod/Member)     | SEC      | 3           | 3      | 9     | Unit tests for permission helpers      |
| ASR-6  | Stripe webhook signature validation      | SEC      | 2           | 3      | 6     | Integration tests with signed payloads |
| ASR-7  | Rate limiting on mutations               | SEC      | 2           | 2      | 4     | Integration tests with rapid requests  |
| ASR-8  | 99.5% uptime (Convex/Vercel SLAs)        | REL      | 1           | 3      | 3     | Monitoring, not testing                |
| ASR-9  | Gamification point consistency           | DATA     | 2           | 2      | 4     | Unit tests for `awardPoints`           |
| ASR-10 | Payment-access coupling accuracy         | BUS      | 2           | 3      | 6     | Integration tests for webhook handlers |

**Critical (Score 9):** ASR-5 - Role-based access control must be exhaustively tested. This is the authorization backbone for all features.

**High (Score 6):** ASR-1, ASR-4, ASR-6, ASR-10 - These require dedicated test coverage with mitigation plans.

---

## Test Levels Strategy

Based on the full-stack real-time architecture with Convex backend:

### Recommended Split: 60/30/10 (Unit/Integration/E2E)

| Level           | Ratio | Rationale                                                                         |
| --------------- | ----- | --------------------------------------------------------------------------------- |
| **Unit**        | 60%   | Convex functions are pure and isolated - ideal for unit testing via `convex-test` |
| **Integration** | 30%   | API contracts, webhook handlers, auth flows need integration validation           |
| **E2E**         | 10%   | Critical user journeys only - Convex handles data consistency                     |

**Why This Split:**

1. **Convex functions are highly unit-testable** - They're pure functions with typed inputs/outputs
2. **Real-time sync is handled by Convex** - No need to E2E test reactive updates
3. **Auth flows need E2E** - Better Auth integration requires browser-based testing
4. **Payment webhooks need integration** - Stripe signature validation is critical

### Test Environment Requirements

| Environment    | Purpose            | Infrastructure                          |
| -------------- | ------------------ | --------------------------------------- |
| **Local**      | Unit + Integration | `convex-test` mock, `pnpm run test`     |
| **Staging**    | E2E + Performance  | Separate Convex project, Vercel preview |
| **Production** | Monitoring only    | Sentry, Convex dashboard                |

---

## NFR Testing Approach

### Security (ASR-4, ASR-5, ASR-6, ASR-7)

**Approach:** Playwright E2E + Convex unit tests

| NFR                                  | Test Type   | Tool        | Priority |
| ------------------------------------ | ----------- | ----------- | -------- |
| Auth redirect for unauthenticated    | E2E         | Playwright  | P0       |
| RBAC enforcement (Admin/Mod/Member)  | Unit        | convex-test | P0       |
| Password hashing (bcrypt)            | Unit        | convex-test | P1       |
| Session expiry                       | E2E         | Playwright  | P1       |
| Stripe webhook signature             | Integration | convex-test | P0       |
| Rate limiting                        | Integration | convex-test | P1       |
| XSS prevention (Tiptap sanitization) | E2E         | Playwright  | P1       |

**Key Tests:**

```typescript
// Permission helper unit test (P0)
test("member cannot access admin routes", async () => {
  const t = convexTest(schema, modules);
  const asMember = t.withIdentity({ subject: "member-123", role: "member" });

  await expect(
    asMember.mutation(api.admin.mutations.banUser, { userId: "..." })
  ).rejects.toThrow("Permission denied");
});
```

### Performance (ASR-1, ASR-2, ASR-3)

**Approach:** k6 for load testing, Lighthouse CI for Core Web Vitals

| NFR                  | Test Type   | Tool          | Threshold                 |
| -------------------- | ----------- | ------------- | ------------------------- |
| 500 concurrent users | Load test   | k6            | p95 < 2s, error rate < 1% |
| 2s page load         | Synthetic   | Lighthouse CI | Performance score > 80    |
| 500ms real-time      | E2E         | Playwright    | Network timing assertion  |
| 1s search results    | Integration | convex-test   | Query timing assertion    |

**k6 Configuration:**

```javascript
export const options = {
  stages: [
    { duration: "1m", target: 100 },
    { duration: "3m", target: 500 },
    { duration: "1m", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    errors: ["rate<0.01"],
  },
};
```

### Reliability (ASR-8)

**Approach:** Playwright E2E for graceful degradation

| NFR                               | Test Type   | Tool        | Priority |
| --------------------------------- | ----------- | ----------- | -------- |
| Graceful degradation on API error | E2E         | Playwright  | P1       |
| Webhook retry on failure          | Integration | convex-test | P1       |
| Offline handling                  | E2E         | Playwright  | P2       |

**Key Pattern:**

```typescript
// Mock API failure, verify graceful degradation
await context.route("**/api/**", (route) => route.fulfill({ status: 500 }));
await page.goto("/dashboard");
await expect(page.getByText("Unable to load. Please try again.")).toBeVisible();
```

### Maintainability

**Approach:** CI pipeline checks + observability validation

| NFR                | Test Type | Tool            | Threshold          |
| ------------------ | --------- | --------------- | ------------------ |
| Test coverage      | CI        | Vitest coverage | > 80%              |
| Code duplication   | CI        | jscpd           | < 5%               |
| Vulnerability scan | CI        | npm audit       | 0 critical/high    |
| Error tracking     | E2E       | Playwright      | Sentry integration |

---

## Test Environment Requirements

### Local Development

- `pnpm run test` - Vitest + convex-test for unit/integration
- `pnpm run test:coverage` - Coverage report
- No external dependencies (mocked)

### Staging Environment

- Separate Convex project for E2E tests
- Test Stripe account with webhook testing
- Vercel preview deployments

### CI Pipeline

```yaml
jobs:
  test:
    - Unit tests (convex-test)
    - Integration tests (convex-test with Stripe mocks)
    - Coverage check (> 80%)
    - Vulnerability scan (npm audit)

  e2e:
    - Playwright against staging
    - Critical path tests only

  performance:
    - Lighthouse CI (weekly)
    - k6 load tests (pre-release)
```

---

## Testability Concerns

### No Blockers Identified

The architecture is well-designed for testability. Minor recommendations:

### Recommendations

| ID   | Concern                      | Severity | Recommendation                                                   |
| ---- | ---------------------------- | -------- | ---------------------------------------------------------------- |
| TC-1 | Real-time testing complexity | LOW      | Use Convex reactive queries in tests, not polling                |
| TC-2 | Stripe webhook testing       | MEDIUM   | Use Stripe CLI for local webhook forwarding in integration tests |
| TC-3 | Email verification testing   | LOW      | Mock Resend in tests, use `emailVerified: true` flag             |
| TC-4 | Gamification consistency     | MEDIUM   | Add invariant tests for point calculations                       |

### Mitigation for TC-2 (Stripe Webhooks):

```typescript
// Integration test pattern for webhook handlers
test("webhook provisions access on checkout.session.completed", async () => {
  const t = convexTest(schema, modules);

  // Seed user without access
  await t.run(async (ctx) => {
    await ctx.db.insert("users", { email: "test@example.com", tier: null });
  });

  // Simulate webhook
  await t.action(api.payments.webhooks.handleStripeWebhook, {
    event: {
      type: "checkout.session.completed",
      data: {
        object: {
          customer_email: "test@example.com",
          metadata: { tier: "pro" },
        },
      },
    },
    signature: "test_signature", // Bypass validation in test mode
  });

  // Verify access provisioned
  const user = await t.run(async (ctx) => {
    return ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), "test@example.com"))
      .first();
  });
  expect(user.tier).toBe("pro");
});
```

---

## Recommendations for Sprint 0

### Framework Setup (Epic 1)

1. **Configure test structure:**

   ```
   convex/
   ├── _lib/
   │   ├── auth.ts
   │   ├── auth.test.ts        # Permission helper tests
   │   └── permissions.ts
   │   └── permissions.test.ts
   ├── spaces/
   │   ├── queries.ts
   │   ├── queries.test.ts
   │   ├── mutations.ts
   │   └── mutations.test.ts
   ```

2. **Add test utilities:**

   ```typescript
   // convex/test-utils.ts
   export const createTestUser = (overrides = {}) => ({
     email: faker.internet.email(),
     name: faker.person.fullName(),
     role: "member",
     ...overrides,
   });
   ```

3. **Configure CI pipeline:**
   ```yaml
   # .github/workflows/test.yml
   - run: pnpm run test:coverage
   - run: npx playwright test --project=critical
   ```

### Priority Test Coverage

| Priority | Area                    | Test Type   | Stories       |
| -------- | ----------------------- | ----------- | ------------- |
| P0       | Permission helpers      | Unit        | 1.2           |
| P0       | Auth flows              | E2E         | 1.3, 1.4, 1.5 |
| P0       | Stripe webhook handlers | Integration | 5.6           |
| P1       | Gamification points     | Unit        | 6.1, 6.2      |
| P1       | Space CRUD              | Unit        | 2.1           |
| P1       | Course progress         | Unit        | 3.6, 3.7      |

---

## Quality Gate Criteria

### Pre-Sprint Checklist

- [x] Testability assessment: PASS
- [x] Test levels strategy defined
- [x] NFR testing approach documented
- [x] No critical testability concerns
- [x] Sprint 0 recommendations provided

### Release Gate Criteria (for future sprints)

- [ ] All P0 tests pass (100%)
- [ ] P1 tests pass rate >= 95%
- [ ] Test coverage >= 80%
- [ ] No high-risk (score >= 6) items unmitigated
- [ ] k6 load test passes (500 users, p95 < 2s)

---

## Summary

**Testability Status:** READY FOR IMPLEMENTATION

**Key Strengths:**

1. Convex + convex-test provides excellent unit test isolation
2. TypeScript validators ensure predictable function contracts
3. Better Auth integration is testable via identity mocking
4. Architecture patterns (ConvexError, permission helpers) support testability

**Next Steps:**

1. Run `*framework` workflow to initialize test framework architecture
2. Implement P0 test coverage for permission helpers (Story 1.2)
3. Set up CI pipeline with coverage gates

---

**Generated by:** BMad TEA Agent - Test Architect Module
**Workflow:** `.bmad/bmm/testarch/test-design` (System-Level Mode)
**Version:** 4.0 (BMad v6)

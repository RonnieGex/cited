# Step 4, existing tests: the panel surface (task 3.3)

Implementer: Sonnet 5.5. Date: 2026-09-29. Paths are relative to the repository; `<worktree>` is the checkout of `community-ui`.

Command, from `<worktree>`, at the commit `dcd6381`:

```
npx vitest run tests/admin-*.test.ts tests/admin-*.test.tsx tests/brand-panel.test.tsx
 Test Files  11 passed (11)
      Tests  87 passed (87)
```

The 10 existing files (`admin-business-missing`, `admin-business`, `admin-documents`, `admin-guard`, `admin-i18n`, `admin-lockout`,
`admin-routes`, `admin-session`, `admin-setup`, `admin-ui`) pass with no edit: no existing test changed, so there is no changed
assertion to justify. `tests/admin-ui.test.tsx` renders `AdminNav` without a router and without mocking `next/navigation`; it passes
because `usePathname` returns `null` outside the app router and the navigation marks nothing then.

Files of my area that I did not edit: `e2e/admin.spec.ts`, `e2e/admin-fixtures.ts`, `e2e/admin-brand.spec.ts` (the contract). `lib/settings/business.ts`
untouched; `LanguageSwitch` used with its optional `tone` only. The whole suite and the E2E are for the integration agent.

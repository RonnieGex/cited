# Step 12: reintegration after the review fixes

Integration agent, branch `feature/brand-identity-ui`. Every command ran in the scratch worktree (`community-e2e`),
checked out detached at the branch; the fixes were made and committed in the worktree of the change. `package-lock.json`
did not change, so `npm ci` was not run. Node 24.11.0, Playwright 1.63.0. `tasks.md`, `design.md` and the specs are
untouched.

## Run 1, at `94b2f43`

| Command | Result |
| --- | --- |
| `npm test` | 44 files, 520 tests passed |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0, 0 warnings |
| `npx openspec validate --all --strict` | 11 passed, 0 failed |
| `git diff --check main...HEAD` | exit 0, no output |
| `CI=1 npm run test:e2e` (ports 3100, 3210, 3212, 3213 free) | exit 1: 39 passed, 2 failed, 1 flaky |

Failures:

1. `[public] e2e/brand.spec.ts:402` `in es the footer of / reads "Hecho por Katalis" beside the flame of Katalis`,
   both attempts: `getByText('Hecho por Katalis', { exact: true })` not found. Root cause: `lib/i18n/public.ts` kept
   `footer: "Built by Katalis"` in the `es` strings, against decision 18 of `design.md` ("The Spanish public footer in
   `lib/i18n/public.ts` reads `Hecho por Katalis` like the panel does"). No unit test covered the Spanish footer.
2. `[panel] e2e/admin.spec.ts:145` `the conversations are listed and deleted`, both attempts: strict mode violation,
   `getByText('Answered')` resolved to 2 cells. Root cause: the date case of `e2e/admin-brand.spec.ts` (decision 19)
   asks its own answered question against the same panel store in parallel, so the page has two `Answered` rows.
3. `[panel] e2e/admin.spec.ts:56` `the sixth attempt of one address is locked`, flaky: it passed first and failed on
   the retry. The file is `serial`, so the failure of case 2 retried the whole file, and the retry reuses the fixed
   address `198.51.100.240`, whose failed attempts the server still counts; the fifth attempt answered `locked`
   instead of the wrong-password message. It is a consequence of case 2. A latent cause was also found: the address of
   `e2e/admin-brand.spec.ts` was drawn from 212 to 251, which contains 240, so one run in forty would add a failed
   Spanish sign-in to the counter of the lockout case.

## Fixes

- `4d21419` Sign the Spanish public page with Hecho por Katalis: `lib/i18n/public.ts` `es.footer` is
  `Hecho por Katalis`; `tests/brand-public.test.tsx` gains the case "signs the Spanish page with Hecho por Katalis
  beside the flame, and never the English line" (red before the fix: `Hecho por Katalis` not found; green after).
- `2ff55ae` Keep the two panel specs from reading each other's state: `e2e/admin.spec.ts` reads the `Answered` cell
  in the row of its own question; `e2e/admin-brand.spec.ts` draws its address from 212 to 231, away from `E2E_ADDRESS`
  (11 to 210) and from 240.

## Run 2, at `2ff55ae`

| Command | Result |
| --- | --- |
| `npm test` | 44 files, 521 tests passed |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0, 0 warnings |
| `npx openspec validate --all --strict` | 11 passed, 0 failed |
| `git diff --check main...HEAD` | exit 0, no output |
| `CI=1 npm run test:e2e` | exit 0: 42 passed, 0 failed, 0 flaky |

The date case printed `datetime="2026-09-29T23:06:40.696Z"`, shown `29 sept 2026, 17:06`, equal to `formatWhen` for es.

## Issues

- BROKEN: none.
- RISK: the lockout case of `e2e/admin.spec.ts` is not retry-safe: its address is fixed and the server keeps the
  counter, so any failure elsewhere in that serial file makes the retry of the lockout case fail too. It predates this
  change; a fresh address per attempt would remove it.
- RISK: the delete-all of `e2e/admin.spec.ts` can clear the turn of the date case of `e2e/admin-brand.spec.ts`; that
  case retries with `toPass` for 30 s and passed.
- NOT DONE: nothing in the scope of this step.
- UNKNOWN: the worktree of the change carries uncommitted edits that are not of this step (`LOOP_STATE.md` and
  line-ending-only changes to four step reports and `tests/admin-ui.test.tsx`); they were left untouched.

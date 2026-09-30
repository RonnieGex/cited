# Step 1: the state of the base before (task 1.1)

Implementer: Sonnet 5.5. Date: 2026-09-29. Run in `<worktree>` (`community-ui`) at commit `6668cff`, the tip of
`feature/brand-identity-ui` before my commits, with Node `v24.11.0` and npm `11.6.1` on Windows 11. Every path is
relative to the repository; `<worktree>` is the checkout of `community-ui`.

The commands ran in this order, one after the other, in the worktree the dev server (port 3300) uses.

## `npm test`

```
$ npm test
> cited@0.1.0 test
> vitest run

 ❯ tests/readme.test.ts (42 tests | 1 failed) 662ms
   ❯ README, the status table (2)
     × marks every row Available or Planned, with the spec or the change that delivers it 24ms

 FAIL  tests/readme.test.ts > README, the status table > marks every row Available or Planned, with the spec or the change that delivers it
AssertionError: The panel: the setup, the business, the documents and the conversations: a spec an open change still adds is never written by hand: expected true to be false // Object.is equality

 ❯ tests/readme.test.ts:682:11

 Test Files  1 failed | 37 passed (38)
      Tests  1 failed | 347 passed (348)
   Duration  19.26s
exit 1
```

**Counts: 38 test files (37 passed, 1 failed); 348 tests (347 passed, 1 failed).**

The one failure is BROKEN before any implementation, and it is caused by the change itself, not by the code. The root
cause, read from `tests/readme.test.ts`:

- `openChangeSpecs(capability)` (line 239) lists every open change whose `specs/<capability>/spec.md` contains the text
  `## ADDED Requirements` (`addsCapability`, line 235), and the status table test (lines 669 to 685) demands that a row
  linking a spec that exists in force (`openspec/specs/admin-panel/spec.md`) has NO open change that adds that
  capability: "a spec an open change still adds is never written by hand".
- The three deltas of this change (`specs/admin-panel`, `specs/public-chat`, `specs/design-system`) all use `## ADDED
  Requirements` on capabilities that already exist in `openspec/specs/`, which is the correct OpenSpec form for new
  requirements of an existing capability. The guard cannot tell "the change creates this capability" from "the change
  adds requirements to one that exists".
- The test stops at the first row that fails (`admin-panel`); the row of `public-chat` (`Public chat of the business,
  with the widget any site can embed`, `Available`) has the same shape, so it fails next once the first is passed.

This is not in the files I own and I did not touch it. The fix belongs to the integration agent: `addsCapability`
should count an open change as "delivering" only when the capability has no spec in force (a delta on a spec that exists
adds requirements, it does not write the capability by hand), or the deltas would have to change form. It is listed in
the issues of the final answer.

## `npm run typecheck`

```
$ npm run typecheck
> cited@0.1.0 typecheck
> next typegen && tsc --noEmit

Generating route types...
✓ Types generated successfully
exit 0
```

## `npm run lint`

```
$ npm run lint
> cited@0.1.0 lint
> eslint .

exit 0
```

## `npx openspec validate --all --strict`

```
$ npx openspec validate --all --strict
- Validating...
✓ spec/admin-panel
✓ spec/answering
✓ spec/app-skeleton
✓ change/brand-identity-ui
✓ spec/design-system
✓ spec/knowledge-search
✓ spec/product-identity
✓ spec/project-readme
✓ spec/public-chat
✓ spec/repository-bootstrap
✓ spec/supply-chain-security
Totals: 11 passed, 0 failed (11 items)
exit 0
```

## `git status`

```
$ git status
On branch feature/brand-identity-ui
Changes not staged for commit:
	modified:   LOOP_STATE.md

Untracked files:
	scripts/capture-ui.mjs

no changes added to commit (use "git add" and/or "git commit -a")
```

`LOOP_STATE.md` was already modified before I started (it belongs to the loop of the integration, not to me);
`scripts/capture-ui.mjs` is the capture script that I committed afterwards in `41c70fe` (see step 0).

## The state of the store of the running preview (`.data/preview.sqlite`)

This change touches no table, so the same script is repeated in step 8. The store is read with a Node script written as
a file inside `.data/` (git-ignored), that uses `@libsql/client` of this repository and only runs `SELECT`, and that I
deleted afterwards (`git check-ignore -v .data/state-of-store.mjs` printed `.gitignore:29:/.data/`, and
`ls .data | grep state` printed nothing after the deletion). The text of the script, to recreate it in step 8:

```js
// Read-only: lists the tables of the store of the running preview and the row count of each. Only SELECT statements run.
import { createClient } from "@libsql/client";

const client = createClient({ url: "file:.data/preview.sqlite" });
const tables = await client.execute(
  "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
);

for (const row of tables.rows) {
  const name = String(row.name);
  const counted = await client.execute(`SELECT COUNT(*) AS rows FROM "${name}"`);

  console.log(`${name}\t${counted.rows[0].rows}`);
}

client.close();
```

The exact command and its output (from `<worktree>`):

```
$ node .data/state-of-store.mjs
business	1
conversations	3
documents	4
login_attempts	0
model_calls	1
passages	11
passages_fts	11
passages_fts_config	1
passages_fts_content	11
passages_fts_data	6
passages_fts_docsize	11
passages_fts_idx	4
rate_limits	1
```

13 tables. The five that carry the product (`business`, `conversations`, `documents`, `passages` and its full-text
index `passages_fts*`) hold one business, four documents, eleven passages and three conversations; `model_calls` and
`rate_limits` are the counters of the guards. The preview is in use while this is written (Franc watches it), so the
counters of `conversations`, `model_calls` and `rate_limits` may move between this step and step 8 for reasons that are
not this change; the tables that a change could break (`business`, `documents`, `passages`) are the ones to compare.

The preview store has a business row; the scenario "No business yet" of the E2E is therefore proved against the store of
the public E2E server (`.data/e2e.sqlite` of the E2E worktree), which has none, and not against this one.

# Step 5: the checks (task 5.1)

Integration agent: Sonnet 5.5. Date: 2026-09-29. Run in `<e2e-worktree>` (the detached scratch checkout `community-e2e`,
Windows 11, Node v24.11.0, npm 11.6.1), synced with `git checkout --detach feature/brand-identity-ui`. `package-lock.json`
did not change in this change (`git diff --stat main...HEAD -- package.json package-lock.json` printed nothing), so no
`npm ci` was needed there and no dependency was added.

## First run at `3313532` (the tip the surface agents left): three red tests

```
$ npm test
 Test Files  1 failed | 42 passed (43)
      Tests  3 failed | 485 passed (488)
 FAIL tests/readme.test.ts > README, the status table > marks every row Available or Planned, ...
   AssertionError: The panel: ...: a spec an open change still adds is never written by hand: expected true to be false
 FAIL tests/readme.test.ts > the product is named Cited > names Cited in the places a reader sees first
   AssertionError: expected 'import Image from "next/image"; ...' to contain 'PRODUCT_NAME'
 FAIL tests/readme.test.ts > the product is named Cited > keeps the home page as one main element with one heading ...
   AssertionError: expected 2 to be 1     (times(page, "<h1"))
```

Root causes and the fix (commit `ee21f84`, edited in `<worktree>`, which is the source of truth): the home page had two
`<h1` in its text, one per branch (fixed in `app/page.tsx`: one `<h1>` with an `sr-only` class without a business); the page
no longer names `PRODUCT_NAME` (the test reads `brand.name`); and the guard "a spec in force that an open change still
adds" cannot tell an ADDED delta over an existing capability from a hand-written spec (guard retired, see step 4).
The first failure was already reported by the implementer in step 1.

## Final run at `6926130`

```
$ npm test
 Test Files  43 passed (43)
      Tests  489 passed (489)

$ npm run typecheck        -> Types generated successfully, tsc exit 0
$ npm run lint             -> eslint . exit 0

$ npm audit --audit-level=high
found 0 vulnerabilities    exit 0

$ npm run secrets:scan     (gitleaks git --redact --no-banner)
INF 383 commits scanned.
INF scanned ~6044318 bytes (6.04 MB) in 4.03s
INF no leaks found         exit 0

$ npx openspec validate --all --strict
Totals: 11 passed, 0 failed (11 items)

$ git diff --check main...HEAD
(no output) exit 0
```

`npm audit` found nothing at the high level in this checkout: the inherited findings of queue item 2h did not show up
(the lock file resolves to patched versions). Nothing to defer here.

The pre-commit hook ran gitleaks on each of my commits (`ee21f84`, `02add62`, `6926130`): `no leaks found` each time.

## The same `npm test` in a `node:24` Linux container

Docker 29.4.1 is available. The command of the contract mounts the worktree, but `community-e2e` is a git worktree whose
`.git` is a file that points to a Windows path, so inside Linux `git ls-files` fails: 8 tests red in
`design-system`, `personal-paths` and `readme` with `fatal: not a git repository: /work/<windows path of the worktree>`
(`3 failed | 40 passed`, `8 failed | 477 passed | 3 skipped`). That is a property of the mount, not of the code. The honest
equivalent is a plain clone of the branch (a real `.git` directory, what CI checks out), made from `<worktree>`:

```
$ git clone --branch feature/brand-identity-ui <worktree> <temp>/clone      (HEAD 6926130)
$ docker run --rm -v <temp>/clone:/src:ro node:24 bash -c "cp -r /src /work && cd /work && node -v && npm -v && npm ci && npm test"
v24.21.0
added 513 packages, and audited 514 packages in 30s
found 0 vulnerabilities
 Test Files  43 passed (43)
      Tests  487 passed | 2 skipped (489)
exit 0
```

The two skipped tests are in `tests/design-system.test.ts` (19 tests, 2 skipped); they skip on Linux by their own guard
and were not touched by this change. Windows runs them (489 of 489).

## Rerun after the last commit, `ed86833` (the kit copy without prices, see step 7)

```
$ npm test                            Test Files 43 passed (43), Tests 490 passed (490)
$ npm run typecheck                   Types generated successfully, exit 0
$ npx eslint .                        exit 0
$ git diff --check main...HEAD        exit 0
$ npm run secrets:scan                INF no leaks found      (gitleaks also ran in the hook of `ed86833`: no leaks found)
$ npx openspec validate --all --strict  Totals: 11 passed, 0 failed (11 items)
```

The Linux container run above was made at `6926130`. `ed86833` changes one page's copy and adds one unit test, and I did not
repeat the container run for it: UNKNOWN on Linux for that last commit, expected the same.

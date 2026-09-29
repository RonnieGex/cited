# Step 5: run the checks

- Date: 2026-09-29
- Change: `public-page-and-widget`
- Branch: `feature/public-page-and-widget`
- Agent: deepseek-harness
- Commit verified against: `0c97c0b` (the trim of the step 2 report)
- Verdict: every check of the task is green on Windows and in a `node:24` Linux container, and the size of
  `public/widget.js` is 2175 bytes against the 5120 of the decision.

## 5.1 `npm test` on Windows

```powershell
npm test
```

```text
 Test Files  26 passed (26)
      Tests  263 passed (263)
   Start at  10:13:36
   Duration  12.47s (environment 45%, tests 34%, setup 10%, import 6%, transform 4%, worker 1%)
```

Full log: `katalis-dev/tasks/_community-08-step5-test-windows.log`.

## 5.2 `npm test` in a `node:24` Linux container

The first attempt exported the branch with `git archive`, which carries no `.git`, and the three tests that list the
tracked files of the repository (`tests/personal-paths.test.ts` and the two of `tests/readme.test.ts` that read
`.env.example` against the code) failed for that reason alone: 8 tests red in 3 files. The run below starts from a
local clone of the branch, which is what those tests need:

```powershell
git clone --quiet --local --branch feature/public-page-and-widget <worktree> $env:TEMP\community-08-clone
docker run --rm -v "$env:TEMP\community-08-clone:/app" -w /app node:24 bash -lc "npm ci && npx vitest run"
```

```text
 Test Files  26 passed (26)
      Tests  261 passed | 2 skipped (263)
   Start at  16:23:27
   Duration  55.16s (environment 60%, setup 19%, import 13%, tests 7%, transform 1%, worker 1%)
```

Read: the two skipped tests are the ones of `tests/design-system.test.ts` that compare the tokens and the flame with
the stylesheet of Construye, which lives outside this repository; inside the container that source is not reachable, so
`it.skipIf(sourceReachable === false)` skips them. It is the behaviour of the test and not a failure. Node in the
container: `v24.21.0`, against `v24.11.0` on Windows.

## 5.3 `npm run typecheck`

Windows:

```text
> cited@0.1.0 typecheck
> next typegen && tsc --noEmit

Generating route types...
✓ Types generated successfully
```

Inside the container the same tree passes the type check of the production build, which is the stricter one:

```text
✓ Compiled successfully in 13.2s
  Running TypeScript ...
  Finished TypeScript in 19.0s ...
```

## 5.4 `npm run lint`

```text
> cited@0.1.0 lint
> eslint .

```

Exit 0 on Windows and exit 0 inside the container, with no finding and no warning.

## 5.5 `npm run build` in the container

```text
✓ Generating static pages using 7 workers (6/6) in 11.2s

Route (app)
┌ ƒ /
├ ƒ /_not-found
├ ƒ /api/ask
├ ƒ /embed
└ ƒ /kit

ƒ Proxy (Middleware)
```

Read: the production build completes, the proxy is wired to the two public documents and every route is rendered on
demand, which is what reading the cookie of the language and the settings of the business costs (decision of step 3.2,
number 4).

## 5.6 `npm audit --audit-level=high`

```text
> cited@0.1.0 audit:high
> npm audit --audit-level=high

found 0 vulnerabilities
```

## 5.7 gitleaks

```powershell
npm run secrets:scan
```

```text
> cited@0.1.0 secrets:scan
> gitleaks git --redact --no-banner

10:14AM INF 223 commits scanned.
10:14AM INF scanned ~2491450 bytes (2.49 MB) in 2.46s
10:14AM INF no leaks found
```

## 5.8 `openspec validate --all --strict`

```text
✓ change/public-page-and-widget
✓ spec/repository-bootstrap
✓ spec/supply-chain-security
Totals: 9 passed, 0 failed (9 items)
```

## 5.9 `git diff --check main...HEAD`

```powershell
git diff --check main...HEAD
```

The first run reported one finding, `reports/2026-09-29-step-2-tests-first.md:165: new blank line at EOF.`, and the same
commit that fixed it pinned the real hash of the commit of step 2 in that report (commit `0c97c0b`). The run after it:

```text
exit: 0
```

## 5.10 The size of `public/widget.js`

```powershell
(Get-Item public\widget.js).Length
```

```text
public/widget.js: 2175 bytes (2.12 KiB), limit 5120
```

## What the checks do not prove

The `secrets:scan` of gitleaks runs over the git history of this worktree; CodeQL is the business of the pipeline and
was not run here. Neither is written as verified.

## Commit

The commit of this step is the one that carries this report.

# Step 5 - Run the checks

- Date: 2026-09-29
- Change: `cited-identity-and-readme`
- Branch: `feature/cited-identity-and-readme`
- Agent: `deepseek-harness`
- Commit verified against: `7ce6c5e`, tree clean
- Report of task 5.1: `npm test` on Windows and in a `node:24` Linux container, `npm run typecheck`, `npm run lint`,
  `npm audit --audit-level=high`, gitleaks, `openspec validate --all --strict`, `git diff --check main...HEAD`, and the
  total weight of `docs/images/`.

## Windows 11, Node `v24.11.0`, npm `11.6.1`

| Command | Result |
|---|---|
| `npm test` | 11 files passed, 101 tests passed, 8.77 s |
| `npm run typecheck` | exit 0, `✓ Types generated successfully` |
| `npm run lint` | exit 0, no warning and no error |
| `npm run build` | exit 0, Turbopack, 3 static pages |
| `npm audit --audit-level=high` | `found 0 vulnerabilities` |
| `npm run secrets:scan` (gitleaks 8.30.1) | 77 commits scanned, `no leaks found` |
| `openspec validate --all --strict` | 5 passed, 0 failed |
| `git diff --check main...HEAD` | exit 0 (no whitespace error, no conflict marker) |
| `git ls-files --eol` | no `crlf`, no `mixed`, no `bom` |

```
> npm test

 Test Files  11 passed (11)
      Tests  101 passed (101)
   Duration  8.77s (environment 50%, tests 25%, setup 16%, import 4%, transform 4%)

> npm run typecheck
> next typegen && tsc --noEmit
Generating route types...
✓ Types generated successfully
typecheck exit: 0

> npm run lint
> eslint .
lint exit: 0

> npm run build
▲ Next.js 16.3.6 (Turbopack)
✓ Compiled successfully in 485ms
  Generating static pages using 4 workers (3/3) in 556ms
Route (app)
┌ ○ /
└ ○ /_not-found
build exit: 0

> npm audit --audit-level=high
found 0 vulnerabilities
audit exit: 0

> npm run secrets:scan
77 commits scanned.
scanned ~1375986 bytes (1.38 MB) in 604ms
no leaks found
secrets exit: 0

> openspec validate --all --strict
- Validating...
✓ spec/app-skeleton
✓ change/cited-identity-and-readme
✓ spec/knowledge-search
✓ spec/repository-bootstrap
✓ spec/supply-chain-security
Totals: 5 passed, 0 failed (5 items)
openspec exit: 0

> git diff --check main...HEAD
diff check exit: 0

> git ls-files --eol | Select-String -Pattern 'crlf|mixed|bom'
(no output)
```

## The weight of `docs/images/`

```
> Get-ChildItem docs/images -File | Measure-Object -Property Length -Sum
Count    : 21
Sum      : 466547
MB       : 0.445
```

Twenty-one files: the two banners, the seven graphics in two themes, the social preview, the two logos, and the two
JSON records. The budget of the spec is 3 MB for the images of the README, and the README uses 18 of the PNG files;
**the whole set is 0.445 MB**.

## `node:24` Linux container, Node `v24.21.0`, npm `11.19.0`

A clean tree was built with `git checkout-index --all` from the closing commit, outside the repository, and turned into
a real git repository inside the container so that `git ls-files` answers like it does on a checkout:

```
=== environment ===
v24.21.0
11.19.0
git version 2.39.5

=== git repository of the clean tree ===
249 tracked files
3 symbolic links
```

`npm ci` needs the registry, so it ran first with the network and then the whole battery ran with `--network none`:

```
=== npm ci (with the network, for the lock file) ===
ci exit: 0

=== npm test with the network off ===
 Test Files  11 passed (11)
      Tests  101 passed (101)
   Duration  20.98s

=== npm run typecheck ===
✓ Types generated successfully
typecheck exit: 0

=== npm run lint ===
lint exit: 0

=== npm run build ===
Route (app)
┌ ○ /
└ ○ /_not-found
build exit: 0

=== the graphics of the tree ===
500K	docs/images
```

`openspec` is not a dependency of this repository: the pipeline installs it with
`npx --yes @fission-ai/openspec@1.1.1`, which needs the registry. It ran in the container with the network, on the same
tree:

```
> npx --yes @fission-ai/openspec@1.1.1 validate --all --strict
✓ change/cited-identity-and-readme
✓ spec/knowledge-search
✓ spec/repository-bootstrap
✓ spec/supply-chain-security
Totals: 5 passed, 0 failed (5 items)
```

## The defect this step found, and its fix

The first Linux run was red with three failures, all of them in `tests/readme.test.ts`:

```
FAIL tests/readme.test.ts > README, the banner > records the brand tokens and the font
Error: EISDIR: illegal operation on a directory, read
 ❯ trackedFiles tests/readme.test.ts:117:19
```

**The cause is real and it is Linux only.** `git ls-files` lists the three agent links (`.claude/agents`,
`.codex/agents` and `.cursor/agents`) because they are tracked, and on Linux a Git symbolic link is a symbolic link to a
directory: `readFileSync` of that path is `EISDIR`. On Windows the checkout has `core.symlinks=false`, so the same
paths are plain text files that hold the target and the read succeeds. The test was passing on the machine it was
written on and would have failed in the pipeline.

The fix, in commit `7ce6c5e`: the reader asks `lstatSync` whether the tracked path is a regular file, and only then
reads it. A path that is not a regular file is treated as having no text, which is what the scan wants. The three
failures are green on both platforms:

```
> npx vitest run   (Windows)
 Test Files  11 passed (11)
      Tests  101 passed (101)

> npx vitest run   (node:24 container, --network none)
 Test Files  11 passed (11)
      Tests  101 passed (101)
```

The pre-existing `tests/personal-paths.test.ts` already knew about this difference (it reads the mode of every tracked
path from `git ls-files -s` instead of trusting the working tree); the new test had to learn it too.

## Dependency review

`npm ci` reports `found 0 vulnerabilities` on Windows and the audit is green. This change adds **no dependency**: the
two render scripts use `@playwright/test` and `sharp`, both already in the locked tree (`sharp` arrives with `next`),
and the only weight it adds to the repository is the PNGs and the JSON records of `docs/images/`.

The only change to the lock file is its own package name, with no dependency added, removed or moved:

```
> git diff main...HEAD -- package-lock.json
@@ -1,11 +1,11 @@
 {
-  "name": "katalis-responde-community",
+  "name": "cited",
   "version": "0.1.0",
   "lockfileVersion": 3,
   "requires": true,
   "packages": {
     "": {
-      "name": "katalis-responde-community",
+      "name": "cited",
```

`npm ci` installs 609 packages from that lock file on Windows and the same tree on Linux, and both suites pass on top
of it.

## Verdict

PASS. Every command of task 5.1 is green on Windows and on `node:24` Linux, the images of the README weigh 0.445 MB
against a budget of 3 MB, and the one Linux-only defect this step found is fixed and verified on both platforms.

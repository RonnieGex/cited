# Step 5 — the checks

- Date: 2026-09-29
- Change: `elevenlabs-voice-agent` (OpenSpec)
- Branch: `feature/elevenlabs-voice-agent`
- Agent: deepseek-harness
- Task: 5.1
- Verified against: `30d8008`, over the change of `5d35aca` and `b57ffca`

## What the task asks

`npm test` on Windows and in a `node:24` Linux container, `npm run typecheck`, `npm run lint`,
`npm audit --audit-level=high`, gitleaks, `openspec validate --all --strict`, `git diff --check main...HEAD`, the build
guard in both build orders.

## Commands and real output

### `npm test`, on Windows

```
$ npm test

 Test Files  46 passed (46)
      Tests  429 passed (429)
   Start at  13:34:03
   Duration  15.25s (tests 51%, environment 32%, setup 8%, import 6%, transform 3%, worker 1%)
```

The base was 38 files and 348 tests; this change adds the eight voice files and 81 tests.

### `npm test`, in a `node:24` Linux container

```
$ docker run --rm -v <the repository>:/src:ro -w /tmp node:24 bash -lc \
    "git clone -q --no-hardlinks /src app && cd app && npm ci --no-audit --no-fund && npm test"

30d8008 Keep the optional packages of other platforms in the lock and leave the compiler cache out of the guard
v24.21.0

 Test Files  46 passed (46)
      Tests  427 passed | 2 skipped (429)
   Start at  19:42:41
   Duration  12.11s (tests 38%, environment 32%, import 11%, transform 9%, setup 9%, worker 1%)
```

The clone is the point: `tests/readme.test.ts` and `tests/personal-paths.test.ts` read `git ls-files` and the symbolic
link `.claude/agents`, so a copy without a repository, or a checkout made by Windows git, is not the tree those tests
verify. The two skipped tests are the ones the previous lane also recorded in the container.

### The lock file, a finding of this step

The `node:24` container refused to install the tree of the previous commit:

```
npm error `npm ci` can only install packages when your package.json and package-lock.json or npm-shrinkwrap.json are
npm error in sync.
npm error Missing: @emnapi/runtime@1.11.3 from lock file
npm error Missing: @emnapi/core@1.11.3 from lock file
npm error Missing: @emnapi/wasi-threads@1.2.3 from lock file
```

`npm install` on Windows had pruned three optional wasm packages that only belong on other platforms, so the lock that
`npm ci` needs on Linux was incomplete. The lock was regenerated inside `node:24` with
`npm install --package-lock-only`, and the diff was read before it was kept: 88 insertions and 22 deletions, all of
them the three missing `@emnapi` entries and the `peer` bookkeeping of npm, with no version of any dependency changed.
`npm ci` now installs from that lock on both platforms: 693 packages on Windows (0 vulnerabilities) and a green suite
in the container. That fix is `30d8008`.

### `npm run typecheck` and `npm run lint`

```
$ npm run typecheck

> cited@0.1.0 typecheck
> next typegen && tsc --noEmit

Generating route types...
✓ Types generated successfully

$ npm run lint

> cited@0.1.0 lint
> eslint .

(no diagnostic in either)
```

### `npm audit --audit-level=high`

```
$ npm run audit:high

> cited@0.1.0 audit:high
> npm audit --audit-level=high

found 0 vulnerabilities
```

The four packages of the port added 187 entries to the tree and no advisory.

### gitleaks

```
$ npm run secrets:scan

> cited@0.1.0 secrets:scan
> gitleaks git --redact --no-banner

1:43PM INF 290 commits scanned.
1:43PM INF scanned ~3251090 bytes (3.25 MB) in 2s
1:43PM INF no leaks found
```

290 commits, no leak. The change carries no key: the fake of the tests is a literal string of a test, every real
credential lives in the environment of the server, and `.env.example` keeps every value empty.

### `openspec validate --all --strict`

```
$ npm run openspec:validate
Totals: 11 passed, 0 failed (11 items)
```

### `git diff --check main...HEAD`

```
$ git diff --check main...HEAD
(no line)
exit: 0
```

No whitespace error and no conflict marker in the ten commits of the branch.

### The build guard, in both orders

```
$ npm run build:e2e
verify-no-test-sdk: mode=test-build roots=.next, .next\static, .next\server
OK: the test SDK is in the browser output (1 file(s)) and the real package is not.

$ npm run build
(the route table of a production build)

$ npm run verify:no-test-sdk
verify-no-test-sdk: mode=production roots=.next, .next\static, .next\server
OK: no marker of the test SDK in the output; the real package is in 1 file(s).
```

The last two commands are the scenario "A production build" of the spec, in that order: an end-to-end build first and a
production build after it, and the production output carries no marker of the test SDK.

The first run of that scenario failed, and the failure is what shaped the guard: Turbopack keeps its compiler scratch
space in `.next/cache`, and the `.sst` files of the end-to-end build still held `__katalisVoiceFake`. The scratch
space is not output — `npm run build` rewrites it and no browser can fetch it — so the guard reads the emitted output,
`.next/static` and `.next/server`, and leaves `.next/cache` out on purpose. The reason is written in the header of
`scripts/verify-no-test-sdk.mjs`, and `tests/voice-build-guard.test.ts` pins both halves of the decision: a marker in
the server output fails a production build, and a marker in the scratch space of the compiler does not.

## Verdict

Task 5.1 is done: the suite is green on Windows and in a `node:24` container from a clone, the four static checks are
clean, the audit finds nothing, gitleaks scans the whole history without a leak, and the guard of the test SDK passes
in both build orders.

## The issues this step leaves open

- The lock file was incomplete for Linux after the Windows install of the four new packages. It is fixed and verified
  in both platforms, and the fix is one commit of its own.
- Node of this machine is `v24.11.0` and the project asks for `>=24.15.0`: npm prints `EBADENGINE` warnings on every
  install. The container runs `v24.21.0` and prints none. It is a property of the machine, not of this change.

## Commit

The report travels in the commit that closes step 5.

# Step 5 · the checks

Contract: `openspec/changes/brand-and-design-system/tasks.md`, task 5.1.
Agent: deepseek-harness. Date: 2026-09-29.

Every command runs in the worktree `katalis-dev/community-ui`, quoted below as the working directory `.`; the absolute
path of the machine is never written to a tracked file.

## `npm test` on Windows

```
$ npm test
> cited@0.1.0 test
> vitest run

 Test Files  12 passed (12)
      Tests  131 passed (131)
   Duration  11.05s
exit=0
```

## `npm test` in a `node:24` Linux container

The worktree is copied into the container without `node_modules`, the three symbolic links of `ai-specs` are put back
(Windows checks the repository out with `core.symlinks=false`, so they are plain files on disk), a git repository is
created so that the tests that list tracked files have something to list, and the suite runs:

```
$ docker run --rm -v <the worktree>:/src:ro node:24 bash -c "tar -C /src --exclude=node_modules ... && cd /work && git init -q && git add -A && git commit -qm base && npm ci && npm test"

3                                  # the symbolic links git tracks
v24.21.0                           # the Node of the image, over the floor of engines
11.19.0                            # its npm
added 610 packages                 # npm ci, exit 0

 ✓ libSQL native vectors (6)
 ✓ tests/ingest.test.ts (11 tests)
 ✓ tests/search.test.ts (10 tests)

 Test Files  12 passed (12)
      Tests  129 passed | 2 skipped (131)
   Duration  4.99s
exit=0
```

The two skipped tests are the ones that compare the flame with the files of Construye: they skip themselves when the
source repository is not on the machine, which is the case inside the container. Nothing else changes with the
platform.

### The lock file this step found and repaired

`npm ci` failed in the container with `EUSAGE` and `Missing: @emnapi/runtime@1.11.3 from lock file`. The cause was
not the container: the `npm install --save-dev @axe-core/playwright` of step 2.2, run with npm 11.6.1 on Windows,
pruned the optional dependencies of the other platforms out of `package-lock.json` (33 insertions and 87 deletions,
most of them `@emnapi/*`, `@img/*` and `@next/swc-*`). The lock of the base is complete for every platform, so the
repair was to start from it and add only what the new development dependency needs:

```
$ node <.patch-lock.mjs>
wrote 617 packages, 9 of @emnapi, 18 of win32, 66 of linux
the lock carries "4.13.0" for "^4.13.0"

$ git diff --stat aa52b7c -- package-lock.json
 package-lock.json | 23 +++++++++++++++++++++--   (before the sort of the keys)
```

`npm ci` then answers `added 610 packages`, exit 0, on Windows, and the container above is the proof for Linux. The
repository's pipeline runs `npm ci` on `ubuntu-latest`, so without this repair the change would have broken CI on the
push, not in a test.

## The luminance tests of the graphics

```
$ npx vitest run tests/readme.test.ts -t "luminance" --silent=false
The luminance of every PNG of docs/images:
demo-dark.png luminance 0.169 transparent 0.000
demo-light.png luminance 0.493 transparent 0.000
how-it-works-dark.png luminance 0.151 transparent 0.000
how-it-works-light.png luminance 0.937 transparent 0.000
readme-banner-dark.png luminance 0.162 transparent 0.000
readme-banner-light.png luminance 0.922 transparent 0.000
reason-citations-dark.png luminance 0.252 transparent 0.000
reason-citations-light.png luminance 0.908 transparent 0.000
reason-sources-dark.png luminance 0.243 transparent 0.000
reason-sources-light.png luminance 0.913 transparent 0.000
reason-voice-dark.png luminance 0.209 transparent 0.000
reason-voice-light.png luminance 0.948 transparent 0.000
roadmap-dark.png luminance 0.161 transparent 0.000
roadmap-light.png luminance 0.935 transparent 0.000
social-preview.png luminance 0.152 transparent 0.000
voice-teaser-dark.png luminance 0.161 transparent 0.000
voice-teaser-light.png luminance 0.920 transparent 0.000
The transparency of the flame: public/brand/katalis-flame-192.png 0.721, public/brand/katalis-flame-ink-192.png 0.748
      Tests  1 passed | 41 skipped (42)
```

Every dark canvas stays at 0.30 or under, every light one at 0.80 or over, the one exemption is the demo of the dark
terminal and its terminal area is measured on its own (0.148 of 0.30, printed by the render), and the mark of the
maker is transparent on both grounds (0.721 and 0.748 of the pixels are not fully opaque, far over the 0.05 the test
asks for).

The ink variant of the flame is measured in the same run of this step:

```
$ npx vitest run tests/design-system.test.ts -t "shading" --silent=false
64 px ink: 1692 opaque, 1692 neutral, 0 lighter than the ink, alpha error 2.25 of 255, tone error 0.41 of 23, 100.0% of the tone within 8
192 px ink: 12508 opaque, 12508 neutral, 0 lighter than the ink, alpha error 2.82 of 255, tone error 0.22 of 23, 100.0% of the tone within 8
      Tests  1 passed | 16 skipped (17)
```

## The rest of the battery

```
$ npm run typecheck
> next typegen && tsc --noEmit
✓ Types generated successfully
exit=0

$ npm run lint
> eslint .
exit=0

$ npm audit --audit-level=high
found 0 vulnerabilities
exit=0

$ npm run secrets:scan
8:31AM INF 152 commits scanned.
8:31AM INF scanned ~1893169 bytes (1.89 MB) in 1.72s
8:31AM INF no leaks found
exit=0

$ openspec validate --all --strict
Totals: 7 passed, 0 failed (7 items)
exit=0

$ git status --short --branch
## feature/brand-and-design-system
```

### `git diff --check main...HEAD`

```
$ git diff --check main...HEAD
public/fonts/outfit/OFL.txt:21: trailing whitespace.
+fonts, including any derivative works, can be bundled, embedded,
exit=2
```

One line, and it is expected: `public/fonts/outfit/OFL.txt` is the license of Outfit copied **byte for byte** from
the official Google Fonts repository, and the official file has one line with a trailing space. Trimming it would
change the license file and break the SHA-256 recorded in `docs/design-system.md` and checked by a test. The file is
left as its author wrote it; the two blank lines at the end of files this round created were the implementer's and
were removed in `5a5f6bb`.

## Commits of this task

- `d778f30` the repair of `package-lock.json`, found by the `npm ci` of the container.
- `87192c8` the machine path out of the report of step 4 and the trailing blank lines out of two files; this report
  travels in the commit that follows it.

## Files

- `package-lock.json` (the optional dependencies of every platform are back).
- `reports/2026-09-29-step-5-checks.md` (this file).

# Step 10.0: merge `main` (d71220d) into the branch

Implementer: Sonnet 5.5. Date: 2026-09-29. Worktree `community-ui` (`<worktree>` below), Windows 11. Task 10.0 of the
amendment, design decision 20: the behaviour of `main` wins inside the new look.

## Before the merge

```
$ git rev-parse --short HEAD main
5602ee2                      # the contract amendment, HEAD of the branch at the start of the round
d71220d                      # main, not pushed: the keys in the panel and the voice agent
$ git log --oneline c07640b..main | wc -l
86
```

Leftovers of the worktree, each looked at with `git diff`:

| File | What `git diff` showed | Decision |
|---|---|---|
| `tests/admin-ui.test.tsx` | `git diff --ignore-cr-at-eol --stat` printed nothing and `git diff` was empty: only the stat cache and the line endings differed | `git checkout -- tests/admin-ui.test.tsx` |
| `LOOP_STATE.md` | stale text of the previous round | rewritten for this round (`STATUS: RUNNING`, `CHANGE`, `BRANCH`, `BASE`, `AGENT Sonnet 5.5`) and committed in `6e67d9b` |
| `.vitest/` | a reporter output of vitest, untracked | left out of every commit; the ignore rule is in 10.2 (minor 68) |

## The merge

```
$ git merge --no-commit --no-ff main
CONFLICT (content): Merge conflict in LOOP_STATE.md
CONFLICT (content): Merge conflict in app/embed/page.tsx
CONFLICT (content): Merge conflict in app/page.tsx
CONFLICT (content): Merge conflict in components/admin/AdminNav.tsx
CONFLICT (content): Merge conflict in lib/i18n/public.ts
CONFLICT (content): Merge conflict in playwright.config.ts
Automatic merge failed; fix conflicts and then commit the result.
```

Six files, eight hunks (the review announced six hunks; `LOOP_STATE.md` adds two). Every hunk was read and resolved by
hand; no whole file was taken with `--ours` or `--theirs`.

| File and hunk | Ours (the identity) | Theirs (`main`) | Resolution |
|---|---|---|---|
| `LOOP_STATE.md`, header | state of this round | state of `provider-keys-in-panel` | kept this round: `main`'s file records another change |
| `LOOP_STATE.md`, objective and progress | section 10 of this change | section 12 of the keys change | kept this round, for the same reason |
| `app/page.tsx`, imports and header comment | `LanguageSwitch`, no `Panel`, no voice | `Panel`, `VoiceLauncher`, `PRODUCT_NAME`, `chatProblem`, `resolveChat`, `dynamic = "force-dynamic"` | both: the imports of both sides (without `PRODUCT_NAME`, which the band no longer prints), the comment of both and `export const dynamic = "force-dynamic"` |
| `app/page.tsx`, the body of the column | the `Chat` in the 880 px column | the not-ready `Panel` when `chatProblem(chat)` is not `null`, the `VoiceLauncher`, the footer | `main`'s behaviour inside our column: `Chat` or the not-ready `Panel` (`data-cited="not-ready"`, body in `text-ink-2`), then the `VoiceLauncher`; the footer stays ours, outside the column |
| `app/embed/page.tsx`, imports | `LanguageSwitch` | `VoiceLauncher` | both; the launcher goes under the `Chat` in a `mt-6` wrapper |
| `components/admin/AdminNav.tsx`, the return | the ink `aside` with the numbered list | a plain `nav` with `navAi` second | ours, plus `main`'s link as a numbered section: `/admin/ai` "AI and keys" is the fifth, so Documents stays number 3 as the spec scenario reads |
| `lib/i18n/public.ts`, Spanish footer | `Hecho por Katalis` (decision 18) | `Built by Katalis` and the three `notReady*` strings | `Hecho por Katalis` and `main`'s `notReady*` strings |
| `playwright.config.ts`, `testIgnore` of the public project | ignores `admin.spec.ts` and `admin-brand.spec.ts` | ignores `admin.spec.ts`, `providers.spec.ts`, `affiliate.spec.ts` | the union of the four |

Files that merged without a conflict but were read for meaning: `app/admin/layout.tsx` (the AuthShell of this change with
the owner's words of `main` for the unfinished installation: correct), `app/admin/business/page.tsx` (it reads the voice
agent from the store and wears the workspace through the layout), `app/admin/ai/page.tsx` (new, inside the layout, so it
wears the workspace), `lib/i18n/admin.ts` (`navAi`, `aiTitle` and the panel words added beside our `tagline`).

## What the merged tree needed beyond the conflicts

`npm test` on the merged working tree, before any adaptation:

```
$ npx -y -p node@24 -- node -v
v24.21.0
$ npx -y -p node@24 -- npm test
 Test Files  5 failed | 69 passed (74)
      Tests  6 failed | 778 passed (784)
```

The five files and why each failed, and what was done (all in the merge commit, listed in its message):

| Failing test | Cause | Adaptation |
|---|---|---|
| `tests/brand-static.test.ts` "has no colored side stripe" | `main` ships `border-l-2 border-coral pl-4` in `components/voice/VoicePanel.tsx` (once) and `components/admin/VoiceAgent.tsx` (twice) | the three errors wear the coral `Marker` square of decision 10 beside the text (`data-testid` kept on the `p`) |
| `tests/brand-panel.test.tsx` "lists the four sections" | the navigation has five sections now | expects `/admin/ai` and `navAi` as the fifth, Documents still 3 |
| `tests/brand-panel.test.tsx` "names what the server needs" | asserted `ADMIN_PASSWORD, ADMIN_SESSION_SECRET` on screen; `main` (finding M-1 of its review) removed every variable name from the panel | asserts the words of the owner (`panelNotConfigured`) and that no variable name is on the page |
| `tests/brand-panel.test.tsx` "titles every page" | the mock store had no `readVoiceAgent`, which the Business page of `main` calls | the mock gains `readVoiceAgent: async () => null` |
| `tests/brand-public.test.tsx` (two tests) | `Home` of `main` asks `resolveChat`, which read a real store: the page was "not ready" and had no question box | the mock of `@/lib/settings/providers.ts` that `tests/public-page.test.tsx` already uses |
| `tests/voice-minute-cap.test.ts`, `tests/voice-store-state.test.ts` | file-level failure, all 11 tests inside passed: `rmSync` of the temporary store raised `EPERM` because libsql frees its file late on Windows (a plain script reproduces it on Node 24.11.0 and on 24.21.0: `removed` fails right after `client.close()`) | the removal retries ten times like `tests/store.test.ts` and `tests/provider-settings.test.ts` do |

Three tests were added to `tests/brand-public.test.tsx` for the decision itself: the voice launcher under the chat on `/`
and on `/embed`, the not-ready state under the band with the way to the panel and no question box, and
`export const dynamic = "force-dynamic"` in `app/page.tsx`. `e2e/admin-brand.spec.ts` expects five sections (the browser
run is task 10.5).

## `npm ci` on the merged tree, and one incident to record

`main` added dependencies (`@elevenlabs/react`, `three`, `@react-three/*`, `@alexanderolsen/libsamplerate-js`), so
`package-lock.json` changed by the merge and `npm ci` was required.

```
$ npm ci
npm error [Error: EPERM: operation not permitted, unlink '<worktree>\node_modules\lightningcss-win32-x64-msvc\lightningcss.win32-x64-msvc.node']
```

Cause: a `next dev -p 3300` of this same worktree, started before this round by the review lane (not by me), holds three
native files open. The first `npm ci` had already emptied part of `node_modules` when it failed, and for a few minutes
that dev server answered 500 from the half-removed tree. Repair, without stopping anybody's process: a Windows file that
is loaded can be renamed but not deleted, so each locked native file (`lightningcss`, `@next/swc`, `@tailwindcss/oxide`)
was moved out of the tree with `mv` and `npm ci` was run again, which installed fresh copies:

```
$ npm ci      # third attempt, after moving the three locked files aside
exit 0        # 439 entries in node_modules
$ curl -s -o /dev/null -w "%{http_code}" http://localhost:3300/
200           # the dev server of the review lane answers again
```

`package-lock.json` is the merged one and `npm ci` did not change it (`git status` shows no new modification). The clean
install from nothing is proven by the Linux container run of task 10.3.

## Checks on the merged tree

```
$ npx -y -p node@24 -- node -v
v24.21.0
$ npx -y -p node@24 -- npm test
 Test Files  74 passed (74)
      Tests  787 passed (787)
$ npx -y -p node@24 -- npm run typecheck
exit 0 (next typegen && tsc --noEmit)
$ npx -y -p node@24 -- npm run lint
exit 0, 0 errors, 1 warning (a script of a reviewer, ignored by git, in .data/verify-engineering/focus.mjs)
$ gitleaks protect --staged --no-banner
no leaks found
```

Commit of the merge: `ca6b1d8`, parents `6e67d9b` (this branch) and `d71220d` (`main`), one merge commit.

## Issues

- **RISK**: `next dev -p 3300` of the review lane keeps running from this worktree and holds old copies of three native
  files (now in the scratchpad of this session). It serves the tree of before the merge until it is restarted; the
  captures and the E2E of this round do not use it.
- **RISK**: the lint warning is in `.data/verify-engineering/focus.mjs`, a reviewer's script under the ignored `.data/`
  folder; it is not versioned and the code of the change has no warning.
- **UNKNOWN**: whether the `EPERM` of the two voice tests is only a Windows and libsql timing matter (the probe says so)
  or also shows on a machine where `main` was green; the retry makes the suite independent of it.

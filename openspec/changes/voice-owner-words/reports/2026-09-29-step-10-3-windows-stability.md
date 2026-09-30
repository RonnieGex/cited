# Step 10.3: the suite is stable on Windows

- Date: 2026-09-29
- Change: `voice-owner-words`
- Branch: `feature/voice-owner-words`
- Agent: deepseek-harness
- Commit verified: `027ffbc` (the amendment of the contract, the last commit before this report)
- Task: 10.3 (design decision 9)

## The red, before the fix

The review of Codex reproduced it, and it reproduced again on this machine over the tree of `027ffbc` with
`npx -y -p node@24 node node_modules/vitest/vitest.mjs run tests/voice-minute-cap.test.ts`:

```
 RUN  v5.0.2 C:/Users/Franc/Documents/katalis-dev/community-ins

 ❯ tests/voice-minute-cap.test.ts (9 tests) 2432ms

 Test Files  1 failed (1)
      Tests  9 passed (9)
   Start at  19:45:11
   Duration  3.24s (tests 79%, setup 10%, import 5%, transform 5%)

⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
 FAIL  tests/voice-minute-cap.test.ts [ tests/voice-minute-cap.test.ts ]
Error: EPERM, Permission denied: \\?\C:\Users\Franc\AppData\Local\Temp\katalis-voice-cap-mrffau
 ❯ tests/voice-minute-cap.test.ts:120:5
    118|   for (const root of roots) {
    119|     await new Promise((wake) => setTimeout(wake, 100));
    120|     rmSync(root, { recursive: true, force: true, maxRetries: 5, retryD…
       |     ^
    121|   }
    122| });
exit=1
```

The nine assertions passed and the file was red anyway: the `EPERM` of the `afterAll` fails the suite. The same pattern
existed in a second file, which no report of the round had visited:

```
$ npx -y -p node@24 node node_modules/vitest/vitest.mjs run tests/voice-store-state.test.ts tests/store-state.test.ts
  tests/store-remote.test.ts tests/provider-address-pinning.test.ts tests/personal-paths.test.ts
  tests/voice-build-guard.test.ts

 ❯ tests/voice-store-state.test.ts (2 tests) 2453ms

 Test Files  1 failed | 5 passed (6)
      Tests  33 passed (33)
   Start at  19:49:05
   Duration  11.30s
⎯⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
 FAIL  tests/voice-store-state.test.ts [ tests/voice-store-state.test.ts ]
Error: EPERM, Permission denied: \\?\C:\Users\Franc\AppData\Local\Temp\katalis-voice-state-before-VmFbLd
 ❯ tests/voice-store-state.test.ts:53:5
exit=1
```

## Why the folder is held

A throwaway probe (never committed, deleted after the measurement) opened and closed stores in folders of `%TEMP%` and
tried to remove each one in a loop until it worked. Every folder that held a real local libsql store stayed locked for
sixteen to nineteen seconds after `client.close()`; a folder with no store, or with a plain file, was removable at once:

| The folder | When the removal worked |
| --- | --- |
| `mkdtempSync` and nothing else | 1 ms |
| `mkdtempSync` and a 200 KB file written by the test | 2 ms |
| `openStore(path)` + `close()` | 18862 ms |
| `createClient({url: "file:…"})` + `execute()` + `close()` | 18862 ms |
| `unlinkSync` of the `store.sqlite` alone, after `close()` | 15864 ms |

It is not the code of the store: the handle of the native libsql file survives `close()` for that long on this Windows,
and `rmSync` with `maxRetries: 5, retryDelay: 100` only retries for about 1.5 s. `tests/voice-minute-cap.test.ts` and
`tests/voice-store-state.test.ts` were the only two files of the repository that let that error reach the suite: the
other fifteen files that remove a folder holding a store already wrapped the same `rmSync` in a loop of up to ten
attempts with a 200 ms pause (`tests/store.test.ts`, `tests/voice-signed-url.test.ts`, `tests/admin-helpers.ts` and the
rest), `tests/store-state.test.ts` opens its file with `node:sqlite`, and `tests/store-remote.test.ts` mocks
`@libsql/client`, so no real file is held there.

## The fix

Both files close the store first (`afterAll` closes the shared stores before it removes anything) and then remove the
folder with the call of every other file of the suite, retried until the filter of the system lets it go:

```ts
async function removeLater(root: string): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });

      return;
    } catch {
      await new Promise((wake) => setTimeout(wake, 200));
    }
  }
}
```

No test of the voice cap changed its folders: every test already used its own `mkdtempSync`, as decision 9 asks.

## The green

```
$ npx -y -p node@24 node node_modules/vitest/vitest.mjs run tests/voice-minute-cap.test.ts tests/voice-store-state.test.ts
 Test Files  2 passed (2)
      Tests  11 passed (11)
   Duration  19.47s
exit=0
```

The file that used to fail now waits for the lock and removes its folders; the wait is the nineteen seconds of the
table above, and it is paid once per file.

`npm test` twice in a row on Windows, with the Node 24.21.0 of `npx -y -p node@24`:

```
$ npx -y -p node@24 -c "npm test"        # run 1
 Test Files  69 passed (69)
      Tests  599 passed (599)
   Duration  51.71s
run1 exit=0

$ npx -y -p node@24 -c "npm test"        # run 2
 Test Files  69 passed (69)
      Tests  599 passed (599)
   Duration  44.72s
run2 exit=0

$ npx -y -p node@24 node -v
v24.21.0
```

## The `node:24` Linux container

A clone of the branch was made in a temporary directory with `git clone --branch feature/voice-owner-words` (four tests
of the repository ask `git ls-files`), the two fixed files were copied over it, and it was mounted at `/app`:

```
$ docker run --rm -v <the clone>:/app -w /app node:24 sh -c 'node --version && git --version && npm test; echo test-exit=$?'
v24.21.0
git version 2.39.5
 Test Files  69 passed (69)
      Tests  597 passed | 2 skipped (599)
   Duration  161.22s
test-exit=0
```

The two skipped ones are the two of `tests/design-system.test.ts` that were already skipped on Linux. A previous
attempt of the same command, run while the machine was busy with the Windows passes, failed with three forks workers
that timed out at startup and the 20 s timeout of `tests/readme.test.ts`; the clean run above is the one of this report,
and the flake is left said because it happened.

## Verdict

Task 10.3 is done: the `EPERM` is answered in the two files that suffered it, the removal is the one of the rest of the
suite with a pause long enough for the lock of Windows, `npm test` passes twice in a row on Windows with Node 24.21.0
(69 files, 599 tests each time) and once in the `node:24` Linux container (69 files, 597 passed and the 2 skipped of
Linux).

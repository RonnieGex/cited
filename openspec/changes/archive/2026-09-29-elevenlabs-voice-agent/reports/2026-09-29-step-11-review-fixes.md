# Step 11 — what the second review of Codex reproduced

- Date: 2026-09-29
- Change: `elevenlabs-voice-agent` (OpenSpec)
- Branch: `feature/elevenlabs-voice-agent`
- Agent: deepseek-harness
- Contract: section 11 of `tasks.md`, amended by Fable after `katalis-dev/tasks/revision-community-09b.md` (two Major)
- The sections 0 to 10 of the contract are untouched: this report only answers the two Major the review reproduced, and
  the battery of the round. Every command below ran from the root of the worktree; no path of a personal machine is
  written here.

Tests first, red before each fix. No test, script or command of this round called ElevenLabs or a model provider: the
double of the API, the test SDK and the `fake` providers run everything, and no `.env` was opened (the repository has
none: `Test-Path .env` is `False`).

## 11.1 The cap is checked before the configuration

**Task.** Major of the review: with `ELEVENLABS_API_KEY` empty and `DAILY_VOICE_MINUTE_LIMIT=1..4`, the route answered
`503 unconfigured` before it ever looked at the cupo, so the `429` of the requirement "The cap is checked before the
configuration" never arrived and the client could not tell a voice switched off by the cap from a missing key. The
requirement asks the cap of the day to be answered before the configuration is read, with a cap below the five minutes
of one session answering `429` whether or not the key and the agent exist.

**The red, before the fix.** `tests/voice-minute-cap.test.ts` gained the describe "the cap of the day is answered
before the configuration": the battery of the review for the limits 1 to 4 with an empty key, the same cap with the key
set and no agent anywhere, and — so the fix cannot over-rotate — a limit of 5 with an empty key, which must keep
answering `503` naming the variable. The new tests give the route a virgin store path and assert that the file the
route would open never exists, which is the strongest form of "no minute is stored".

The review's own battery, as the test that fails on the route of the base `e760f9d`:

```powershell
npx vitest run tests/voice-minute-cap.test.ts
```

```text
 ❯ tests/voice-minute-cap.test.ts (9 tests | 5 failed) 1061ms
 FAIL  tests/voice-minute-cap.test.ts > the cap of the day is answered before the configuration > answers 429 with a
 limit of 1 and an empty key, and asks ElevenLabs for nothing
 FAIL  tests/voice-minute-cap.test.ts > the cap of the day is answered before the configuration > answers 429 with a
 limit of 2 and an empty key, and asks ElevenLabs for nothing
 FAIL  tests/voice-minute-cap.test.ts > the cap of the day is answered before the configuration > answers 429 with a
 limit of 3 and an empty key, and asks ElevenLabs for nothing
 FAIL  tests/voice-minute-cap.test.ts > the cap of the day is answered before the configuration > answers 429 with a
 limit of 4 and an empty key, and asks ElevenLabs for nothing
AssertionError: expected 503 to be 429 // Object.is equality
 FAIL  tests/voice-minute-cap.test.ts > the cap of the day is answered before the configuration > answers 429 and not
 503 when the key is set and no agent exists anywhere
AssertionError: expected 503 to be 429 // Object.is equality
 Test Files  1 failed (1)
      Tests  5 failed | 4 passed (9)
   Duration  1.51s
```

The five failures are the defect of the review, reproduced: the four limits of the battery and the missing agent all
answered `503` where the contract asks `429`.

**The fix.**

- `lib/voice/minutes.ts`: the rule of the cap that needs no store is now its own exported function,
  `capRefusal(limit): SessionRefusal | null`, which answers `below-session` for a limit under the five minutes of a
  session. `reserveSession` uses it, so the statement of the store and the route share one rule and cannot drift.
- `app/api/voice/signed-url/route.ts`: `GET` evaluates `capRefusal(voiceMinuteLimit(environment))` **before** it reads
  `ELEVENLABS_API_KEY`, and answers `429` with `status: "limited"`, `reason: "below-session"` and the error line that
  names `DAILY_VOICE_MINUTE_LIMIT=<n>` when the cap never fits a session. The body of a refusal is built once
  (`limited(limit, reason)`), so the `429` of the limit and the `429` of a spent day say the same thing they said
  before. The `503` that names `ELEVENLABS_API_KEY` or `ELEVENLABS_AGENT_ID` keeps its place after the cap.

The deliberate boundary, written down so no reader has to guess it: what moves before the configuration is the refusal
the cap dictates by itself (a limit below one session). The "spent" half of the cap needs the minutes of the day, so it
stays in the atomic reservation **after** the configuration check, which is what keeps a `503` of an unconfigured
installation from consuming five minutes of the day on every request. The requirement's scenario and the battery of the
review are the limit case, and that case is now answered first; the two tests of "a day that is spent" and "the
reservation stays whole" of section 10 keep passing unchanged.

**The green, after the fix.**

```powershell
npx vitest run tests/voice-minute-cap.test.ts tests/voice-signed-url.test.ts tests/voice-panel.test.tsx
```

```text
 Test Files  3 passed (3)
      Tests  30 passed (30)
   Duration  8.62s
```

**A note on the harness of the new tests.** The first shape of these tests opened a real store per limit and read the
table afterwards; on Windows the file of a store that was just closed stays locked for a moment, `fs.rmSync` does not
retry that `EPERM` (measured: `maxRetries: 10, retryDelay: 300` still failed in 1 ms) and the cleanup of the file
aborted with `EPERM` on a suite of nine tests. The final shape removes the cause: the route answers the cap before it
opens anything, so the test asserts that the store file was never created, which is both stronger evidence and free of
temp files. Verified with three consecutive runs of the file: `9 passed (9)`, no `EPERM` and no leftover directory in
`%TEMP%`.

**Tests touched.** `tests/voice-minute-cap.test.ts`: three new tests and a loop of four, and the helper
`virginStorePath()`. `emptyStore()` is the same function it was; nothing of the three tests of section 10 changed.

**Verdict.** 11.1 is done: a cap below one session answers `429` with `reason: "below-session"` for the limits 1 to 4
with an empty key and with a missing agent, no signed URL is requested, no minute is stored, and a limit that does
admit a session still answers `503` naming the variable.

**Commit.** `c7250e4` carries the red tests; `e67a4e2` carries the fix.

## 11.2 What is copied from a package keeps its notice

**Task.** Major of the review: `public/voice/worklets/libsamplerate.worklet.js` is byte for byte the file of
`@alexanderolsen/libsamplerate-js@2.1.2`, but the repository versioned no license text of that package, and the README
of the folder called the three files simply MIT. The package's `LICENSE.md` carries **two** notices — the MIT of the
wrapper and the 2-clause BSD of the libsamplerate it bundles — and both ask to be kept with the copies. The requirement
"What is copied from a package keeps its notice" asks every verbatim copy of a package to sit next to the license text
of that package, byte for byte from the package, and to be listed in `THIRD_PARTY_NOTICES.md` with its name, version,
license and origin.

**What the package brings, read before writing anything.** The installed
`node_modules/@alexanderolsen/libsamplerate-js` holds `LICENSE.md` (2,497 bytes, SHA-256
`69f1609423518937e0c70baade7a15e4eaaaee7109a8b0e793733b0f89ec6f72`), whose first half is `# libsamplerate-js License
(MIT)` and whose second half is `# libsamplerate (aka Secret Rabit Code) License (2-clause BSD)`. Its `README.md`
closes with "Licenses are available in `LICENSE.md`", and the package ships no separate file for the BSD notice, so the
whole file is what travels; nothing was extracted, split or retyped. The other package the folder copies,
`@elevenlabs/client` 1.26.0, brings one `LICENSE` (1,067 bytes, SHA-256
`0bfed2a2aa8d106bdb144f55416e193450fbc1e1b3257e3852bc64418069de5a`), the MIT text of ElevenLabs, and the requirement
covers the two processors of that package as well.

**The red, before the fix.** `tests/third-party-notices.test.ts` is new: it reads the installed package and compares
the copies byte by byte, demands the MIT permission notice and the two BSD redistribution clauses inside the text that
travels next to the resampler, demands a row for every `.js` the folder serves, and demands the font and its OFL.

```powershell
npx vitest run tests/third-party-notices.test.ts
```

```text
 Test Files  1 failed (1)
      Tests  4 failed (4)

 FAIL  tests/third-party-notices.test.ts > the notice of what is copied from a package > keeps the license of the
 resampler next to it, byte for byte from the package
Error: ENOENT: no such file or directory, open '<worktree>\public\voice\worklets\LICENSE-libsamplerate-js.md'
 FAIL  tests/third-party-notices.test.ts > the notice of what is copied from a package > keeps the license of the
 worklets of the SDK next to them, byte for byte from the package
Error: ENOENT: no such file or directory, open '<worktree>\public\voice\worklets\LICENSE-elevenlabs-client.md'
 FAIL  tests/third-party-notices.test.ts > the notice of what is copied from a package > names every copy the folder
 serves, with its name, version, license and origin
Error: ENOENT: no such file or directory, open '<worktree>\THIRD_PARTY_NOTICES.md'
 FAIL  tests/third-party-notices.test.ts > the notice of what is copied from a package > names the font and its OFL,
 which the repository also serves
Error: ENOENT: no such file or directory, open '<worktree>\THIRD_PARTY_NOTICES.md'
   Duration  347ms
```

**The fix.**

- `public/voice/worklets/LICENSE-libsamplerate-js.md`: the `LICENSE.md` of `@alexanderolsen/libsamplerate-js` 2.1.2,
  copied byte for byte with `Copy-Item` (2,497 bytes, the SHA-256 above, `byteEqual true`). It is the license text of
  the resampler and, in its second half, the 2-clause BSD of libsamplerate.
- `public/voice/worklets/LICENSE-elevenlabs-client.md`: the `LICENSE` of `@elevenlabs/client` 1.26.0, copied byte for
  byte (1,067 bytes, `byteEqual true`), which is the license text of the two processors served next to it.
- `scripts/copy-voice-worklets.mjs` (`npm run worklets:voice`) copies the five files now: the three worklets and the two
  license texts, so the copies cannot go stale against their packages. The license of `@elevenlabs/client` is resolved
  from the root of the installed package, because its `exports` map publishes `worklets/*` and nothing else (a direct
  `LICENSE` subpath fails with `ERR_PACKAGE_PATH_NOT_EXPORTED`).
- `THIRD_PARTY_NOTICES.md`, at the root: the name, the version, the license and the origin of every file the repository
  serves or ships that is a verbatim copy of a package — the three worklets and the two license texts of the audio, and
  the two subsets of Outfit with the `OFL.txt` that travels next to them — plus the official sources of the two licenses
  of the resampler (the package repository and libsamplerate, with its 2-clause BSD text in the second half of the
  copied file), the SHA-256 of each license copy, and a closing note for the third-party code that arrived adapted
  instead of copied (`components/ui/orb.tsx` and the four ports of Construye, each one with its license and its origin
  in the header of its own file).
- `public/voice/worklets/README.md`: the table now says MIT **and** the BSD 2-clause of the bundled libsamplerate for
  the resampler, gives a row to each license copy, and points at `THIRD_PARTY_NOTICES.md`. This is the documentation gap
  the review named in its Major 2.
- `NOTICE`: one line that sends a reader to `THIRD_PARTY_NOTICES.md`.
- `.gitattributes`: `public/voice/worklets/LICENSE-* -whitespace`, the same exception the three worklets and the OFL of
  Outfit already had, so a future version of either package keeps its bytes verbatim without failing
  `git diff --check` of this repository. Both copies as they are today carry no trailing whitespace and no CRLF: the
  exception is a guard, not a need of these bytes.

The green, after the fix:

```powershell
npm run worklets:voice
```

```text
raw-audio-processor.js: 3953 bytes
audio-concat-processor.js: 2814 bytes
libsamplerate.worklet.js: 2016428 bytes
LICENSE-elevenlabs-client.md: 1067 bytes
LICENSE-libsamplerate-js.md: 2497 bytes
```

```powershell
npx vitest run tests/third-party-notices.test.ts tests/voice-worklets.test.tsx tests/design-system.test.ts tests/readme.test.ts tests/personal-paths.test.ts
```

```text
 Test Files  5 passed (5)
      Tests  74 passed (74)
   Duration  2.47s
```

The check of the bytes, the same shape the review used over the served resampler:

```powershell
node -e "const fs=require('fs');const c=require('crypto');const pairs=[['node_modules/@alexanderolsen/libsamplerate-js/LICENSE.md','public/voice/worklets/LICENSE-libsamplerate-js.md'],['node_modules/@elevenlabs/client/LICENSE','public/voice/worklets/LICENSE-elevenlabs-client.md']];for(const [a,b] of pairs){const x=fs.readFileSync(a),y=fs.readFileSync(b);console.log(b,'bytes',y.length,'byteEqual',x.equals(y),'sha256',c.createHash('sha256').update(y).digest('hex'))}"
```

```text
public/voice/worklets/LICENSE-libsamplerate-js.md bytes 2497 byteEqual true sha256 69f1609423518937e0c70baade7a15e4eaaaee7109a8b0e793733b0f89ec6f72
public/voice/worklets/LICENSE-elevenlabs-client.md bytes 1067 byteEqual true sha256 0bfed2a2aa8d106bdb144f55416e193450fbc1e1b3257e3852bc64418069de5a
```

**What the notices answer to the review's Major 2.** The review asked for the MIT and BSD notices "que el propio
paquete incluye y exige conservar". Both are now in `public/voice/worklets/LICENSE-libsamplerate-js.md`, byte for byte
from the package, which is the file the package publishes for both texts; `THIRD_PARTY_NOTICES.md` names the resampler,
its version `2.1.2` and both licenses, and links the official sources. The package did bring the BSD text, so no issue
had to be recorded about a missing license.

**Verdict.** 11.2 is done: the two license texts sit next to the copies, equal to the files of the installed packages,
the notices file lists every verbatim copy with its name, version, license and origin, and a test reads the package and
compares.

**Commit.** `18b7dea` carries the red test; `7876988` carries the copies, the notices, the script, the README of the
folder, `NOTICE` and `.gitattributes`.

## 11.3 The battery, and the round of the delivery

**Task.** `npm test` on Windows and in a `node:24` Linux container, `npm run typecheck`, `npm run lint`,
`npm run test:e2e`, gitleaks, `openspec validate --all --strict`, `git diff --check main...HEAD`, and the round
appended to `katalis-dev/tasks/entrega-community-09.md` with `## Issues`.

**Windows.**

```powershell
npm test
```

```text
 Test Files  50 passed (50)
      Tests  448 passed (448)
   Duration  17.55s
```

Fifty files and 448 tests, ten more than the 438 of round 10: the six new tests of the cap (the four limits of the
review's battery, the missing agent and the `503` that has to stay) and the four of the notices. Nothing of the
existing suite was skipped on Windows.

```powershell
npm run typecheck
```

```text
> next typegen && tsc --noEmit

Generating route types...
✓ Types generated successfully
(tsc --noEmit: no diagnostic)
```

```powershell
npm run lint
```

```text
> eslint .

(no diagnostic)
```

The lint is clean with the two new files and with the two license copies: `public/voice/worklets/**` stays ignored on
purpose since round 10, and the `.md` copies carry no rule that applies.

```powershell
npm run test:e2e
```

```text
the worklets: /voice/worklets/raw-audio-processor.js 200 application/javascript; charset=UTF-8; /voice/worklets/audio-concat-processor.js 200 application/javascript; charset=UTF-8; /voice/worklets/libsamplerate.worklet.js 200 application/javascript; charset=UTF-8; /voice/worklets/raw-audio-processor.js: loaded; /voice/worklets/audio-concat-processor.js: loaded; /voice/worklets/libsamplerate.worklet.js: loaded
the voice panel: axe 0 violations, 24 rules passed
  29 passed (18.3s)
```

```powershell
npm run secrets:scan
```

```text
349 commits scanned.
scanned ~5832936 bytes (5.83 MB) in 2.83s
no leaks found
exit=0
```

```powershell
npm run openspec:validate
```

```text
Totals: 11 passed, 0 failed (11 items)
```

```powershell
git diff --check main...HEAD
```

```text
(no line; exit 0)
```

**The Linux container.** `node:24` (24.21.0, npm 11.19.0), the worktree mounted with its own `node_modules` volume so
the Windows tree is not touched:

```powershell
docker run --rm -v "<worktree>:/app" -v katalis-nm-node24:/app/node_modules -w /app node:24 bash -lc "node --version; npm --version; npm ci --no-audit --no-fund; npm test"
```

```text
v24.21.0
11.19.0

added 581 packages in 51s

 Test Files  50 passed (50)
      Tests  446 passed | 2 skipped (448)
   Duration  17.70s
```

The two skipped tests are the same two of rounds 9 and 10, the ones of the case-insensitive file system of Windows.
`npm ci` emitted the two known non-blocking warnings (ESLint 9.39.5 out of support, and the install script of
`unrs-resolver@1.12.2` not approved); the tree stayed clean in `7876988`.

**The delivery.** `katalis-dev/tasks/entrega-community-09.md` gained the round 11, in Spanish, with its `## Issues`.

**Verdict.** 11.3 is done: the whole battery is green on Windows and in the container, and the two Major of
`revision-community-09b.md` are closed with their evidence.

**Commit.** The report of this section and the marks of the section travel in the commit that follows `7876988`; the
closing commit carries `LOOP_STATE.md` in `DONE`.

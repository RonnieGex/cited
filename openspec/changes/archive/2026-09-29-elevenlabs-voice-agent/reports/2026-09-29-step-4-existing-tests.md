# Step 4 — the whole suite and the tests that changed

- Date: 2026-09-29
- Change: `elevenlabs-voice-agent` (OpenSpec)
- Branch: `feature/elevenlabs-voice-agent`
- Agent: deepseek-harness
- Task: 4.1
- Verified against: the tree of `3d0ff2c`, with the assertion this step adds to `tests/csp.test.ts`

## What the task asks

The whole suite; say which test changed and why.

## Commands and real output

```
$ npm test

 Test Files  46 passed (46)
      Tests  427 passed (427)
   Start at  13:31:42
   Duration  13.50s (tests 51%, environment 30%, setup 9%, import 6%, transform 3%, worker 1%)
```

The base of step 1 was 38 files and 348 tests. This change adds the eight voice files, 79 tests, and one assertion to
`tests/csp.test.ts`. Nothing was skipped and nothing is flaky in this run.

The browser suite of the same tree, which step 7 repeats with its captures:

```
$ npx playwright test --reporter=list

  28 passed (14.4s)
```

Twenty-one tests were there before (six of the panel and fifteen of the public page and the widget); the seven of
`e2e/voice.spec.ts` are new. The whole log is `katalis-dev/tasks/_community-09-step4-e2e.log`.

## The tests that changed, and why

### An existing test file

- **`tests/csp.test.ts`**: one assertion was added, `"names the endpoints of the voice session, and only them"`. The
  change amends the policy of the public documents (`connect-src`, `worker-src` and `media-src`), and the file that
  pins the policy has to pin the amendment. It reads each directive out of the policy and compares it whole, so the
  test fails if anything else is ever added to `connect-src`, and it also pins that `script-src` did not change.

No other test of the base needed a change: the launcher of the voice is one button on `/` and `/embed`, and the tests
of the chat, the widget, the i18n, the design system, the panel and the README keep passing as they were.

### The tests this change wrote in step 2, adjusted while the code landed

They are new files of this change, not tests of the base, and every adjustment is recorded here so the difference
between the red run and the green run is not a silence:

| File | What changed | Why |
| --- | --- | --- |
| `tests/voice-signed-url.test.ts` | the calls are `GET()`, and the helper that built a `Request` is gone | the route of the signed URL takes no request: it reads the environment and the store, so there is nothing to hand it. The cleanup of the temporary stores also got the retry loop of `tests/ask-route.test.ts` |
| `tests/voice-tool.test.ts` | the heading-less citation moved to a unit test of `voiceText()`, and the cleanup got the same retry loop | which passage the answer cites is the business of the deterministic model, so a route test cannot pin a passage without a heading; the shape of the text is what this change owns |
| `tests/voice-provision.test.ts` | the agent id is compared with the id the double answers; the cleanup got the same retry loop | the first assertion compared a value with itself through a fallback, which proves nothing |
| `tests/voice-panel.test.tsx` | the `connecting` state is driven after the session starts; the two text-only tests assert the session is connected through the button that ends it instead of the `ready` label | while a session is on its way the primary control offers to finish it, so `voice-start` is not in the document; and sending the pending question moves the session to `thinking` at once, which is exactly what the real SDK does |
| `tests/voice-secrets.test.ts` | the tree that must not carry the key is `components/**` plus the pages of `app/**`, and the panel assertion moved to `voice-url.ts` | `app/api/**` is server code that legitimately names the variables, and the endpoint of the signed URL lives in the module that asks for it |

The Windows cleanup loop is the one of `tests/ask-route.test.ts`: libSQL keeps the file of the store open for a moment
after `close()`, and `rmSync` answers `EPERM` on a directory that is still held.

### The code the tests forced

Two adjustments of the implementation are worth naming, because they are behaviour and not cosmetics:

- The panel reads `prefers-reduced-motion` only when `window.matchMedia` exists. Three of the panel tests failed on
  that line before the guard: jsdom does not implement it, and the panel cannot assume a browser API that a document
  without a screen does not have.
- The ported Orb reads the uniforms of its shader through one named shape. This repository type checks with
  `noUncheckedIndexedAccess` and Construye does not, so the copy needed one documented adaptation to compile. The
  header of the MIT file records it, together with the four React Compiler rules of this repository's lint that a
  three.js component cannot satisfy.

## Verdict

Task 4.1 is done: the whole suite is green over the implemented change, exactly one existing test file was amended and
the report says which line and why, and the adjustments of the new tests are named one by one.

## Commit

The assertion of `tests/csp.test.ts` and this report travel in the commit that closes step 4.

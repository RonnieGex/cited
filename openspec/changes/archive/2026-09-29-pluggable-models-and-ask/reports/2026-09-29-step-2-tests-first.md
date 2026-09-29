# Step 2 - Tests first, in red

- Date: 2026-09-29
- Change: `pluggable-models-and-ask`
- Branch: `feature/pluggable-models-and-ask`
- Agent: `deepseek-harness`
- Commit verified against: `f8a7409` (the base before, with `LOOP_STATE.md` set to `RUNNING` in the tree)

## The tests that were written

| File | Scenario of `specs/answering/spec.md` it covers |
|---|---|
| `tests/answer.test.ts` | a question the documents answer; citations the model invents; nothing in the documents; an answer without a source; a planted instruction; the deterministic provider; a follow-up and its six turns; `MAX_ANSWER_TOKENS` and the temperature |
| `tests/ask-route.test.ts` | `POST /api/ask` answered and refused; 1001 characters (400); the 31st question (429 with `Retry-After`); the daily limit (503); the missing key (503 naming the variable); no IP in clear; a body that is not JSON |
| `tests/ask-cli.test.ts` | the quick start answers without keys; the refusal; the length guard of the command line |
| `tests/models.test.ts` | the provider is chosen by variables; every provider that needs a key fails without it; no value of the environment travels in the message; the fake needs no key; no network when a provider is constructed |
| `tests/guards.test.ts` | the defaults and the overrides of the five limits; the salted hash and the missing salt; `x-forwarded-for` only with `TRUST_PROXY=1`; the hourly purge; the counters and the turns of the store |

Every test uses the deterministic `fake` provider of the project or an injected model; no test reaches a real provider.
`tests/answer.test.ts` and `tests/models.test.ts` stub `fetch` with a function that throws, so a hidden network call
turns into a failure.

## The red state

```
> npm test

 ❯ tests/ask-cli.test.ts (3 tests | 3 failed) 7157ms
 Test Files  5 failed | 11 passed (16)
      Tests  3 failed | 114 passed (117)
   Duration  8.99s
```

The five files of the change are red and the eleven files of the base stay green, so the change adds tests without
touching what already worked. The four suites that cannot even be collected:

```
 FAIL  tests/answer.test.ts [ tests/answer.test.ts ]
Error: Cannot find package '@/lib/answer/ask' imported from tests/answer.test.ts

 FAIL  tests/ask-route.test.ts [ tests/ask-route.test.ts ]
Error: Cannot find package '@/app/api/ask/route' imported from tests/ask-route.test.ts

 FAIL  tests/guards.test.ts [ tests/guards.test.ts ]
Error: Cannot find package '@/lib/guards/ip' imported from tests/guards.test.ts

 FAIL  tests/models.test.ts [ tests/models.test.ts ]
Error: Failed to resolve import "@/lib/models/fake" from "tests/models.test.ts". Does the file exist?
```

And the three tests of the command line, which fail on the missing script:

```
 FAIL  tests/ask-cli.test.ts > npm run ask > answers without keys and prints the citation of the document it came from
AssertionError: expected 1 to be +0
 FAIL  tests/ask-cli.test.ts > npm run ask > prints the refusal instead of an invented answer
AssertionError: expected 1 to be +0
 FAIL  tests/ask-cli.test.ts > npm run ask > refuses a question longer than the limit and says which variable it crossed
AssertionError: expected 1 to be 2
```

`npm test` exits 1. Nothing of `lib/answer/`, `lib/models/`, `lib/guards/`, `app/api/ask/` or `scripts/ask.ts` exists
yet: the red is the modules the change owes, not a broken test.

## A note on the shape the tests fix

The tests drive the public shape of the implementation: `askQuestion` returns a tagged outcome (`answered`, `refused`,
`invalid`, `rate_limited`, `unavailable`) so the route and the command line map it to 200, 400, 429 and 503 without
duplicating a rule; `createFakeChatModel({ reply, onCall })` covers both the deterministic provider of the product and
the adversarial replies of the tests (an invented `[99]`, a text with no citation, `NO_ANSWER`); the store grows
`recordQuestion`, `questionsInWindow`, `recordModelCall`, `modelCallsOn`, `appendTurn` and `turnsOf`.

## Verdict

PASS. The tests of every scenario exist, they are red for the reason the change states, and the base stays green.

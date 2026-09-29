# LOOP_STATE · Cited

STATUS: DONE
CHANGE: pluggable-models-and-ask (OpenSpec)
ROUND: the whole contract, tasks 0.1 to 9.3
BRANCH: feature/pluggable-models-and-ask
BASE: aa52b7c (main, "Merge cited-identity-and-readme")
HEAD AT THE START OF THE ROUND: 77a21ad ("Specify the answers with citations of Cited")
HEAD AT THE END OF THE ROUND: 1c078c0 ("Move the answer from Next to Available in the README and its graphics"); the
closing report of step 9.3 goes in the commit that carries this file, right after it
AGENT: deepseek-harness
DATE: 2026-09-29

## Objective

Execute `openspec/changes/pluggable-models-and-ask/tasks.md`, the contract Fable wrote on 2026-09-29: the answer with
citations that is the heart of Cited. Tests first and red, small commits, a real report for every `[x]`, no network
call to a real provider in any test, and the README moved from "not ready" to the answer working.

## What was delivered

- **`POST /api/ask`**: hybrid search, one call to the chat model with the numbered passages, `200 answered` with the
  answer and its citations, `200 refused` with a localized message, `400`, `415`, `429` with `Retry-After` and `503`
  naming the variable that is missing. Errors never echo the body.
- **Nine providers by variables** (`openai`, `anthropic`, `gemini`, `deepseek`, `groq`, `openrouter`, `ollama`,
  `lmstudio`, `fake`) over the Vercel AI SDK 7, with the license of every new package recorded (no GPL, no AGPL).
- **The prompt, the citations and the refusal**: five rules in the system message, the passages inside `<passage>`
  delimiters, a parser that drops the invented markers and renumbers the real ones, and a refusal in Spanish or
  English when the documents do not answer.
- **The guards**: 1000 characters, 30 questions per address per hour, 500 model calls per UTC day, 600 tokens per
  answer, 30 days of conversation, with the address stored only as a salted SHA-256 and `TRUST_PROXY` deciding
  whether a header is trusted.
- **`npm run ask`** on the same `lib/answer/ask.ts` the route uses.
- **The documentation and the announcement**: `docs/answering.md`, `.env.example`, the README and its Spanish twin,
  and the four graphics that changed, with the answer moved from `Next` to `Available` and the real run of
  `npm run ask` drawn in the demo.

## Evidence

- 14 commits of implementation on the branch, 67 files, 4973 insertions and 204 deletions against `main`.
- 10 reports, one per step, under `openspec/changes/pluggable-models-and-ask/reports/`, each `[x]` of `tasks.md`
  marked with its own.
- `npm test`: 16 files and 165 tests green on Windows (Node v24.11.0) and in a `node:24` Linux container
  (v24.21.0); the base had 114.
- `npm run typecheck`, `npm run lint`, `npm audit --audit-level=high` (0 vulnerabilities), gitleaks (158 commits, no
  leaks), `openspec validate --all --strict` (8 items) and `git diff --check main...HEAD` green.
- `npm run build` + `npm run start` + `curl.exe`: the five cases of the contract verified by hand.
- `npm run test:e2e`: 1 test, green, with no page changed.
- The store of the suite leaves no file behind; the store of a real run keeps the counters and the turns with no
  address in clear.
- The delivery: `katalis-dev/tasks/entrega-community-05.md`, in Spanish with `## Issues`.

## The issues that were found and fixed

1. `npm install` pruned five optional entries of the lock file that Linux needs; `npm ci` failed there and the
   pipeline would have broken in the push. Restored from `main` and verified on both platforms.
2. The command-line test needed a 30 s timeout in the container, where the first `npm run ask` takes 5.9 s.
3. The step 1 report carried the home directory of this machine and broke `tests/personal-paths.test.ts`; the path was
   elided and the commit amended.
4. Two tests written in step 2 were wrong (an empty store cannot show a prompt, and the delimiter carries the
   heading); both were corrected in step 3.3.

## The issues that stay open

- Without `TRUST_PROXY=1` every direct visitor shares one rate-limit bucket, because a client can write
  `x-forwarded-for` and Next 16 does not expose the socket address to a route handler. Documented; a real deployment
  goes behind a proxy.
- `openspec/specs/answering/spec.md` was created before the archive so the `Available` row links a spec that exists;
  the archiver must not duplicate the requirement.
- The honesty rule of the README was amended (it refused the word "answer", which is now available) and it accepts
  `planificado`/`planificada` as a tag; three rows of the configuration table and one heading of `docs/security.md`
  now name the change that delivers what they announce.
- The render script opened `.data/katalis.sqlite` (git ignores it) and created its three new tables there.
- `docs/security.md` still says `Planned` of things built by the archived change 2, outside the three bullets this
  change made true.

## Hard rules respected

- No `.env` file was opened (the repository has none).
- No push, no remote, no commit in `main`, no archive, no deploy.
- No call to a real provider and no call to Turso: the deterministic `fake` provider ran every command, and several
  tests install a `fetch` that throws.
- `MEMORY.md` is in no commit.
- UTF-8 with LF in every file written or modified.
- `community-ui` and its branch `feature/brand-and-design-system` were not touched; its `main` was read only to
  confirm that the branch is not merged, so no merge was due before the README.
- The text of no task was edited: only its checkboxes.

## Pending for Fable

- The review, the merge and the archive; the decision on the amended honesty rule (RISK 2 of the delivery), on the
  spec in force created before the archive (RISK 3) and on the `direct` bucket (RISK 1).

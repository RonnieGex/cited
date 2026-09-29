# LOOP_STATE · Cited

STATUS: DONE
CHANGE: provider-keys-in-panel (OpenSpec)
ROUND: section 11 of the contract, tasks 11.1 to 11.6 — what the second review of Codex reproduced
BRANCH: feature/provider-keys-in-panel
BASE: c07640b (main when the change started, "Write the product context of Cited: the owner, the visitor, and what the
design must honour"); the change starts at 71f08f0 ("Specify the keys in the panel: connect your AI without touching
the server"). `main` has moved since (now `03101b6`, "Merge elevenlabs-voice-agent", which brings the tables of the
voice change); the base of this change and the "before" of task 11.4 stay `c07640b`
HEAD AT THE START OF THE ROUND: ca59b1f ("Put the obligation of the pinned address in the first line of its
requirement")
HEAD AT THE END OF THE ROUND: the closing commit that carries this file, the report of section 11 and the six marks
AGENT: deepseek-harness
DATE: 2026-09-29

## Objective

Close the findings of `katalis-dev/tasks/revision-community-12b.md` (the second adversarial review of Codex, FAIL):
the four Majors — M-1 (the hexadecimal form of an IPv4 mapped into IPv6 evaded the classification), M-2 (the address
that was validated was not the address that was connected to: a DNS that changed its answer between the guard and the
request reached an internal service with the customer key in the header), M-3 (the test and save routes named
`ALLOW_LOCAL_PROVIDERS` in their JSON, outside "For the installer") and M-4 (`scripts/store-state.ts` opened the store
with the application, which creates and migrates it, so the "before" it printed was the state after the current
schema) — and the Minor of the delivery (a closing hash and a commit count that did not describe the HEAD that ships).
Tests first and red before each fix, reproducing what the review reproduced, with the two new requirements of the spec
delta: "The address that was validated is the address that is connected to" and "The owner never reads a variable name
in an answer of the panel".

## What was delivered

- **11.1, the Major of the notation**: the ranges of `lib/providers/address.ts` are `node:net` `BlockList` subnets
  instead of hand-written comparisons, and an IPv6 literal that carries an IPv4 inside — mapped, compatible, NAT64 or
  6to4 — is judged by those 32 bits, so the spelling cannot decide the answer. The table test enters through real base
  URLs with the literals of the review (`::ffff:7f00:1`, `::ffff:127.0.0.1`, `::ffff:a00:1`, `fc00::1`, `fe80::1`,
  `::`, `::1`, `64:ff9b::7f00:1`, `2002:7f00:1::1` and the IPv4 ranges of the earlier requirement). `e519fd1`.
- **11.2, the Major of the pinned address**: `lib/providers/pinned.ts`, a transport built on `node:http` and
  `node:https` with a `lookup` that answers the classified address and never the DNS, the name of the host kept in the
  `Host` header and in `servername`, no redirect followed and a retry only over the answers of the same resolution.
  The test route uses it, and it travels as the `fetch` of the chat and embeddings clients that consume a `baseUrl` of
  the panel. `798df65`.
- **11.3, the Major of the words**: the routes answer `address_not_allowed` and a sentence without the name of a
  variable; the page translates the code and links "For the installer" (`/admin`), the only page that names one.
  `7685414`.
- **11.4, the Major of the evidence**: `scripts/store-state.ts` reads with `node:sqlite` and `readOnly: true`, says
  `exists: false` instead of creating a store and never calls `openStore()`; the list of the tables lives in
  `lib/store/tables.ts`, which loads no client. The state before was measured on a store created by the code of the
  base in a temporary worktree, and the state after on the same file opened by this branch: the three tables of the
  change absent before and present and empty after. `8e57547`.
- **11.5 and 11.6**: the delivery names the closing HEAD and the count read with `git rev-list --count main..HEAD`, and
  the battery ran on Windows and in a `node:24` Linux container from a clean clone, with gitleaks recorded for every
  commit of the round.

## Evidence

- Report: `openspec/changes/provider-keys-in-panel/reports/2026-09-29-step-11-review-fixes.md`, with the exact command,
  the commit and the output of every task, including the red runs and the before/after of the store.
- The numbers of the review, now the other way around: `accepted=0` for the mapped addresses, `internal_requests=0`
  for the name that changes its answer, `names_variable=false` in the JSON of the routes and a store of the base that
  comes out of the reader with its nine tables and the three new ones `MISSING`.
- `npm test`: 55 files and 480 tests green on Windows (26.76 s); 55 files, 478 green and 2 skipped in a `node:24` Linux
  container (v24.21.0, 123.16 s) from a clean clone. The two skipped are the ones of `tests/design-system.test.ts`
  that were already skipped on Linux.
- `npm run typecheck`, `npm run lint`, `npm run test:e2e` (30 green), `gitleaks git` per commit,
  `npx openspec validate --all --strict` (11 items) and `git diff --check main...HEAD`: green.
- The round: nine commits of work (four red tests, four fixes and the state of the loop in RUNNING) plus the closing
  one, `git rev-list --count main..HEAD` recorded in the delivery.

## The issues that stay open

- `ALLOW_LOCAL_PROVIDERS=1` is what an installation with its own Ollama or LM Studio needs, and it also allows a local
  `http` address: whoever has the session of the panel can point a provider at a service of the machine. It is the
  decision the spec asks for, and it is written down in `.env.example` and in `docs/providers.md`.
- The pinned transport connects to the address the guard classified, so a DNS that changes its answer between the two
  moments is closed for every call that uses an address of the panel. The address of a cloud provider that whoever
  installs wrote in `<PROVIDER>_BASE_URL` is not pinned: it is the value of the installer, not of the browser.
- No affiliate URL of a real programme is committed: the switched-on path is proven in a browser with a virtual link.
- No test calls a real provider and none opens a real private network: the doubles listen on `127.0.0.1`, the
  resolution that decides something is a controlled double, and the TLS test generates its own certificate in a
  temporary folder at run time (never committed) and is skipped where no `openssl` exists.
- The change is not archived (that needs the explicit OK of Franc), nothing was pushed and nothing was deployed.

## Hard rules respected

- No `.env` file with secrets was opened (the repository has none: `Test-Path .env` is `False`); only the public
  template `.env.example` is edited, and this round did not need to touch it.
- No push, no remote, no commit in `main`, no archive in this worktree, no deploy.
- `community`, `community-ui`, `community-preview` and `community-main` were not touched: the temporary worktree of
  this round lived inside `community-ins` (`.tmp-store-before`), was used to create the store of the base and was
  removed and pruned.
- No test calls a real provider: the local doubles of `tests/provider-double.ts`, the doubles the specs serve on
  `127.0.0.1` and the deterministic `fake` run everything.
- No real key in the repository: the keys of the suites are generated by the run or strings of the test.
- `MEMORY.md` is in no commit. No personal path in a versioned file. UTF-8 with LF in every file written.
- The text of no task, of `design.md` or of the specs was edited: the only change in `tasks.md` is the box of each
  task of section 11.

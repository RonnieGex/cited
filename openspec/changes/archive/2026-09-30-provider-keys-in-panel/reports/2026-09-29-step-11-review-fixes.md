# Step 11: what the second review of Codex reproduced

- Contract: `openspec/changes/provider-keys-in-panel/tasks.md`, section 11 (amended by Fable after
  `katalis-dev/tasks/revision-community-12b.md`)
- Branch: `feature/provider-keys-in-panel`, in the worktree `katalis-dev/community-ins`
- Base: `main` `c07640b`; the change starts at `71f08f0`
- HEAD at the start of the round: `ca59b1f` ("Put the obligation of the pinned address in the first line of its
  requirement")
- Fixes: 11.1, 11.2, 11.3, 11.4, 11.5 and 11.6
- Reports of the earlier steps: `reports/2026-09-29-step-{0,1,2,3,4,5,6,7,8,9,10}-*.md`

This report is written in parts, one per commit of the round, so that every `[x]` of section 11 points at the exact
command, the commit and the output that support it. The report of a step is always at this path inside the change
folder, which is what survives the archive.

The round follows the rule of the contract: the test first, red before the fix, reproducing what the review
reproduced. Every red run below is a real execution on the worktree with the fix out of it (for 11.1, 11.2 and 11.4 the
red test is its own commit; for 11.3 the same run was taken with the three files of the fix stashed, and the red test
and the fix travel in two consecutive commits).

`main` moved while this round was running: it is now `03101b6` ("Merge elevenlabs-voice-agent"), which added
`voice_minutes` and `voice_agent` to the schema of the store from another change. The base of this change is still
`c07640b`, and that is the code the "before" of 11.4 uses.

## 11.1 Major M-1: the notation of an address does not change its classification

**The finding.** `lib/providers/address.ts` recognised an IPv4 mapped into IPv6 only when it kept the dotted form
`::ffff:127.0.0.1`. `new URL()` canonicalises the literal before the guard reads it
(`http://[::ffff:127.0.0.1]:11434` arrives as `::ffff:7f00:1`), and the hexadecimal form did not match the regular
expression nor any private prefix, so it was accepted with `ALLOW_LOCAL_PROVIDERS` empty. Codex reproduced it with
`MAPPED_IPV4_REPRO accepted=3 hosts=127.0.0.1=>::ffff:7f00:1,10.0.0.5=>::ffff:a00:5,192.168.1.1=>::ffff:c0a8:101`.

### Red before the fix

Command:

```text
npx vitest run tests/provider-address-notations.test.ts --reporter=verbose
```

Output (HEAD `ca59b1f`, with the fix out of the worktree):

```text
 FAIL  tests/provider-address-notations.test.ts > the notation of an address does not change its classification >
 accepts the internal addresses of the table when the server allows local providers
AssertionError: the loopback of IPv4 mapped into IPv6, hexadecimal form (M-1 of the review) (::ffff:7f00:1): expected
false to be true
 FAIL  tests/provider-address-notations.test.ts > the notation of an address does not change its classification >
 refuses a name whose controlled answer is one of the written forms
AssertionError: the loopback of IPv4 mapped into IPv6, hexadecimal form (M-1 of the review) (::ffff:7f00:1): expected
true to be false
 FAIL  tests/provider-address-notations.test.ts > the notation of an address does not change its classification >
 refuses the internal answer even when another answer of the same name is public
AssertionError: the loopback of IPv4 mapped into IPv6, hexadecimal form (M-1 of the review) (::ffff:7f00:1): expected
true to be false

 Test Files  1 failed (1)
      Tests  3 failed | 2 passed (5)
```

Commits: `e88bf24` (the table, red) and `e519fd1` (the fix).

### The fix

`lib/providers/address.ts`:

- the ranges are `node:net` `BlockList` subnets and not hand-written comparisons: this network, RFC 1918,
  carrier-grade NAT, loopback, link-local, the protocol assignments, benchmarking, multicast and the reserved range
  for IPv4; the unspecified address, loopback, unique local, link-local, multicast, documentation, Teredo and the
  IPv4-translated range of SIIT for IPv6;
- any IPv6 literal that carries an IPv4 inside is judged by those 32 bits: the mapped form `::ffff:0:0/96`, the
  deprecated compatible form `::/96`, NAT64 (`64:ff9b::/96` and `64:ff9b:1::/48`) and 6to4 (`2002::/16`). The literal
  is expanded to its eight groups first, so the spelling — dots, hexadecimal, upper case, a zone — cannot decide the
  answer.

### Green after the fix

Command:

```text
npx vitest run tests/provider-address-notations.test.ts tests/provider-address.test.ts tests/provider-address-route.test.ts --reporter=verbose
```

Output:

```text
 Test Files  3 passed (3)
      Tests  23 passed (23)
```

The same run over the whole suite: 52 files, 462 tests, green (461 before this round).

## 11.2 Major M-2: the address that was validated is the address that is connected to

**The finding.** The guard resolved a name and judged the answer, and then `fetch` resolved the same name again. Codex
reproduced it with a controlled resolution (public for the guard, `127.0.0.1` for the connection) against a local TLS
double: `DNS_REBIND_REPRO checked=198.51.100.20 fetch=127.0.0.1 internal_requests=1 key_in_header=true`. The same
hole lived in `/api/ask`, which read `baseUrl` from the store and handed it to the SDK without validating again.

### Red before the fix

Command:

```text
npx vitest run tests/provider-address-pinning.test.ts --reporter=verbose
```

Output (with the transport out of the worktree):

```text
 FAIL  the test follows the classified address > never reaches the second answer of the name
   -> expected false to be 'unreachable'
 FAIL  the clients of a base URL of the panel use the pinned transport > sends no chat request when the classified
       address is not the one the name resolves to
   -> promise resolved "DefaultGenerateTextResult{ ... }" instead of rejecting
 FAIL  the clients of a base URL of the panel use the pinned transport > uses the same transport for the embeddings
       of the panel
   -> promise resolved "[ 0.1, 0.1, ... ]" instead of rejecting
 FAIL  the clients of a base URL of the panel use the pinned transport > resolves and classifies once per request,
       never once more for the connection
   -> expected +0 to be 1
 FAIL  the name of TLS > goes to the classified address and hands the handshake the name of the host
   -> expected false to be 'unreachable'

 Test Files  1 failed (1)
      Tests  5 failed | 2 passed (7)
```

The TLS test ran: this machine has `openssl` (Git's) and the `node:24` container has OpenSSL 3.0.20, so the file
generates a self-signed certificate for `localhost` at run time — never committed, because a private key in the
repository is a finding and gitleaks refuses it — and the test is skipped where no `openssl` exists. Before the fix
the connection reached the local TLS double with the guard classifying `127.0.0.2`.

Commits: `da576c1` (the scenario, red) and `798df65` (the fix).

### The fix

`lib/providers/pinned.ts` is the transport, without a new dependency:

- `pinnedFetch(addresses)` opens the request with `node:http` or `node:https` and a `lookup` that answers the address
  the guard classified and never the DNS, so a second answer of the same name cannot be reached; when an address of
  the validated set does not answer, the next one of that same set is tried and the name is not resolved again;
- the URL, the `Host` header and `servername` keep the name of the host, which is what the certificate has to match;
  a redirect is never followed;
- `providerFetch()` is the transport of an address the owner wrote in the panel: on every request it resolves the
  name once and classifies every answer with the same rules of `lib/providers/address.ts` that the test and the save
  routes apply — so a name that changed its answer since it was saved is refused — and connects to one of the
  addresses that passed.

Where it is used:

| Where | How |
| --- | --- |
| the test route | `testProvider()` validates first, as before, and makes the call with `pinnedFetch()` over the addresses of that validation (`lib/providers/test.ts`) |
| the chat client of the panel | `resolveChat()` gives the resolution the transport of the address of the panel, `chatModelFrom()` passes it to the SDK as its `fetch`, and `/api/ask` and `scripts/ask.ts` hand it over (`lib/settings/providers.ts`, `lib/models/providers.ts`, `app/api/ask/route.ts`, `scripts/ask.ts`) |
| the embeddings of the panel | `resolveEmbeddings()` gives the resolution the transport and `embeddingsFrom()` passes it to the provider of OpenAI-compatible or Ollama shape (`lib/embeddings/providers.ts`) |

### Three existing tests changed, and why

The address of the panel is validated again on every call now, so a test that wrote a row the save route would refuse
had to describe an installation the product can actually write: a provider on the machine of the owner
(`ALLOW_LOCAL_PROVIDERS=1`) with the gateway of the provider pointing at the same double. Nothing else changed in
them, and no assertion was relaxed:

- `tests/provider-answering.test.ts`: the panel row of DeepSeek points at the double; `DEEPSEEK_BASE_URL` and
  `ALLOW_LOCAL_PROVIDERS` are added to the environment `withEncryptionKey()` sets.
- `tests/provider-review-errors.test.ts`: the same for its first test (the `/api/ask` one); the two of the routes
  already set the flag.
- `tests/provider-search.test.ts`: the resolution of the panel for the embeddings of OpenAI receives
  `OPENAI_BASE_URL` and `ALLOW_LOCAL_PROVIDERS` in its environment object.

### Green after the fix

```text
npx vitest run tests/provider-address-pinning.test.ts --reporter=verbose
 Test Files  1 passed (1)
      Tests  7 passed (7)
```

The whole suite after this fix: 53 files, 469 tests, green.

## 11.3 Major M-3: reason codes in the routes and the words of the owner in the page

**The finding.** The test and save routes answered `PROVIDER_ADDRESS_ERROR` in their JSON, and that sentence named
`ALLOW_LOCAL_PROVIDERS`. Codex reproduced it with
`LOCAL_PROVIDER_MESSAGE_REPRO ollama:400:names_variable=true,lmstudio:400:names_variable=true`.

### Red before the fix

Command:

```text
npx vitest run tests/provider-panel-words.test.ts tests/provider-ui.test.tsx --reporter=verbose
```

Output (with `lib/admin/provider-request.ts`, `lib/i18n/admin.ts` and `components/admin/ProviderConnect.tsx` out of the
worktree):

```text
 FAIL  the responses of the provider routes > never name a variable of the environment
   -> a test of a refused address: {"status":"address_not_allowed","ok":false,"reason":"address_not_allowed",
      "error":"that address is not allowed: a provider of the catalogue answers on its own address, and a local
      address needs ALLOW_LOCAL_PROVIDERS=1 on the server"}: expected [ 'ALLOW_LOCAL_PROVIDERS' ] to deeply equal []
 FAIL  the responses of the provider routes > keeps the sentence of a refused address in the words of the owner
   -> expected [ 'ALLOW_LOCAL_PROVIDERS' ] to deeply equal []
 FAIL  the pages of the panel > keeps the sentence of a refused address in the words of the owner in both languages
   -> Cannot read properties of undefined (reading 'length')
 FAIL  connecting a provider > answers a refused address in the words of the owner and links For the installer
   -> Unable to find an accessible element with the role "link"

 Test Files  2 failed (2)
      Tests  4 failed | 16 passed (20)
```

Commits: `c384770` (the test, red) and `7685414` (the fix).

### The fix

- `lib/admin/provider-request.ts`: `PROVIDER_ADDRESS_ERROR` keeps the reason and loses the name of the variable; the
  answer of the routes is `{"status":"address_not_allowed","ok":false,"reason":"address_not_allowed"}` plus that
  sentence in the words of the owner.
- `lib/i18n/admin.ts`: `reasonAddressNotAllowed` says that a local provider needs whoever installs Cited to allow
  local providers, and `reasonAddressNotAllowedLink` ("For the installer" / "Para quien instala") names the page, in
  English and in Spanish.
- `components/admin/ProviderConnect.tsx`: the reason `address_not_allowed` renders that link to `/admin`, the only
  page that names a variable of the environment.

### Green after the fix

```text
 Test Files  2 passed (2)
      Tests  20 passed (20)
```

The whole suite after this fix: 54 files, 477 tests, green.

## 11.4 Major (the evidence of 10.6): a reader that reads the store read-only

**The finding.** `scripts/store-state.ts` called `openStore()` before reading, and `openStore()` creates every table
the schema declares. Codex reproduced it with `STORE_STATE_BEFORE exists=False` on a path that did not exist: the
command created the store and migrated it, so the state it printed as "before" was the state after the current code.
The `[x]` of 10.6 was therefore without the evidence its text asks for.

### Red before the fix

Command:

```text
npx vitest run tests/store-state.test.ts --reporter=verbose
```

Output (with the reader out of the worktree):

```text
 FAIL  the reader of the state of the store > does not create a store that is not there
   -> expected 'store: <a temporary path>...' to contain 'exists: false'
 FAIL  the reader of the state of the store > leaves the tables of the version before exactly as they were
   -> expected [ 'business', 'conversations', ...(15) ] to deeply equal [ 'documents', 'passages', ...(1) ]

 Test Files  1 failed (1)
      Tests  2 failed | 1 passed (3)
```

The second failure is the whole Major: a store with the two tables written by the test came out of the reader with
eighteen, because the reader opened it with the application.

Commits: `aaa1308` (the test, red) and `8e57547` (the fix).

### The fix

- `lib/store/tables.ts`: the list of the tables of the schema in a module that imports nothing, so the reader can know
  the names without loading the libSQL client; `lib/store/index.ts` re-exports it.
- `scripts/store-state.ts`: it opens the file with `node:sqlite` and `readOnly: true`, it reports `exists: false` and
  every declared table as `MISSING` when the file is not there, and it never calls `prepareStorePath()` (which creates
  the folder) nor `openStore()`. A remote store is refused with a sentence instead of being created.

### Green after the fix

```text
npx vitest run tests/store-state.test.ts --reporter=verbose
 Test Files  1 passed (1)
      Tests  3 passed (3)
```

The whole suite after this fix: 55 files, 480 tests, green.

### The state before and after, with every command

The store before is created by the code of the base of this change in a temporary worktree, ingested with the
deterministic `fake` embeddings provider (no network), and then read with the reader of this branch. `main` is at
`03101b6` today and carries the tables of the voice change, so the worktree is of `c07640b`, the base this change
declares and the state the review measured (`git show 71f08f0:lib/store/index.ts` declares the same seven tables).

```text
$ git worktree add --detach .tmp-store-before c07640b
Preparing worktree (detached HEAD c07640b)
HEAD is now at c07640b Write the product context of Cited: the owner, the visitor, and what the design must honour

$ cd .tmp-store-before
$ $env:DATABASE_URL="store-before.sqlite"; $env:EMBEDDINGS_PROVIDER="fake"; node scripts/ingest.ts samples
ingested README.txt (txt, no pages, 1 passages)
ingested bike-workshop-policies.md (md, no pages, 5 passages)
ingested cafe-la-horquilla.md (md, no pages, 4 passages)
ingested notas-del-negocio.txt (txt, no pages, 1 passages)
documents 4, passages 11, skipped 0, store store-before.sqlite, 93 ms, rss 110 MB

$ cd ..
$ node scripts/store-state.ts .tmp-store-before/store-before.sqlite
store: <the repository>\.tmp-store-before\store-before.sqlite
exists: true
bytes: 98304
tables: 9 (plus the 5 of the full-text index)
  documents rows=4
  passages rows=11
  passages_fts rows=11
  rate_limits rows=0
  model_calls rows=0
  conversations rows=0
  login_attempts rows=0
  business rows=0
  provider_settings rows=0 (added by this change)
  provider_tests rows=0 (added by this change)
  document_index rows=0 (added by this change)
  provider_settings MISSING
  provider_tests MISSING
  document_index MISSING
rows of the tables this change added: 0
```

The same file, copied and opened by the code of this branch:

```text
$ Copy-Item .tmp-store-before/store-before.sqlite .tmp-store-before/store-after.sqlite
$ node --input-type=module -e "import { openStore } from './lib/store/index.ts'; const store = await openStore('.tmp-store-before/store-after.sqlite'); store.close()"
opened by the code of this branch

$ node scripts/store-state.ts .tmp-store-before/store-after.sqlite
store: <the repository>\.tmp-store-before\store-after.sqlite
exists: true
bytes: 126976
tables: 12 (plus the 5 of the full-text index)
  documents rows=4
  passages rows=11
  passages_fts rows=11
  rate_limits rows=0
  model_calls rows=0
  conversations rows=0
  login_attempts rows=0
  business rows=0
  provider_settings rows=0 (added by this change)
  provider_tests rows=0 (added by this change)
  document_index rows=0 (added by this change)
rows of the tables this change added: 0

$ git worktree remove .tmp-store-before --force
$ git worktree prune
$ git status --short
(no output)
```

The three tables this change adds are **absent before** (each one printed as `MISSING` over a store the code of the
base created) and **present and empty after** (each one with `rows=0 (added by this change)` over the same file opened
by this branch). An ingest of the same copy fills `document_index` (one row per document it indexes); the state of the
migration itself, which is what 10.6 claims, leaves the three empty. Nothing of the round lives in the worktree: it is
removed and pruned, and `git status --short` is empty.

## 11.5 Minor: the delivery names the final HEAD and the count

The delivery `katalis-dev/tasks/entrega-community-12.md` (outside the repository, which is why it does not change the
count it records) names the closing HEAD of this round and the number of commits over the contract read with the
command the review asked for:

```text
git rev-list --count main..HEAD
```

Its header keeps the count of the earlier rounds corrected and adds the one of this one, with the command next to it
so the number can be read again at any time instead of being taken on faith.

## 11.6 The battery

### Windows

```text
$ npm test
 Test Files  55 passed (55)
      Tests  480 passed (480)
   Duration  26.76s

$ npm run typecheck
✓ Types generated successfully

$ npm run lint
(no output, exit 0)

$ npm run test:e2e
  30 passed (40.7s)

$ npx openspec validate --all --strict
Totals: 11 passed, 0 failed (11 items)

$ git diff --check main...HEAD
(no output, exit 0)
```

### In a `node:24` Linux container, from a clean clone

```text
$ git clone --no-hardlinks <the worktree of this branch> <a temporary directory outside the repository>
$ git -C <that directory> log --oneline -1
8e57547 Read the state of the store read-only, without creating or migrating it
$ git -C <that directory> status --short
(no output)

$ docker run --rm -v "<that directory>:/app" -w /app node:24 sh -c "npm ci --no-audit --no-fund && npx vitest run --reporter=dot"
v24.21.0
 Test Files  55 passed (55)
      Tests  478 passed | 2 skipped (480)
   Duration  123.16s

$ git -C <that directory> fetch origin feature/provider-keys-in-panel
$ git -C <that directory> merge --ff-only FETCH_HEAD
$ git -C <that directory> log --oneline -1
91e74dc Close the second review: every notation, the pinned address, the owner words and a read-only state

$ docker run --rm -v "<that directory>:/app" -w /app node:24 sh -c "npx vitest run --reporter=dot"
v24.21.0
 Test Files  55 passed (55)
      Tests  478 passed | 2 skipped (480)
   Duration  99.68s
```

The clone was made at `8e57547`, the last commit that touches code, and it was fast-forwarded to the closing commit
`91e74dc` — which only adds this report, the marks and the state of the loop — before the run of the end, so what the
container ran is the tree that ships. The two skipped tests are the two of `tests/design-system.test.ts` that were
already skipped on Linux before this change. The clone is clean: nothing of the round lives outside a commit.

### gitleaks, one commit at a time

```text
$ gitleaks git --log-opts "<the sha> -1" --redact --no-banner
```

| Commit | What it carries | gitleaks over that commit |
| --- | --- | --- |
| `306ff59` | the state of the loop in RUNNING | no leaks found |
| `e88bf24` | 11.1: the table of every notation, red | no leaks found |
| `e519fd1` | 11.1: the classification with `BlockList` | no leaks found |
| `da576c1` | 11.2: the name that changes its answer, red | no leaks found |
| `798df65` | 11.2: the pinned transport | no leaks found |
| `c384770` | 11.3: the words of the owner, red | no leaks found |
| `7685414` | 11.3: the reason code and the link | no leaks found |
| `aaa1308` | 11.4: the reader of the state, red | no leaks found |
| `8e57547` | 11.4: the reader read-only | no leaks found |
| the closing commit | 11.5 and 11.6: this report, the marks and the state of the loop | no leaks found (`HEAD -1`) |

The hook of the repository (`.githooks/pre-commit`) ran for every one of them, and this table is its output read again
one commit at a time.

### What the round touched

Nine commits of work plus the closing one; `git diff --stat ca59b1f..HEAD` covers the four fixes, the four new test
files, the three existing tests, the transport, the list of tables and the reader. No `.env` was opened, nothing was
pushed, nothing was archived, and no commit landed in `main`.

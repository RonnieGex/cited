# Step 9 report - bootstrap: the fixes of the adversarial review 00

- Date: 2026-09-28
- Change: bootstrap (OpenSpec 0 of `tasks/plan-rag-abierto.md` v2)
- Branch: `feature/bootstrap`
- Agent: deepseek-harness
- Review: `tasks/revision-community-00.md`, verdict FAIL with 0 blockers, 5 majors and 3 minors
- Contract: `openspec/changes/bootstrap/tasks.md` as corrected by Fable after the review
- Commits of this round: `c693c98` (the state file back to RUNNING), `ac80073` (the canonical tree and the agent
  links), `7a5ac97` (the fixes), plus the closing commit that carries this report

## Scope

The nine open tasks of the corrected contract, each one tied to the review item it closes:

| Task | Review item | What was done |
|---|---|---|
| 2.8 | Major 2 | `openspec/specs/.gitkeep` is versioned and the three tool folders link to `ai-specs/agents` with mode `120000`, verified in a clean clone |
| 2.9 | Major 4 | The personal paths left the normative document and the two reports, and a test now fails when a tracked text file carries one |
| 5.3 | Major 5 | `SECURITY.md` documents the private vulnerability reporting of GitHub as the channel and states the policy of the role address |
| 6.8 | Minor 3 | `docs/security.md` describes the local hook as a developer aid and the pipeline as the enforced scan |
| 7.5 | Major 1 | The CI secret scan installs the gitleaks command line and walks every commit, proved with a synthetic history |
| 7.6 | Minor 1 | `engines.node` admits only the versions the locked dependencies accept |
| 9.6 | Major 3 | The state of the database before and after, with the exact commands |
| 13.1 | Major 3 | Every `[x]` of the contract names its report |
| 13.2 | Major 3 and the closing rules | The real commits are listed, with no push, no commit in `main` and no archive |

## 2.8 The canonical tree and the agent links survive a clean clone

The spec `repository-bootstrap` promises `openspec/specs/`, but the directory existed only because it was empty: Git
does not version directories. The three tool folders carried the OpenSpec skills and commands and none of them reached
the canonical definitions of `ai-specs/agents/`, which the SDD standard requires to be verified.

What changed:

- `openspec/specs/.gitkeep` is versioned (the empty blob `e69de29bb2d1d6434b8b29ae775ad8c2e48c5391`), so the
  directory exists in every clone.
- `.claude/agents`, `.codex/agents` and `.cursor/agents` are Git symbolic links, mode `120000`, whose content is
  `../ai-specs/agents`.
- `docs/base-standards.md` and `ai-specs/README.md` say that the `agents` entry of each tool folder is a link and that
  `ai-specs/agents/` is the only place where an agent definition is written.

The account of this machine cannot create an operating system symbolic link (Windows asks for administrator rights)
and `core.symlinks` is `false`, so the entries were written directly into the Git index with the exact mode. Git keeps
the mode on later `git add`, and the entry is checked out as a real symbolic link wherever symlinks are enabled; on a
Windows clone without that privilege it becomes a plain file whose content is the target path, which is the documented
behaviour of `core.symlinks=false`. `git status` stays clean in both cases.

Clean clone of `7a5ac9791ab8da4b7e914c92f608d87784b89356`, created with `git clone --no-local` and deleted afterwards:

```
git -C <clone> ls-files -s .claude/agents .codex/agents .cursor/agents
  -> 120000 31cca693efbc8a9812c7fd22e14757b7f8c14b38 0   .claude/agents
  -> 120000 31cca693efbc8a9812c7fd22e14757b7f8c14b38 0   .codex/agents
  -> 120000 31cca693efbc8a9812c7fd22e14757b7f8c14b38 0   .cursor/agents

git -C <clone> cat-file -p 31cca693efbc8a9812c7fd22e14757b7f8c14b38
  -> ../ai-specs/agents

git -C <clone> ls-files 'openspec/specs/**'
  -> openspec/specs/.gitkeep

specs_directory_exists=True
(clone)/openspec/specs/.gitkeep length=0

git -C <clone> status --short
  -> (clean)

git -C <clone> config core.symlinks
  -> false

git ls-files -s .claude/agents .codex/agents .cursor/agents   (in this repository)
  -> 120000 31cca693efbc8a9812c7fd22e14757b7f8c14b38 0   .claude/agents
  -> 120000 31cca693efbc8a9812c7fd22e14757b7f8c14b38 0   .codex/agents
  -> 120000 31cca693efbc8a9812c7fd22e14757b7f8c14b38 0   .cursor/agents
```

Before the fix, the review measured `git ls-files 'openspec/specs/**'` as 0 files, `fresh_clone_specs_directory_exists`
as false and `reparse_point_count` as 0. The three measurements are now the opposite, and the link mode is the one the
contract asks for.

## 2.9 No personal path of the author's machine in the repository

The test came first. `tests/personal-paths.test.ts` reads the list of tracked files with `git ls-files -z`, ignores
binary content, and fails when a tracked text file carries a home directory of a development machine: a drive letter, a
`Users` segment and a user name. A second assertion fails on the bare `Users` prefix of a Windows profile outside the
contract file that states the rule, which is `openspec/changes/bootstrap/tasks.md`: its text belongs to Fable, it
carries the prefix as the rule itself with no user name after it, and it was not touched. The test builds its
expressions by concatenation, so the test file does not trip its own check.

Red run, before any fix:

```
npm test -- tests/personal-paths.test.ts
  -> Test Files  1 failed (1)
  ->      Tests  2 failed | 1 passed (3)
  -> AssertionError: expected [ 'docs/base-standards.md', …(2) ] to deeply equal []
  -> [ "docs/base-standards.md",
       "openspec/changes/bootstrap/reports/2026-09-28-step-0-branch.md",
       "openspec/changes/bootstrap/reports/2026-09-28-step-3-tests.md" ]
  -> exit 1
```

The three files are exactly the three the review named in Major 4. What changed:

| File | Before | Now |
|---|---|---|
| `docs/base-standards.md` | The normative rule of section 0 ordered the reader to open a file through an absolute path of the author's machine | It points at `docs/katalis-sdd-standard.md` inside the repository, the copy that is already versioned |
| `reports/2026-09-28-step-0-branch.md` | The repository line carried the absolute path | It names the community repository of the suite and its remote |
| `reports/2026-09-28-step-3-tests.md` | The pasted output of `npm test` carried the absolute root of the project | The line reads `<repository root>`, and the report itself says that the path was replaced, so the record stays honest |

`docs/katalis-sdd-standard.md` is a byte-identical copy of the canonical standard of the suite and was not edited; its
byte identity still holds:

```
(Get-FileHash docs\katalis-sdd-standard.md).Hash
  -> F001DDBFE992F124AA6324A394BE71C2190A96D4C2F3E07AB31DE0D3108EBA3E
(Get-FileHash tasks\estandar-sdd-agentes.md).Hash
  -> F001DDBFE992F124AA6324A394BE71C2190A96D4C2F3E07AB31DE0D3108EBA3E
```

Green run of the whole unit suite after the fix:

```
npm test
  -> RUN  v5.0.2 <repository root>
  -> Test Files  2 passed (2)
  ->      Tests  5 passed (5)
  -> exit 0
```

## 5.3 SECURITY.md and the amended plan

`SECURITY.md` names the private vulnerability reporting of GitHub as the channel, with the exact address of the form,
and states the policy of the role address:

```
Report it privately through **Security -> Report a vulnerability** on this repository
(https://github.com/RonnieGex/katalis-responde-community/security/advisories/new), which is the private
vulnerability reporting channel of GitHub. Never in a public issue.

There is no reporting email address yet. The role address `security@katalis.dev` is added to this file when the
mailbox exists, and it will never be a personal address. Until then, the private advisory of GitHub is the only
channel.
```

Measurements over the file:

```
[regex] email-like matches in SECURITY.md
  -> 1 match: security@katalis.dev
private_advisory_url_present=True
personal_domain_present=False
```

The single match is the policy sentence that says the mailbox does not exist yet; it is not offered as a channel. No
personal address is present, which is what the amended section 3.7 of the plan requires. The task text asks for the
private vulnerability reporting of GitHub to be enabled as well. Enabling it is a write against the repository
settings, and this mission forbids any remote operation. Two read-only probes were attempted and neither returns the
state:

```
gh api repos/RonnieGex/katalis-responde-community --jq '.security_and_analysis'
  -> null (the field is not returned for this token)
gh api repos/RonnieGex/katalis-responde-community/private-vulnerability-reporting
  -> 404 Not Found
```

So the channel is documented in the repository, the setting itself stays as an owner action (Settings, Code security,
Private vulnerability reporting), and it is listed in the Issues of this report instead of being claimed as done.

## 6.8 The hook is an aid, the pipeline is the control

`docs/security.md` claimed as `Done` that no secret can be committed by accident, while the hook only exists after
`npm run hooks:install` and can be skipped. The row and a paragraph now describe the real condition:

```
| No secret is committed | Enforced by the pipeline | the blocking `secrets` job of `.github/workflows/ci.yml` scans every commit of the history with the gitleaks command line over the rules of `.gitleaks.toml` |

The local hook of `.githooks/pre-commit` is a developer aid, not a control: it only exists after
`npm run hooks:install`, it needs gitleaks on the `PATH` and it can be skipped with `git commit --no-verify`. The
enforced scan is the pipeline, which scans the full history on every push and every pull request and blocks the job
when it finds a secret. A fork that never installs the hook is still covered by its own pipeline.
```

The row of `SECURITY.md` inside section 8 was corrected in the same pass: it names the private advisory channel and
the policy of the role address instead of an address that does not exist.

## 7.5 The CI secret scan walks the whole history

The action was removed. The job now installs the gitleaks command line, pinned by version and by SHA-256, and runs it
over every commit:

```yaml
  secrets:
    name: Secret scan
    runs-on: ubuntu-latest
    env:
      GITLEAKS_VERSION: 8.30.1
      GITLEAKS_SHA256: 551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb
    steps:
      - name: Check out the full history
        uses: actions/checkout@v7
        with:
          fetch-depth: 0
      - name: Install the gitleaks command line
        run: |
          curl --fail --silent --show-error --location \
            --output gitleaks.tar.gz \
            "https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz"
          echo "${GITLEAKS_SHA256}  gitleaks.tar.gz" | sha256sum --check --strict
          tar --extract --gzip --file gitleaks.tar.gz gitleaks
          sudo install --mode 0755 gitleaks /usr/local/bin/gitleaks
          gitleaks version
      - name: Scan every commit of the history
        run: gitleaks git --redact --no-banner --exit-code 2 -c .gitleaks.toml
```

`gitleaks git` without `--log-opts` walks every commit reachable from the checked-out revision, which is the same
command `npm run secrets:scan` runs in a clone, so the local check and the pipeline check can no longer drift. The
version and the digest were read from the release of the tool (8.30.1 is the version installed on this machine); the
asset name and the checksum come from the published release, and the pipeline refuses to install if the tarball does
not match the digest.

Synthetic proof, run in a temporary repository that was deleted afterwards. Four commits: the first adds a fake
credential, the second removes it, and the last two are clean. The credentials were invented with high entropy; the
first attempt with a low entropy value returned `no leaks found`, which is the normal behaviour of the entropy checks
of gitleaks and is recorded here as a false start.

```
git log --oneline
  -> 6e3b648 edit the clean file
  -> 08fa9f7 add a clean file
  -> 7448f23 remove the fake credential
  -> ad4fae8 add a fake credential

gitleaks git --redact --no-banner --exit-code 2 -c .gitleaks.toml
  -> INF 4 commits scanned.
  -> INF scanned ~1009 bytes (1.01 KB) in 195ms
  -> WRN leaks found: 2
  -> exit=2
  -> finding rule=github-pat commit=ad4fae8 file=secrets.txt secret=REDACTED
  -> finding rule=generic-api-key commit=ad4fae8 file=secrets.txt secret=REDACTED

gitleaks git --redact --no-banner --exit-code 2 -c .gitleaks.toml \
  --log-opts "--no-merges --first-parent 08fa9f7^..6e3b648"
  -> INF 2 commits scanned.
  -> INF scanned ~18 bytes (18 bytes) in 190ms
  -> INF no leaks found
  -> exit=0
```

The second command is the range the action builds for a `push` or a `pull_request` event. It covers the two clean
commits and leaves the secret of `ad4fae8` invisible, which is exactly the gap Major 1 reproduced; the first command
sees it and fails the job. The step 6 report carries a correction note pointing at this one, because its table
described the job as it was.

## 7.6 The Node range belongs to the locked dependencies

The root `engines` admitted `>=24.0.0 <25.0.0`, but the locked tree rejects part of that range. The strictest
constraint inside the Node 24 line comes from the jsdom family:

```
node_modules/jsdom@30.1.1                         engines.node  ^22.22.2 || ^24.15.0 || >=26.0.0
node_modules/@asamuzakjp/css-color@7.1.2          engines.node  ^22.22.2 || ^24.15.0 || >=26.0.0
node_modules/@asamuzakjp/dom-selector@9.2.2       engines.node  ^22.22.2 || ^24.15.0 || >=26.0.0
node_modules/w3c-xmlserializer@6.0.0              engines.node  ^22.22.2 || ^24.15.0 || >=26.0.0
```

Every other constraint of the 550 packages is wider than that one inside Node 24. The intersection of the whole
lockfile with the line the plan supports (Node 24, `.nvmrc` says `24`) is `>=24.15.0 <25.0.0`, and that is the value
now written in `package.json` and in the root entry of `package-lock.json`. The three documents that state the
requirement were updated together: `README.md` in its two languages and `docs/development-guide.md` now say Node 24,
never older than 24.15.

Honest record of the environment: this machine runs Node v24.11.0, which is below the new floor, so `npm ci` prints
five `EBADENGINE` warnings now: the four packages of the review plus the root package itself. The install still exits
0, installs 550 packages and audits 551 with 0 vulnerabilities, and every check is green. The pipeline is not affected:
it sets Node up from `.nvmrc`, and `actions/setup-node` resolves `24` to the latest 24.x, which is 24.21.0 at this
date. Upgrading the local Node is an owner action and it is listed in the Issues.

## 9.6 The state of the database, before and after

This change has no database. Instead of writing "not applicable", the state was measured with exact commands before
the pipeline ran and again after it finished.

Before:

```
git ls-files | Select-String -Pattern '\.(db|sqlite|sqlite3|sql|dump)$'
  -> (empty)
git ls-files | Select-String -Pattern '^(migrations|prisma|drizzle)/'
  -> (empty)
node -e "datastore packages inside dependencies and devDependencies"
  -> datastore_hits=[]
  -> total_declared=18
Get-ChildItem -File | Where-Object { $_.Extension -in '.db','.sqlite','.sqlite3' }
  -> (empty)
```

After the full pipeline (`npm ci`, types, lint, unit tests, build, end to end, audit, secret scan and OpenSpec):

```
tracked db/migration files:
datastore_hits=[]
datastore files in the working tree root:
```

The eighteen declared packages are `next`, `react`, `react-dom` and the development tooling; none of them is a client
of a datastore, and no tracked file is a database, a dump or a migration. The suites did not create one. The first
store of the project arrives with `core-libsql-hybrid-search` (change 2), which is where the task will run again.

## 13.1 Every checked task names its report

At the start of this round the contract had 63 tasks marked `[x]`, and 30 of them carried no reference to a report,
which is the gap the review measured as 33 of 66 in the previous revision. A parser over the file lists the tasks and
checks each block for a report path:

```
total=72 checked=72 open=0
--- checked WITHOUT report reference ---
(none)
```

The 30 missing references were appended after the existing evidence, without touching the text of any task. The
mapping used, by step of the same change:

| Tasks | Report added |
|---|---|
| 0.3 | `2026-09-28-step-0-branch.md` |
| 1.1, 2.5 | `2026-09-28-step-1-specboot.md` |
| 3.2 | `2026-09-28-step-3-tests.md` |
| 4.1, 4.2, 4.3, 4.5 | `2026-09-28-step-2-app-skeleton.md` |
| 5.2, 5.4, 5.5 | `2026-09-28-step-4-license-and-community.md` |
| 6.2, 6.3, 6.4, 6.5, 6.6 | `2026-09-28-step-5-security-day-one.md` |
| 7.1, 7.2, 7.3 | `2026-09-28-step-6-ci-and-dependabot.md` |
| 9.1, 9.3, 9.4, 10.2, 11.1, 11.2 | `2026-09-28-step-7-local-verification.md` |
| 12.1, 12.2, 12.3 | `2026-09-28-step-8-documentation.md` |
| 13.1, 13.2, 13.3, 13.4 | `2026-09-28-step-9-review-fixes.md` |

Two of them need a word. Task 11.1 asks for the Chromium install: the measured version, 1.63.0, is in the toolchain
table of the step 7 report, which is also the report of the suite that uses it. Tasks 13.1 and 13.2 had no reference
because the previous round closed them before this report existed; the reference was appended so that no `[x]` of the
file is left without its evidence. The nine tasks of this round already carried the reference that Fable wrote in
their text, and their checkboxes were flipped only after every command below ran.

## 13.2 Commits, no push, no commit in main, no archive

The command the task names cannot resolve in this repository, because `main` is unborn and has no revision:

```
git log --oneline main..feature/bootstrap
  -> fatal: ambiguous argument 'main..feature/bootstrap': unknown revision or path not in the working tree.
```

That is the state step 0 recorded: the branch was created from an empty repository, so nothing was ever committed to
`main` and there is no revision to compare against. The real list, with no hand count, is:

```
git log --oneline
  -> 7a5ac97 fix(bootstrap): correct the review 00 findings in the tree, the pipeline and security
  -> ac80073 chore(bootstrap): version the canonical tree and link the agent folders
  -> c693c98 chore(bootstrap): set the state file to running for the review fixes
  -> 51b57f5 Correct the bootstrap tasks contract after review 00
  -> a175060 docs(bootstrap): keep the state file and the standards in English
  -> 19fae52 chore(bootstrap): record the verified closing commit in the state file
  -> 06a967c docs(bootstrap): report the verification of the change
  -> 9f3770d ci(bootstrap): add the blocking pipeline, CodeQL and Dependabot
  -> c429235 feat(bootstrap): add secret scanning, the threat model and the environment template
  -> 834a4ca feat(bootstrap): license the project under Apache-2.0 and add the community files
  -> d3ffc35 feat(bootstrap): add the Next.js 16 skeleton with its smoke tests
  -> 460dcb8 chore(bootstrap): initialize the OpenSpec workspace and the adapted Katalis standards
```

Every message is in English and every commit is on `feature/bootstrap`. The other three rules:

```
git branch --show-current            -> feature/bootstrap
git rev-parse --verify main          -> fatal: Needed a single revision (main is unborn)
git for-each-ref --format='%(refname)' refs/remotes
  -> (empty): no remote-tracking reference exists, so nothing was pushed or fetched from this clone
git config --get remote.origin.url   -> https://github.com/RonnieGex/katalis-responde-community.git (configured, never contacted)
(Get-ChildItem openspec\changes\archive -Force | Measure-Object).Count
  -> 0: the change was not archived
```

The correction `51b57f5` belongs to Fable and it is in the list because it is part of the branch history; the eight
commits of the previous round are the ones the state file used to list.

## Full local verification of the closing tree

Every blocking command of the pipeline was executed on the tree of `7a5ac97` after the fixes, with `node_modules`
removed by `npm ci` first:

| Command | Exit | Result |
|---|---|---|
| `npm ci` | 0 | `added 550 packages, and audited 551 packages in 26s`; `found 0 vulnerabilities`; five `EBADENGINE` warnings (the four locked packages of Minor 1 and the root package, because this machine runs Node 24.11.0) |
| `npm run typecheck` | 0 | `next typegen && tsc --noEmit`; `Types generated successfully` |
| `npm run lint` | 0 | `eslint .` with no finding |
| `npm test` | 0 | `Test Files 2 passed (2)`; `Tests 5 passed (5)` |
| `npm run build` | 0 | `Compiled successfully in 672ms`; `Finished TypeScript in 1641ms`; routes `/` and `/_not-found` |
| `npm run test:e2e` | 0 | `ok 1 [chromium] › e2e\home.spec.ts:3:5 › home page answers with the product name`; `1 passed (8.5s)` |
| `npm run audit:high` | 0 | `found 0 vulnerabilities` |
| `npm run secrets:scan` | 0 | `INF 11 commits scanned.`; `scanned ~779668 bytes (779.67 KB)`; `no leaks found` |
| `npx --yes @fission-ai/openspec@1.1.1 validate --all --strict` | 0 | `✓ change/bootstrap`; `Totals: 1 passed, 0 failed (1 items)` |

`npm ci` also printed a cleanup warning about a directory it could not remove afterwards inside `node_modules` (a
Windows file lock); the installation completed, the exit code was 0 and the path is not repeated here. The pre-commit
hook scanned each commit of this round and reported `no leaks found`.

## What could not be verified, and why

- **The CI job on GitHub**: nothing is pushed, so the `secrets` job has never run on a runner. Its command was
  executed here and on a synthetic repository, and its YAML is the object of this report. Status: UNKNOWN until the
  first push.
- **CodeQL and the GitHub-side validation of the workflows**: they need a runner, a push and permissions. Status:
  UNKNOWN, as the step 6 report already said.
- **The private vulnerability reporting setting**: the write to the repository settings is out of the mission. The
  read-only probes return `null` and `404`. Status: NOT DONE, owner action.
- **The operating system symlink itself**: this account cannot create one and `core.symlinks` is `false`, so the proof
  is the recorded mode `120000` and the content of the blob in a clean clone. On a Linux or macOS clone, and on
  Windows with developer mode, the same entry is a real symlink. Status: verified to the limit of this machine.

## Issues

- NOT DONE: the private vulnerability reporting of the repository is documented as the channel but its setting cannot
  be enabled from here, because this mission forbids remote operations. Owner action in Settings, Code security.
- RISK: this machine runs Node 24.11.0 and the declared floor is now 24.15.0, the version the locked dependencies
  require, so `npm ci` prints an `EBADENGINE` warning about the root package. The pipeline resolves Node from `.nvmrc`
  and is unaffected.
- RISK: on a Windows clone without the symlink privilege, `.claude/agents`, `.codex/agents` and `.cursor/agents` are
  plain files with the target path inside, so the canonical definitions do not materialise as a folder on that clone.
  Linux, macOS and Windows with developer mode are not affected.
- RISK, inherited and deferred: Minor 2 of the review, the authorship metadata of the history and the two references
  to the name of the private repository, stays deferred to change 7 `docs-deploy-and-launch` by the contract note that
  Fable wrote. Nothing of it was touched here.
- UNKNOWN: CodeQL, the GitHub-side validation of the workflows and the execution of the new secret scan on a runner,
  all for the same reason: nothing was pushed.

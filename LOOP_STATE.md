# LOOP_STATE · Cited

STATUS: DONE
CHANGE: cited-identity-and-readme (OpenSpec)
BRANCH: feature/cited-identity-and-readme
BASE: 5dec3af (main)
AGENT: deepseek-harness
DATE: 2026-09-29

## Objective

Execute `openspec/changes/cited-identity-and-readme/tasks.md`, the contract written by Fable, in order and complete
except section 10. The product is now **Cited, by Katalis**, the name Franc chose, and the README is the calling card
of the repository: a banner, a designed graphic per section in two themes, an honest status table, a quick start that
runs and a Spanish twin.

## What was delivered

- **0.1**: the branch `feature/cited-identity-and-readme` on top of `main` `5dec3af`, `npm ci` clean.
- **1.1, 1.2, 8.1**: the battery before and after, and the proof that the change adds no persistence and that the
  quick start leaves no store file tracked by git.
- **2.1**: `tests/readme.test.ts`, 29 cases covering every scenario of `project-readme` and `product-identity`, run
  red against the old README and the old names before any implementation.
- **3.1**: `Cited` in every tracked file outside `openspec/changes/archive/`, the MODIFIED home page requirement and
  the two tests that assert the name.
- **3.2**: `scripts/render-readme-banner.mjs` with `scripts/readme-banner.html`, the two banners and
  `docs/images/readme-banner.json`.
- **3.3**: `scripts/render-readme-graphics.mjs` with the templates of `scripts/readme-graphics/`, the nine graphics
  in both themes, the demo drawn from the real run of the quick start, the social preview and
  `docs/images/readme-graphics.json`.
- **3.4**: `README.md` and its Spanish twin `README.es.md`, as decisions 3 to 8 and the copy rules of decision 7.
- **4.1**: the whole suite, with only the two assertions of the old name updated.
- **5.1**: every check on Windows and in a `node:24` Linux container, and the weight of `docs/images/`.
- **6.1**: the quick start word for word on a clean clone in a container, the badges with `curl.exe`, and both
  READMEs through the GitHub Markdown API without a token.
- **7.1**: both READMEs rendered by the Markdown API with their local images, nine captures with Playwright at 1280
  and 400 px in light and dark, and `npm run test:e2e` green.
- **9.1**: `docs/readme-assets.md`, plus the standards and the development guide that had to follow the change.
- **9.2**: `katalis-dev/tasks/entrega-community-03.md`, in Spanish, with the captures, every graphic in both themes
  and `## Issues`.

The contract is marked: fifteen boxes `[x]` with their reports, and the four of section 10 untouched because they are
Fable's.

## The defects found and closed

1. **The quick start did not run as written**: the empty template of the environment made the ingest fail with
   `EMBEDDINGS_PROVIDER must be one of openai, ollama, fake`. The two commands now carry the provider in front.
2. **GitHub did not render the badges**: they were inside a raw HTML block, where GitHub does not parse markdown. They
   are plain markdown now.
3. **The contract test broke on Linux**: `git ls-files` lists the agent symbolic links and a link to a directory makes
   `readFileSync` throw `EISDIR`. The test now reads only regular tracked files.
4. **Two reports carried a local path** and `tests/personal-paths.test.ts` caught them; the paths were replaced.
5. **A first attempt at the rename mangled nineteen files**; the diff caught it before any commit and the work was
   redone with a checked script.

## State of the tree

The tree is clean on `feature/cited-identity-and-readme` at `c67d1f8`. `main` still points at `5dec3af`, no remote was
contacted, nothing was pushed and nothing was archived.

## Closing battery

Windows 11, Node `v24.11.0`: `npm test` 11 files and 101 tests passed, `npm run typecheck`, `npm run lint`,
`npm run build`, `npm run test:e2e` (1 test), `npm audit --audit-level=high` (0 vulnerabilities),
`npm run secrets:scan` (77 commits, no leaks found), `openspec validate --all --strict` (5 passed) and
`git diff --check main...HEAD` all exit 0. Linux x64, image `node:24`, Node `v24.21.0`, clean tree outside the
repository: `npm ci` exit 0 and `npm test` 11 files and 101 tests with `--network none`. The images of the README
weigh 0.445 MB against a budget of 3 MB.

## Hard rules respected

- No `.env` file was opened: only the tracked template with empty values.
- No push, no remote, no commit in `main`, no archive.
- No call to a real provider and no call to Turso: the deterministic `fake` provider ran every command.
- No secret, no customer data and no text of the Construye book in any file; no personal path in any tracked file.
- No `MEMORY.md` in any commit.
- No font file enters the repository: Outfit is loaded from Google Fonts at render time.
- UTF-8 with LF in every file written or modified; `git ls-files --eol` reports no `crlf`, no `mixed` and no `bom`.

## Pending and out of scope

- **NOT DONE, reserved for Fable**: section 10 of the contract (rename the GitHub repository to `cited`, update the
  remote and prove that the old URL redirects), the independent review, the merge and the archive.
- **NOT DONE**: the GitHub pipeline itself, because a push is forbidden here; the equivalent battery ran locally on
  Windows and in the disposable `node:24` container.
- **UNKNOWN**: how the CI badge will render once the repository is public, and the behaviour of GitHub under themes
  and widths beyond the 1280 and 400 px of the captures.

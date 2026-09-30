# Development guide

Local commands, ports and environment files of Cited.

## 1. Requirements

| Tool | Version | Why |
|---|---|---|
| Node | 24, never older than 24.15 (`.nvmrc`, `engines` of `package.json`) | the runtime of the application, and the floor the locked dependencies require |
| npm | 11 or newer | installs from the committed `package-lock.json` |
| gitleaks | 8.30 or newer | the pre-commit hook refuses a commit that carries a secret |
| Playwright Chromium | installed by `npx playwright install chromium` | the end-to-end suite |

## 2. First run

```
npm ci
npm run hooks:install
npx playwright install chromium
npm run dev
```

`npm run hooks:install` points `core.hooksPath` at `.githooks` and fails with the installation command when gitleaks
is missing. Without it, a commit with a secret is not scanned.

## 3. Commands

| Command | What it does |
|---|---|
| `npm run dev` | development server on port 3000 |
| `npm run build` | production build |
| `npm run build:e2e` | the build the browser suite drives: `next build` with `KATALIS_VOICE_FAKE_SDK=1`, which resolves `@elevenlabs/react` to the test SDK, and then the guard of that SDK |
| `npm start` | production server after a build (port 3000, `-- --port N` to change it) |
| `npm run typecheck` | `next typegen` and `tsc --noEmit` |
| `npm run lint` | ESLint over the repository |
| `npm test` | Vitest in run mode |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:e2e` | Playwright; it builds with `build:e2e` and starts the servers of the fixed set of ports that `docs/testing.md` lists |
| `npm run verify:no-test-sdk` | fails when the production output carries a marker of the test SDK, or when the browser output carries the real package or the `xi-api-key` header of the provider |
| `npm run verify:test-sdk` | the same guard with the expectation of the end-to-end build, which `build:e2e` runs on its own |
| `npm run texture:orb` | writes `public/voice/perlin-noise.png`, the texture of the Orb, byte for byte |
| `npm run audit:high` | `npm audit --audit-level=high` |
| `npm run secrets:scan` | gitleaks over the whole history |
| `npm run hooks:install` | installs the local git hooks |
| `npm run openspec:validate` | `openspec validate --all --strict` |

Every one of these commands is blocking in the pipeline, except `dev`, `test:watch` and `hooks:install`.

Three more commands are only needed when the README or its corpus changes:

| Command | What it does |
|---|---|
| `npm run ingest -- samples/` | fills the local store with the sample corpus (needs `EMBEDDINGS_PROVIDER`) |
| `node scripts/render-readme-banner.mjs` | renders the two banners and their record |
| `node scripts/render-readme-graphics.mjs` | renders the nine graphics, their record and the quick start of both READMEs |

The two render scripts need Chromium, and the banner needs network access to Google Fonts for the Outfit family.
`docs/readme-assets.md` explains them, their templates and the size budget of `docs/images/`.

One more script writes the captures a delivery shows of the voice panel. It needs the build of `build:e2e` running,
because the conversation of a capture is the test SDK and never the real agent:

```
npm run build:e2e
EMBEDDINGS_PROVIDER=fake CHAT_PROVIDER=fake npm start -- --port 3200
node scripts/render-voice-captures.mjs <the directory of the captures> [http://127.0.0.1:3200]
```

The same build and server give the Orb of the voice teaser of the README: `node scripts/render-readme-orb.mjs`
freezes the real Orb of the panel, recovers its alpha from a shot over black and one over white, and writes
`docs/images/voice/orb.png` with its record; `node scripts/render-readme-graphics.mjs voice-teaser` then draws the
teaser with it.

## 4. Ports

| Port | Used by |
|---|---|
| 3000 | `npm run dev` and `npm start` |
| 3100 | the server of the public app that the browser suite builds |
| 3200 | the manual verification and the captures; `node scripts/render-delivery-captures.mjs` and `node scripts/render-voice-captures.mjs` read it |
| 3210, 3212 | the sites of the widget tests that may embed the chat |
| 3211 | the guided setup walked in Spanish |
| 3213 | the panel of the browser suite |
| 3214 | the panel of the keys of the browser suite |
| 3215 | the panel with the affiliate switch on |
| 3216 | the deterministic provider double of the browser suite, served by one spec at a time |
| 3217 | the guided setup walked in English |

The set of the browser suite is 3100 and 3210 to 3217, and `docs/testing.md` lists it with the suites that use it.

No other service of the machine is touched by this repository.

## 5. Environment files

| File | Tracked | Content |
|---|---|---|
| `.env.example` | yes | every planned variable name with an empty value |
| `.env` | no | the real values of a local run |
| `.env.local`, `.env.production` | no | `.gitignore` ignores `.env*` except the template |

Copy the template and fill in what the feature you are working on needs:

```
Copy-Item .env.example .env
```

`ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` and `VOICE_TOOL_SECRET` are required by the changes that use them. A key is
never committed, never logged and never sent to the browser.

## 6. Repository layout

```
app/                  # App Router: pages and route handlers
components/           # UI of this application
lib/                  # settings, store, models, guards, limits
migrations/           # hand-written SQL migrations
tests/                # Vitest unit tests
e2e/                  # Playwright specs
docs/                 # standards, security and this guide
ai-specs/agents/      # canonical agent definitions
openspec/             # proposals, specs and change reports
scripts/              # local tooling
```

`.claude/agents`, `.codex/agents` and `.cursor/agents` are Git symbolic links to `ai-specs/agents`. A Windows
checkout without the symlink privilege materialises them as plain text files that hold the target
(`core.symlinks=false`), so `tests/personal-paths.test.ts` asks git for the mode of every tracked path
(`git ls-files -s`) instead of trusting the working tree: it checks a link by its target, a regular file by its
content and skips a binary file, and the scan behaves the same on Linux, macOS and Windows.

## 7. Working order

1. Read `docs/katalis-sdd-standard.md` and `docs/openspec-tasks-mandatory-steps.md`.
2. Create the branch: `git switch -c feature/<change>` from `main`. Nothing is born in `main`.
3. Write the failing test.
4. Implement until it passes.
5. Run `npm run typecheck`, `npm run lint`, `npm test` and `npm run build`.
6. Verify the running application with `curl.exe`.
7. Leave the evidence in `openspec/changes/<change>/reports/YYYY-MM-DD-step-N-<name>.md`.
8. Update `docs/` and the `README.md` when what the project is changes.

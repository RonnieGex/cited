## Context

- `git ls-files -s` on `86b250f` lists `.claude/agents`, `.codex/agents` and `.cursor/agents` with mode `120000` and
  target `../ai-specs/agents`. `ai-specs/agents/` holds `backend-developer.md`, `frontend-developer.md` and
  `product-strategy-analyst.md`.
- `docs/development-guide.md:125-129` describes the links and why `tests/personal-paths.test.ts` reads modes from git.
- `docs/answering.md:225-227` already says that the optional prebuilt binaries of sharp are
  `Apache-2.0 AND LGPL-3.0-or-later`; `package-lock.json` pins `@img/sharp-libvips-*` at `1.3.4`.
- There is no `Dockerfile`: the repository ships no `node_modules`.

## Decisions

1. **Copies, not links.** Each link is replaced by a folder with the three files, written by
   `scripts/sync-agents.mjs` (`npm run agents:sync`), which deletes and rewrites the three folders from
   `ai-specs/agents/` so a file removed at the source leaves the copies too. No install step and no hook: a clone works
   as it comes.
2. **The check.** `tests/agent-copies.test.ts` lists `ai-specs/agents/` and each folder, and fails naming the folder
   and the file when a file is missing, extra or has different bytes. It reads the working tree, so it holds on Windows
   and on Linux alike; the files are text with `eol=lf` in `.gitattributes` if the existing rules do not already give
   them LF, so the bytes are the same on every checkout.
3. **The personal-path test keeps working.** `tests/personal-paths.test.ts` keeps reading modes from git; its link
   cases are the fixtures it builds itself, which stay as they are. Its notes and those of
   `docs/development-guide.md` say the repository tracks no link any more.
4. **The notice.** A section "Installed by npm, not shipped" in `THIRD_PARTY_NOTICES.md` names the binaries of sharp as
   the scenario says; `tests/third-party-notices.test.ts` reads the version of `@img/sharp-libvips-*` from
   `package-lock.json` and fails when the section names another.

## Decisions taken by the implementer

(The implementer writes here every decision the contract left open, and copies it to the `## Issues` of the report.)

- `scripts/sync-agents.mjs` takes the root as its first argument and defaults to the repository root, so the test can
  prove the sync in a temporary tree; it refuses a root without `ai-specs/agents/`, a source with no file, and a copy
  that would fall outside the root.
- `tests/agent-copies.test.ts` carries the comparison itself, because the test is the check `npm test` runs, and it
  exercises the sync through `process.execPath` and `scripts/sync-agents.mjs`, which is the command of the npm script.
- `.gitattributes` stays untouched: `* text=auto eol=lf` already gives the copies `text: auto` and `eol: lf`, the same
  the source files carry.
- The notice carries a second row for `@img/sharp-<platform>`, the binding that holds the LGPL part on Windows and
  names the extra MIT of the `wasm32` one, so the row of the version is true on every platform.
- The guard of the notice asks for `installed through` and `next` instead of the literal `through next`, because the
  file writes a package name in backticks; the requirement (the origin is named) is the same.
- The link case of `tests/personal-paths.test.ts` moves to a fixture the file builds itself, with a note that the
  repository tracks no link any more; the rest of the file is not touched.
- Two documents beyond the Impact list are corrected because they stated the links as the state of the repository:
  `docs/base-standards.md` and `ai-specs/README.md`. `docs/katalis-sdd-standard.md` is not edited: its line 40 is the
  bootstrap rule of the suite, and it is reported as a RISK instead.
- The command of Codex of step 6.1 runs through a temporary `.cmd` file whose line is exactly the command of the task,
  because PowerShell does not parse the `<` redirection of the shell the task writes for.
- Vitest on Windows runs as `npx -y -p node@24 node node_modules/vitest/vitest.mjs run`, the form this round was given;
  both Node versions (the one of the PATH and the one of the run) are in every report.

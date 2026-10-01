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

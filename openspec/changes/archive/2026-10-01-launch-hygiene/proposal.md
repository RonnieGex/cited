## Why

Two loose ends of the public launch (item 2p of the queue and the notice of sharp):

1. `.claude/agents`, `.codex/agents` and `.cursor/agents` are Git symbolic links to `ai-specs/agents`. A Windows
   clone without the symlink privilege (`core.symlinks=false`, the default) gets three text files that hold the path
   `../ai-specs/agents`, and Codex stops loading its configuration with `os error 267` ("the directory name is
   invalid"). Every fork made on Windows breaks the same way.
2. `next` installs sharp, whose prebuilt libvips binaries (`@img/sharp-libvips-*`) are `LGPL-3.0-or-later`.
   `docs/answering.md` says so in passing, but `THIRD_PARTY_NOTICES.md`, the file a reader opens for licenses, does not.

## What Changes

- The three agent folders become real folders that hold byte-for-byte copies of `ai-specs/agents`, kept in step by
  `npm run agents:sync` and checked by a test that fails when a copy drifts.
- `THIRD_PARTY_NOTICES.md` gains a section on what npm installs and this repository does not ship: the prebuilt
  binaries of sharp and their LGPL-3.0-or-later.

## Impact

- Repository: `.claude/agents/`, `.codex/agents/`, `.cursor/agents/` (links become folders), `package.json` (one
  script), `scripts/sync-agents.mjs`, `tests/agent-copies.test.ts`, `tests/personal-paths.test.ts` (its notes on links).
- Docs: `docs/development-guide.md` (the notes on the links), `CONTRIBUTING.md` (where agents are edited),
  `THIRD_PARTY_NOTICES.md`.
- Specs: deltas of `repository-bootstrap` and `supply-chain-security`.
- No change to the application.

# Step 6 · The two clones

Task of `tasks.md`: "A fresh clone on Windows with `git -c core.symlinks=false clone` of the branch: the three folders
exist with their three files, and `codex exec --skip-git-repo-check "List the files of .codex/agents" < NUL` run inside
the clone gets past loading its configuration without `os error 267` (paste its first lines; an answer or a message of
the account's usage limit both show the configuration loaded; no other command of Codex). A second clone in a `node:24`
container shows the same three folders. Output in `reports/<date>-step-6-clones.md`".

The code this report verifies is the branch `feature/launch-hygiene` at `f18d03e` ("Mark step 5.1: typecheck, lint,
1026 tests, build in a clean clone, no leaks, 14 specs") for the Windows clone, and at `181f2a3` for the clone the
container copies, which is the clean clone of the build of step 5.1. Every path of a development machine below is
written as `<worktree>`, `<clean clone>` or `<home>`; the outputs were sanitized for that and nothing else.

## The Windows clone

```
git -c core.symlinks=false clone --branch feature/launch-hygiene --single-branch <worktree> <clean clone>
Cloning into '<clean clone>'... done.
git -C <clean clone> rev-parse HEAD
f18d03e31a1875fc6cc445841778cc0ff6f6bdb4
git -C <clean clone> status --short          (no output)
Test-Path <clean clone>/.env      -> False
Test-Path <clean clone>/.env.local -> False
Get-ChildItem <clean clone>/.claude/agents, .codex/agents, .cursor/agents
.claude\agents => backend-developer.md, frontend-developer.md, product-strategy-analyst.md
.codex\agents  => backend-developer.md, frontend-developer.md, product-strategy-analyst.md
.cursor\agents => backend-developer.md, frontend-developer.md, product-strategy-analyst.md
```

The three folders are real folders of the checkout made with `core.symlinks=false`, which is the scenario "A Windows
clone without the symlink privilege" of `repository-bootstrap`.

## The one command of Codex

Inside `<clean clone>`, with its standard input closed, the only Codex command of this change:

```
codex exec --skip-git-repo-check "List the files of .codex/agents" < NUL
```

Its first lines, with the path of the machine replaced by `<clean clone>` and `<home>`:

```
Reading additional input from stdin...
2026-10-01T05:00:50.277004Z ERROR codex_core::session::session: failed to load skill <home>\.codex\skills\imagen\SKILL.md: missing field `description`
OpenAI Codex v0.157.0
--------
workdir: <clean clone>
model: gpt-5.6-sol
provider: openai
approval: never
sandbox: read-only
reasoning effort: high
reasoning summaries: none
session id: 01a0f5d6-2996-7190-9b0d-03e0159eaf94
--------
user
List the files of .codex/agents
```

The session starts and prints its workdir, model, provider and sandbox: the configuration loaded. The string `267` and
the string `os error` appear nowhere in the 266 lines of the run, and the exit code is 0. Codex, inside its read-only
sandbox, walked the tree itself and closed with:

```
codex
En `.codex/agents` hay:

- `backend-developer.md`
- `frontend-developer.md`
- `product-strategy-analyst.md`
```

```
git -C <clean clone> status --short   (no output, the same HEAD f18d03e)
```

The `failed to load skill` and the transport errors of the log are of the personal configuration of the account
(`<home>\.codex` and its MCP servers) and do not touch the project configuration of the clone; the workdir line is the
proof that the three agent folders of the clone were read without `os error 267`, which is the defect item 2p
describes.

## The clone in the `node:24` container

```
docker run --rm -v <clean clone>:/source:ro node:24 bash -lc 'node -v && git --version && git -c safe.directory=/source -c core.symlinks=false clone --quiet --branch feature/launch-hygiene --single-branch /source /tmp/clone && echo CLONED && ls -la /tmp/clone/.codex/agents /tmp/clone/.claude/agents /tmp/clone/.cursor/agents && git -C /tmp/clone rev-parse HEAD && sha256sum ...'
v24.21.0
git version 2.39.5
CLONED
/tmp/clone/.claude/agents:
-rw-r--r-- 1 root root 4017 backend-developer.md
-rw-r--r-- 1 root root 3627 frontend-developer.md
-rw-r--r-- 1 root root 2677 product-strategy-analyst.md

/tmp/clone/.codex/agents:
-rw-r--r-- 1 root root 4017 backend-developer.md
-rw-r--r-- 1 root root 3627 frontend-developer.md
-rw-r--r-- 1 root root 2677 product-strategy-analyst.md

/tmp/clone/.cursor/agents:
-rw-r--r-- 1 root root 4017 backend-developer.md
-rw-r--r-- 1 root root 3627 frontend-developer.md
-rw-r--r-- 1 root root 2677 product-strategy-analyst.md

181f2a39c17e21821b70f6ad6125b947cb2ca54c
58559b624bcd117a7b4c4a56a39152d0b9a0b57a6e350886a0c9f74685557924  /tmp/clone/ai-specs/agents/backend-developer.md
58559b624bcd117a7b4c4a56a39152d0b9a0b57a6e350886a0c9f74685557924  /tmp/clone/.codex/agents/backend-developer.md
58559b624bcd117a7b4c4a56a39152d0b9a0b57a6e350886a0c9f74685557924  /tmp/clone/.claude/agents/backend-developer.md
58559b624bcd117a7b4c4a56a39152d0b9a0b57a6e350886a0c9f74685557924  /tmp/clone/.cursor/agents/backend-developer.md
```

The three folders are folders in the Linux clone too, with the same three files and the same sizes as the working tree
of `<worktree>`, and the SHA-256 of the source and of the three copies is one single value: the copies travel byte for
byte across platforms, which is what step 3.2 predicted from the attributes.

## Verdict

Both clones carry `.claude/agents`, `.codex/agents` and `.cursor/agents` as real folders with the three files, on
Windows with `core.symlinks=false` and inside `node:24`, and Codex loads its configuration in the Windows clone and
answers with the list of `.codex/agents` without `os error 267`. Verified.

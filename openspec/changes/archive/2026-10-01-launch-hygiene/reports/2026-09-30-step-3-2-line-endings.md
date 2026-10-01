# Step 3.2 · The line endings of the copies

Task of `tasks.md`: "`.gitattributes` gives the copies LF if the existing rules do not (decision 2)".

The code this report verifies is `12c77bb` ("Replace the three agent links with real folders written by
agents:sync"), the commit that writes the nine copies. Its report of step 3.1 is `da6f993`.

## Evidence

Windows, in the worktree `<worktree>`:

```
git check-attr -a -- .claude/agents/backend-developer.md .codex/agents/backend-developer.md .cursor/agents/backend-developer.md ai-specs/agents/backend-developer.md
.claude/agents/backend-developer.md: text: auto
.claude/agents/backend-developer.md: eol: lf
.codex/agents/backend-developer.md: text: auto
.codex/agents/backend-developer.md: eol: lf
.cursor/agents/backend-developer.md: text: auto
.cursor/agents/backend-developer.md: eol: lf
ai-specs/agents/backend-developer.md: text: auto
ai-specs/agents/backend-developer.md: eol: lf
```

```
git ls-files --eol .claude/agents .codex/agents .cursor/agents ai-specs/agents
i/lf    w/lf    attr/text=auto eol=lf 	.claude/agents/backend-developer.md
i/lf    w/lf    attr/text=auto eol=lf 	.claude/agents/frontend-developer.md
i/lf    w/lf    attr/text=auto eol=lf 	.claude/agents/product-strategy-analyst.md
i/lf    w/lf    attr/text=auto eol=lf 	.codex/agents/backend-developer.md
i/lf    w/lf    attr/text=auto eol=lf 	.codex/agents/frontend-developer.md
i/lf    w/lf    attr/text=auto eol=lf 	.codex/agents/product-strategy-analyst.md
i/lf    w/lf    attr/text=auto eol=lf 	.cursor/agents/backend-developer.md
i/lf    w/lf    attr/text=auto eol=lf 	.cursor/agents/frontend-developer.md
i/lf    w/lf    attr/text=auto eol=lf 	.cursor/agents/product-strategy-analyst.md
i/lf    w/lf    attr/text=auto eol=lf 	ai-specs/agents/backend-developer.md
i/lf    w/lf    attr/text=auto eol=lf 	ai-specs/agents/frontend-developer.md
i/lf    w/lf    attr/text=auto eol=lf 	ai-specs/agents/product-strategy-analyst.md
```

```
node -e "for each of the twelve files: bytes and count of 0x0D"
.claude/agents/backend-developer.md bytes=4017 CR=0
.claude/agents/frontend-developer.md bytes=3627 CR=0
.claude/agents/product-strategy-analyst.md bytes=2677 CR=0
.codex/agents/backend-developer.md bytes=4017 CR=0
.codex/agents/frontend-developer.md bytes=3627 CR=0
.codex/agents/product-strategy-analyst.md bytes=2677 CR=0
.cursor/agents/backend-developer.md bytes=4017 CR=0
.cursor/agents/frontend-developer.md bytes=3627 CR=0
.cursor/agents/product-strategy-analyst.md bytes=2677 CR=0
ai-specs/agents/backend-developer.md bytes=4017 CR=0
ai-specs/agents/frontend-developer.md bytes=3627 CR=0
ai-specs/agents/product-strategy-analyst.md bytes=2677 CR=0
```

## Decision of the implementer

The existing rule of line 1 of `.gitattributes`, `* text=auto eol=lf`, already gives the nine copies `text: auto` and
`eol: lf`, the same attributes the three files of `ai-specs/agents/` carry, and the nine hold the same byte count as
their source with no `0x0D` byte. The condition of the task ("if the existing rules do not") is therefore false, and
`.gitattributes` is not touched by this change: `git log --oneline -- .gitattributes` keeps `12c77bb` out. Step 6.1
checks the same bytes again on a fresh clone, which is what a checkout without the symlink privilege produces.

## Verdict

The copies travel with LF in the index and in the working tree on `12c77bb`, under the rules the repository already
had. No line was needed in `.gitattributes`. Verified.

# Independent adversarial review: agents README round two

Date: 2026-10-09. Reviewer: independent Codex review agent, separate from the specification author and implementer. Scope: community-readme, docs/agents-readme; Fable's round-two assignment, art review section 3 and UX findings C1-C5. Only this report was written by the reviewer.

Verdict: **PASS** after independent recheck of the corrections below. No open Blocker, Major or Minor implementation finding remains. Commit, archive and final remote CI are separate closure actions.

## Findings resolved during review

| Severity | Finding | Recheck |
|---|---|---|
| Minor | The legend used a monochrome solid square for called-and-answered, while the client used a lime square with a check. | Resolved. The footer now uses the same called, listed and documented status components as the client rows. Final light graphic inspected. |
| Minor | Supporting evidence validation searched the entire transcript for the price, allowing a price appearing only in a prompt or final answer to satisfy the guard. | Resolved. The price must occur in a completed tool result joined by callId to cited_search. Both canonical and supporting transcripts must match transcriptOf(events, prompt), which rejects missing, unmatched and truncated calls/results. |
| Minor | The specification said all legacy graphics stayed unchanged while the roadmap was regenerated for the corrected MCP capability row. | Resolved. The specification explicitly permits that roadmap update and preserves the excluded rounded/glowing graphics. |

## Review coverage

| Review finding | Result |
|---|---|
| Art 1 | Lime check, outlined check and hollow circle distinguish called-and-answered, connected-and-listed and documented-only states. Matching legend now uses the same symbols. |
| Art 2 | Both client-name columns use 26px type and 22px first-row top padding. Their baselines align in both rendered themes. |
| Art 3 / UX C4 | The graphic derives the exact Spanish final answer from the canonical natural plugin events. Markdown emphasis is typeset and [1] becomes a square chip; wording and punctuation are retained. No English paraphrase is presented as a quote. |
| Art 4 / UX C2 | Redundant bold headings removed from both READMEs; graphic headline identifies the four clients and verification date. |
| Art 5 | Repeated caveats removed; adjacent links explain which run supplied the answer and the separate highlighted passage. |
| Art 6 | The left column includes a source panel with the exact highlighted price, document and section. The previous empty lower-left area is used for evidence. |
| Art 7 | Excluded how-it-works, demo and reason graphics remain unchanged. Only agents and roadmap PNGs changed. The roadmap change follows the shared MCP capability row. |
| UX C1 | The DeepSeek row separately links the MCP setup verified by step-10-4 and the native plugin with its main-branch evidence directory. CLI installation is stated explicitly. |
| UX C3 | EN and ES capability rows now describe search and cited answers over authenticated MCP. The shared data and roadmap agree. |
| UX C5 | EN and ES alt text includes the 380-peso cited answer, source document and limited verification scope of Claude Code, Codex and Cursor. |

## Independent checks executed

- `npx -y -p node@24 node node_modules/vitest/vitest.mjs run tests/readme.test.ts`: 45 passed, 0 failed. Repeated after the final guard, legend and specification changes: 45 passed.
- `npx -y -p node@24 node node_modules/eslint/bin/eslint.js scripts/render-readme-graphics.mjs scripts/readme-graphics/agent-evidence.mjs scripts/readme-graphics/manifest.mjs scripts/readme-graphics/data.mjs tests/readme.test.ts`: exit 0.
- PowerShell Get-FileHash comparisons verified that headless-answer.json, headless-answer.txt and the referenced natural search JSON are byte-identical to the dsh-cited evidence reviewed in Task A.
- Get-FileHash verified that the copied public agent-evidence.mjs helper exactly matches dsh-cited/scripts/readme-graphics/evidence.mjs: SHA-256 `211F8B9A764D96DEE66E658E97FA1D9273D6E89C9022A6DA177D41784ECFE077`. No runtime dependency on the sibling checkout was introduced.
- Both agents themes were visually inspected; the final corrected legend was additionally inspected in the light image. The exact answer, source highlight, aligned client names and distinct statuses are readable without clipping.
- `git diff --name-only -- docs/images` showed changes only to agents-dark/light, roadmap-dark/light and the graphics record. The excluded older image families are untouched.
- Read the updated asset and development guides. They identify the public copied records and helper, distinguish the two provenance paths, document selective rendering and require Fable to merge dsh-cited PR #1 before Cited PR #18.

## Implementer evidence inspected

These results were read from the saved artifacts, not independently rerun in this review:

- 2026-10-09-r2-unit.txt: 96 files and 1166 tests passed in 80.15 seconds.
- Database before/after state files and hashes: both `F2CFBFB299FF3CE0914D552E4027993D35DD1B84D11CC85597ED339D5CE7E7F5`.
- 2026-10-09-r2-curl.json: exit 0, real tools/call cited_search result with the sample price passage and structured source fields.
- Round-one verification remains historical evidence, including its older CI run. It is not evidence that round-two remote CI has passed.

## Issues

- NOT DONE: Final archive, secret scan, commit, push and required remote CI checks remain implementer closure work at this review point.
- RISK: Main-branch plugin evidence links depend on the specified merge order. Fable must merge dsh-cited PR #1 before Cited PR #18; neither merge is authorized to this reviewer.

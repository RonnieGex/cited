# Step 6: historical evidence and verification handoff

## Historical Hermes evidence

The private coordination workspace contains `tasks/evidencia-hermes-cited/` and `tasks/aceptaciones.md`, section
`2026-10-09 · Cited en el Hermes de Franc (pendiente de firma)`. That acceptance record attributes the earlier Hermes
update, successful connection, desktop answer and quote generation to Fable's session on the pre-round-2 build.

Artifact inventory independently checked by Codex with `Get-ChildItem ... -File | Get-FileHash -Algorithm SHA256`:

| Artifact | SHA-256 |
| --- | --- |
| `hermes-escritorio-conector-cited.jpg` | `3c74f97ee26a864766a0356a5bfdf04bc546f370fa72f19362c4c2f276fc2a41` |
| `hermes-escritorio-respuesta-380.jpg` | `4c74177a81081ff241735d74afcad3992d6226446f2c4ee7550eef40233f9850` |
| `cotizacion-juan-perez.pdf` | `727ec3a7035048fe1a3e2569c2dd6719cdeb262f0609165d362ded0dbb900ec2` |
| `q1-precio.jsonl` | `afab663a21a9f36667ccf76cd3b99b536ecc7acb9da28f77f32f8436e5d3552c` |
| `q2-precio-con-skill.jsonl` | `c5916326175b26024e9d5849d76bab4080de2465da362e8a4ec3258c2952227a` |

Existence and hashes are verified. Historical CLI output, screenshot content, PDF correctness, round-1 red test and
round-1 build are **not independently reproduced by Codex**. These private artifacts are not copied into this public
repository. Round-2 verification uses the reproducible route tests and isolated HTTP build recorded in this change.

## Implementation verification, not an independent review

Applied `openspec-verify-change` to this named change. `openspec status` and `openspec instructions apply` identify all
four artifacts. Completeness, correctness and coherence mapping:

| Requirement | Implementation | Evidence |
| --- | --- | --- |
| Stateless transport and body negotiation | `app/api/mcp/route.ts`, existing MCP server | Existing 50 MCP cases and real HTTP initialization |
| Valid individual initialize exception | `isInitialize` predicate | Negative envelopes, string/integer IDs, preserved body version and no dispatch |
| Bounded POST read | `lib/mcp/body.ts`, route error mapping | Exact/overflow streams, 10 s fake-clock deadlines, real HTTP 408/413, guard and cleanup assertions |
| Documentation and evidence | `docs/mcp.md`, design, tasks and reports | Commands and results in step 2, step 4 and step 5 |

No implementation mismatch found by these checks. This is implementer verification and does not issue an independent
adversarial PASS. Fable's subsequent review and archive remain pending by the explicit assignment. The base spec is
not prematurely synchronized. No frontend code changed; the existing Playwright suite is checked through PR CI.

## Issues

- NOT DONE: Fable's independent adversarial review and subsequent archive, deliberately reserved for that handoff.
- UNKNOWN: independently reproducing the historical Hermes desktop/PDF session; evidence is attributed to its source.

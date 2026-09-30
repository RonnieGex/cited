# Step 3: the implementation, index of the three reports (tasks 3.1 to 3.4)

Implementer: Sonnet 5.5. Date: 2026-09-29. This file exists because the marks of 3.1 to 3.4 in `tasks.md` cite
`reports/2026-09-29-step-3-implementation.md` and the evidence of step 3 was written in three reports, one per surface
(decision 31 of `design.md`, finding 39 of the third review). It holds no output of its own: each row points at the report
that does, and at the commits that carry the work. Every commit below exists on `feature/brand-identity-ui` and passed the
gitleaks hook (`INF no leaks found`).

| Task | What | Report | Commits |
|---|---|---|---|
| 3.1 | The tokens, `app/brand.css`, `lib/brand/highlight.ts`, `components/brand/` (decisions 1 to 5) | [`2026-09-29-step-3-implementation-foundation.md`](2026-09-29-step-3-implementation-foundation.md) | `fc33b85` (tokens and `brand.css`), `69bd79b` (`highlightLast`, `Wordmark`, `CitationMark`, the highlighter) |
| 3.2 | The kit: `Button` ghost and sizes, `SectionTitle`, `LanguageSwitch` tones, the kit page (decisions 6 and 13) | [`2026-09-29-step-3-implementation-foundation.md`](2026-09-29-step-3-implementation-foundation.md) | `0867d16` (ghost, `sm`, eyebrow, tones), `4b8745a` (the kit page) |
| 3.3 | The panel workspace and the split sign-in (decisions 7 and 8) | [`2026-09-29-step-3-implementation-panel.md`](2026-09-29-step-3-implementation-panel.md) | `253aaf6` (the ink column), `d29e8eb` (the split shell), `ec52194` (quiet marks), `dcd6381` (the pages under the shell) |
| 3.4 | The public page: the band, the headline, the ledger, the waiting bar, the sticky ask, the embed strip (decisions 9 to 12) | [`2026-09-29-step-3-implementation-public.md`](2026-09-29-step-3-implementation-public.md) | `65567b5` (marks, passage, markers), `fb7a2c2` (the public surface), `fe73e3d` (one row on a phone) |

The tests that came first for these four tasks are in `2026-09-29-step-2-tests-first.md` (and its three split reports), and
the review of what changed afterwards is `2026-09-29-step-12-reintegration.md` and the `step-12-review-fixes-*` reports.
The round of the amendment (section 10) rewrites parts of what this step built; those changes are in the `step-10-*`
reports, each with its own commit.

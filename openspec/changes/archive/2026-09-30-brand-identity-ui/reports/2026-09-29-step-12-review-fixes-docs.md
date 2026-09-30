# Step 12, review fixes: docs

Implementer: Sonnet 5.5. Date: 2026-09-29. Area owned: `DESIGN.md`, `docs/`, `README.md`, `README.es.md`, `docs/images/`
and the delivery `katalis-dev/tasks/entrega-community-14.md` (outside this repository). The tests of the documents,
`tests/design-md.test.ts`, `tests/readme.test.ts` and `tests/design-system.test.ts`, were touched because the findings
name them. Every command ran from the root of the worktree of the change. Only the vitest files of this area were run.
`tasks.md`, `design.md` and the specs are untouched.

## Commits

| Commit | What |
| --- | --- |
| `9d60a56` | Sign the Spanish README with Hecho por Katalis beside the flame |
| `027ed4f` | Describe the Setup chips of DESIGN.md as the plain kit chip the panel renders |
| `406767e` | Describe the missing values and the folded groups of Setup in DESIGN.md |

gitleaks, from the hook, on each commit:

```
INF 0 commits scanned.
INF scanned ~1373 bytes (1.37 KB) in 295ms     (9d60a56)
INF scanned ~1709 bytes (1.71 KB) in 1.03s     (027ed4f)
INF scanned ~865 bytes (865 bytes) in 342ms    (406767e)
INF no leaks found
```

## Finding 1 (compliance, major): the delivery contradicted HEAD

The delivery is not in this repository, so it has no commit. Rewritten for `27ffe23`: the Estado (done, decisions 18 and
19 in the code with `4d21419` and `b64e73c`, 521 of 521 and 42 of 42 at `2ff55ae`), the Panel, public and documentation
rows of "Qué cambió", a step-12 paragraph in "Documentación", the reintegration run in "Lo que se midió", "Las capturas",
two rows of step-12 commits in "Los commits" (the first round verified at `27ffe23`, the second round listed as not yet
reintegrated), RISK 7 (the captures come from `next dev` and are in English), a new RISK 8 (the hour of Conversations
and `d558911`), and NOT DONE: items 1 and 2 (decisions 18 and 19) removed because they are done, replaced by the tasks
3.5 and 7.2 that only Fable can add and the English group titles of Setup in Spanish; item 4 narrowed to Conversations
at 375 px. Also stale against HEAD and fixed on the way: the row of the README guard in the table of changed tests and
RISK 6 (the guard was restored in `cafd148`), a new row for the foot test of `tests/design-system.test.ts`, and the
"last HEAD tested" of "Lo que se midió" and UNKNOWN 1.

The captures were re-shot. The e2e fixer re-shot the same set on the same HEAD at 19:01, straight into the delivery
folder (`aeef0c3`); my set, taken into a temporary directory at 19:00, was copied over it at 19:04, so the files there are
the ones described below and in the delivery. The first attempt stopped at the answer:

```
$ ADMIN_PASSWORD=<from .env.local, never printed> node scripts/capture-ui.mjs <temp dir> http://localhost:3300
rendered signin-1440.png ... rendered public-empty-375.png
locator.waitFor: Timeout 20000ms exceeded. waiting for locator('[data-cited="answer"]').first() to be visible
$ curl -s -X POST http://localhost:3300/api/ask -H "origin: http://localhost:3300" -H "content-type: application/json" -d '{"question":"When are you open on Saturday?"}'
{"status":"rate_limited","error":"more than RATE_LIMIT_PER_IP_PER_HOUR (30) questions from this address in an hour"}
```

The limit counts per clock hour (`hourWindowStart` in `lib/answer/ask.ts`), so the run waited for 19:00 instead of going
around the limit. At `765862a`:

```
$ ADMIN_PASSWORD=<from .env.local, never printed> node scripts/capture-ui.mjs <temp dir> http://localhost:3300
rendered signin-1440.png
rendered signin-375.png
rendered public-empty-1440.png
rendered public-empty-375.png
rendered public-answer-1440.png
rendered public-answer-375.png
rendered embed-1440.png
rendered embed-375.png
rendered kit-1440.png
rendered kit-375.png
rendered panel-setup-1440.png
rendered panel-setup-375.png
rendered panel-business-1440.png
rendered panel-business-375.png
rendered panel-documents-1440.png
rendered panel-documents-375.png
rendered panel-conversations-1440.png
rendered panel-conversations-375.png
/admin/ai answered 404: skipped
exit 0
```

The 18 PNGs were copied to `katalis-dev/tasks/capturas-community-14/`. Looked at with the Read tool: `public-answer-1440`
shows the band, the highlighted headline, the answer about Saturday with its mark, the sources in the margin and the
open citation; `panel-setup-1440` shows `SET` in the plain kit chip, "Missing" as ink-2 words, and the groups folded with
"Set: 1 of 8"; `panel-conversations-1440` shows "Sep 29, 2026, 7:00 PM". No amount and no secret in any of them.

## Finding 2 (compliance, major): DESIGN.md described lime chips for a set variable

Test first. A case in `tests/design-md.test.ts` reads the `<Chip>` tags of `app/admin/page.tsx` and the classes of
`components/ui/Chip.tsx`, and requires the Chips section and the Lime role to name lime (and "set variable") only when a
chip of the code is lime.

```
$ npx vitest run tests/design-md.test.ts tests/readme.test.ts -t "chips of the setup page|Spanish README with Hecho"
 FAIL  tests/design-md.test.ts > ... > describes the chips of the setup page as app/admin/page.tsx renders them
AssertionError: the Chips section names lime only when a chip of the code is lime: expected true to be false
      Tests  1 failed | 52 skipped (53)
```

Fix in `027ed4f`: the Lime role no longer "marks a set variable", and the State bullet describes the plain kit chip.
While the delivery waited for the captures, `7fffa9a` (panel, second round) changed Setup again: a missing value is plain
ink-2 words, not a chip, and every group but Required folds. `406767e` updates the State bullet to that, and the test
gains an assertion on how the page renders `strings.missing`. Red against the two older documents, green on HEAD:

```
$ npx vitest run tests/design-md.test.ts        (DESIGN.md of 027ed4f in the tree)
AssertionError: the Chips section says a missing value is plain ink-2 words exactly when the page does not put it in a Chip: expected false to be true
      Tests  1 failed | 10 passed (11)
$ npx vitest run tests/design-md.test.ts        (DESIGN.md of 27ffe23 in the tree)
AssertionError: the Chips section names lime only when a chip of the code is lime: expected true to be false
      Tests  1 failed | 10 passed (11)
$ npx vitest run tests/design-md.test.ts        (HEAD)
      Tests  11 passed (11)
```

The older documents were written into the tree only for those two runs and the file was restored from a copy before the
commit (`git diff --stat DESIGN.md` showed only the intended change).

## Finding 3 (compliance, major): the Spanish README closed with "Built by Katalis"

Test first, a case in `tests/readme.test.ts`: the Licencia section of `README.es.md` holds
`<a href="https://katalis.dev">Hecho por Katalis</a>` right after the flame, and the file never says `Built by Katalis`.

```
$ npx vitest run tests/readme.test.ts -t "Spanish README with Hecho"
 FAIL  tests/readme.test.ts > README, the flow and the foot > closes the Spanish README with Hecho por Katalis beside the flame
AssertionError: the closing line reads Hecho por Katalis: expected -1 to be greater than -1
      Tests  1 failed | 42 skipped (43)
```

Fix in `9d60a56`: line 267 of `README.es.md` reads `Hecho por Katalis`. `tests/design-system.test.ts` asserted
`Built by Katalis` in the foot of both READMEs; that assertion contradicted the requirement "Katalis always signs with its
flame" (every signature, a README closing line included, reads in the language of the page), so it now expects the
signature of each README in its own language. It was not loosened: it still asserts the exact link in both files.

## Tests of the area

```
$ npx vitest run tests/design-md.test.ts tests/readme.test.ts tests/design-system.test.ts tests/personal-paths.test.ts tests/brand-static.test.ts
 Test Files  5 passed (5)
      Tests  104 passed (104)
$ npx eslint tests/design-md.test.ts tests/readme.test.ts tests/design-system.test.ts
(no output)
```

102 before this step (step 9 report), plus the two new cases.

## Issues

- BROKEN: none known.
- RISK: `tests/readme.test.ts` was edited at the same time by the tests fixer (`cafd148`); my first edit was lost when that
  file was rewritten, and I added it again after that commit. Only my hunk is in `9d60a56`.
- RISK: the captures come from `next dev`, which serves the working tree with any uncommitted edit of another fixer at
  19:00; the `N` of the dev indicator sits over the flame of the sidebar in the panel captures. In the full-page panel
  captures the ink column ends at the height of the screen while the page runs on (seen in `panel-setup-1440`,
  `panel-conversations-1440`); not in this area, reported for the panel.
- NOT DONE: the banner image of `README.es.md` still draws "by Katalis" in English inside the picture; the requirement
  names "a README banner", and a Spanish banner needs its own render. Not in the findings given.
- UNKNOWN: the stored list of conversations on the dev server shows one question with broken characters
  (`?A qu? hora abren el s?bado?`), sent by some probe with the wrong encoding; not read further.

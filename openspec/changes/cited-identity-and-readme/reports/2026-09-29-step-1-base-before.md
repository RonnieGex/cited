# Step 1 - The state of the base before

- Date: 2026-09-29
- Change: `cited-identity-and-readme`
- Branch: `feature/cited-identity-and-readme`
- Agent: `deepseek-harness`
- Commit verified against: `35112e6` (the contract of Fable), clean tree
- Reports of tasks 1.1 and 1.2.

## 1.1 The battery before the change

Windows 11, Node `v24.11.0`, npm `11.6.1`, tree clean at `35112e6`.

| Command | Result |
|---|---|
| `npm test` | 10 files passed, 72 tests passed, 7.93 s |
| `npm run typecheck` | exit 0, `✓ Types generated successfully` |
| `npm run lint` | exit 0, no warning and no error |
| `openspec validate --all --strict` | 5 passed, 0 failed |
| `git status --short` | empty |

```
> npm test

> katalis-responde-community@0.1.0 test
> vitest run

 RUN  v5.0.2 <repository root>

 Test Files  10 passed (10)
      Tests  72 passed (72)
   Start at  23:26:21
   Duration  7.93s (environment 50%, tests 31%, setup 11%, import 4%, transform 4%)

test exit: 0

> npm run typecheck

> katalis-responde-community@0.1.0 typecheck
> next typegen && tsc --noEmit

Generating route types...
✓ Types generated successfully

typecheck exit: 0

> npm run lint

> katalis-responde-community@0.1.0 lint
> eslint .

lint exit: 0

> openspec validate --all --strict
- Validating...
✓ spec/app-skeleton
✓ change/cited-identity-and-readme
✓ spec/knowledge-search
✓ spec/repository-bootstrap
✓ spec/supply-chain-security
Totals: 5 passed, 0 failed (5 items)

openspec exit: 0

> git status --short
(no output)
```

The five validated items are the four specs in force plus this change. The `openspec` command writes its progress to
stderr, which PowerShell renders as a `NativeCommandError` block; the exit code is 0 and the validation passes.

`npm test` runs with `--env-file-if-exists=.env`, and the repository carries no `.env`: the 72 tests are green with the
deterministic fake provider, no network and no key.

## 1.2 The state of the store

**This change adds no persistence.** It touches the identity, the README, the graphics and their scripts; it adds no
table, no column, no SQL file and no store call. The proof is the diff itself:

```
> git diff --name-only main...HEAD
openspec/changes/cited-identity-and-readme/.openspec.yaml
openspec/changes/cited-identity-and-readme/design.md
openspec/changes/cited-identity-and-readme/proposal.md
openspec/changes/cited-identity-and-readme/specs/app-skeleton/spec.md
openspec/changes/cited-identity-and-readme/specs/product-identity/spec.md
openspec/changes/cited-identity-and-readme/specs/project-readme/spec.md
openspec/changes/cited-identity-and-readme/tasks.md

> git ls-files | Select-String -Pattern '\.(sqlite|sqlite3|db|db3)$'
(no output)
```

Every file the branch adds on top of `main` is the contract of Fable: seven files under
`openspec/changes/cited-identity-and-readme/`, all of them Markdown or YAML, none of them code or SQL. No store file
is tracked by git in the base.

**The quick start leaves no store file tracked by git.** These are the commands of the quick start, with the
deterministic provider and the template of the environment values as the only environment:

```
> Test-Path .data
False

> git check-ignore -v .data/katalis.sqlite
.gitignore:29:/.data/	.data/katalis.sqlite

> $env:EMBEDDINGS_PROVIDER = 'fake'
> npm run ingest -- samples/

> katalis-responde-community@0.1.0 ingest
> node --env-file-if-exists=.env scripts/ingest.ts samples/

.env not found. Continuing without it.
ingested README.txt (txt, no pages, 1 passages)
ingested bike-workshop-policies.md (md, no pages, 5 passages)
ingested cafe-la-horquilla.md (md, no pages, 4 passages)
ingested notas-del-negocio.txt (txt, no pages, 1 passages)
documents 4, passages 11, skipped 0, store .data/katalis.sqlite, 24 ms, rss 109 MB

ingest exit: 0

> npm run search -- "What is the cancellation policy?"

> katalis-responde-community@0.1.0 search
> node --env-file-if-exists=.env scripts/search.ts What is the cancellation policy?

.env not found. Continuing without it.
question: What is the cancellation policy?
store: .data/katalis.sqlite

1. bike-workshop-policies.md [Bookings and cancellations] position 1 score 0.032787
   Bookings and cancellations A repair booking is free. Cancel or move your appointment at least 24 hours before the agreed time and there is no charge. A late cancellation costs 50 pesos, and a dropped appointment costs the full estimate.

2. bike-workshop-policies.md [Storage] position 2 score 0.032002
   Storage We keep a bicycle for 15 days after we tell you it is ready. After that the storage fee is 25 pesos per day, and we call once more before any other step.

3. bike-workshop-policies.md [Guarantee] position 4 score 0.032002
   Guarantee Every repair carries a 90 day guarantee on the work. Parts carry the guarantee of their maker. Bring the ticket; without it we can still look up the repair by the frame number.

4. bike-workshop-policies.md [Groups and events] position 3 score 0.030536
   Groups and events We host a Saturday ride that leaves the shop at 9:30. Groups of more than 8 people should write to us a week ahead so we can arrange a mechanic and a second guide.

5. README.txt [no heading] position 0 score 0.030331
   Sample corpus of Katalis Responde Community These documents describe a fictional small business, Café La Horquilla, a café and bicycle workshop. They exist so the tests, the manual verification and the RAM measurement of this repository hav

6. notas-del-negocio.txt [no heading] position 0 score 0.015625
   Café La Horquilla — notas del negocio Dirección: avenida central, frente al parque. Sin estacionamiento propio, pero hay uno público a media cuadra. Formas de pago: efectivo, tarjeta de débito y crédito. No aceptamos cheques ni transferenci

7. cafe-la-horquilla.md [Políticas] position 3 score 0.015385
   Políticas Aceptamos efectivo y tarjeta. El taller recibe bicicletas hasta una hora antes del cierre. Si una reparación necesita refacciones, avisamos por teléfono antes de empezar.

8. bike-workshop-policies.md [Bike workshop policies at Café La Horquilla] position 0 score 0.014925
   Bike workshop policies at Café La Horquilla Everything a customer needs to know before leaving a bicycle with us.

8 results, 5 ms, rss 73 MB

search exit: 0
```

The store file exists after the run and git does not see it:

```
> Get-ChildItem -Recurse -Force .data
.data\katalis.sqlite [57344]

> git status --short -uall
(no output)

> git status --short --ignored=matching | Select-String -Pattern '\.data'
!! .data/
```

`git status -uall` lists every untracked file and reports nothing: the store is ignored by `.gitignore:29` (`/.data/`),
which is the rule the base already carried. **A reader who runs the quick start gets a store that git never tracks.**

The directory of the manual run was removed after this step, so the tree of the branch carries no store either. Both
commands were run with the fake provider and reached no network: no call to a real provider and no call to Turso.

## Verdict

PASS. The base is green on every check of the contract, the change adds no persistence, and the quick start leaves no
store file tracked by git.

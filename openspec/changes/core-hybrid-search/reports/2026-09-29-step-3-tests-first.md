# Step 3 - Tests first

- Date: 2026-09-29
- Change: `core-hybrid-search`
- Branch: `feature/core-hybrid-search`
- Agent: `deepseek-harness`
- Commit verified against: `39684fd` plus the spike of step 2 in the working tree

## The red state

The tests of every scenario of `specs/knowledge-search/spec.md` were written before any module of `lib/` exists. The
command and its real output:

```
> npx vitest run

 ❯ tests/search.test.ts (0 test)
 ❯ tests/rrf.test.ts (0 test)
 ❯ tests/embeddings.test.ts (0 test)
 ❯ tests/store.test.ts (0 test)
 ❯ tests/ingest.test.ts (0 test)

⎯⎯⎯⎯⎯⎯ Failed Suites 5 ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯

 FAIL  tests/embeddings.test.ts [ tests/embeddings.test.ts ]
Error: Failed to resolve import "@/lib/embeddings/fake" from "tests/embeddings.test.ts". Does the file exist?

 FAIL  tests/ingest.test.ts [ tests/ingest.test.ts ]
Error: Failed to resolve import "@/lib/embeddings/fake" from "tests/ingest.test.ts". Does the file exist?

 FAIL  tests/rrf.test.ts [ tests/rrf.test.ts ]
Error: Failed to resolve import "@/lib/search/rrf" from "tests/rrf.test.ts". Does the file exist?

 FAIL  tests/search.test.ts [ tests/search.test.ts ]
Error: Failed to resolve import "@/lib/store" from "tests/search.test.ts". Does the file exist?

 FAIL  tests/store.test.ts [ tests/store.test.ts ]
Error: Failed to resolve import "@/lib/store" from "tests/store.test.ts". Does the file exist?

 Test Files  5 failed | 4 passed (9)
      Tests  22 passed (22)
   Duration  4.68s (environment 74%, setup 14%, tests 7%, transform 3%, import 1%, worker 1%)

exit code 1
```

The red is the real red of a test written before its module: every one of the five new files fails to resolve the
import of the module it demands, and not one of them fails for a reason of its own syntax or of its fixtures. The four
files that pass are the three of the base (`tests/codeql-workflow.test.ts`, `tests/home.test.tsx`,
`tests/personal-paths.test.ts`) and the spike of step 2 (`tests/spike/libsql-capabilities.test.ts`), which is a
capability test of the store and not a test of the product.

## The tests, scenario by scenario

| Scenario of the spec | Test | What it demands |
|---|---|---|
| A renamed file | `tests/ingest.test.ts` › type detection › reads a renamed file as what its content is | a file named `notes.pdf` that holds plain text is ingested as `txt` |
| | `tests/ingest.test.ts` › type detection › refuses a file whose content is not an accepted type | an SVG is refused |
| | `tests/ingest.test.ts` › type detection › reads a docx/pdf by its content | magic bytes decide, and a PDF reports its page count |
| A broken file | `tests/ingest.test.ts` › a broken file › names the file and skips it… | the report names the file and the reason, no passage of that file exists, and the rest of the folder is ingested |
| Limits | `tests/ingest.test.ts` › the limits › refuses a file above the byte limit / above the page limit | refused before parsing, the report says which limit, and `MAX_FILE_BYTES` is 20 MB and `MAX_PAGES` is 500 |
| Re-ingestion | `tests/ingest.test.ts` › re-ingestion › replaces the passages / replaces the keyword index | the count of passages of a document is the same after a second run |
| | `tests/store.test.ts` › documents and passages › stores a document by name and replaces it | the same at the store level, plus the keyword index stays in step |
| Missing key | `tests/embeddings.test.ts` › the provider factory › stops on a missing key and names the variable | the message names `EMBEDDINGS_API_KEY`, never a value |
| | `tests/ingest.test.ts` › ingestion stops before reading any document when the key is missing | nothing is ingested |
| A keyword-only match | `tests/search.test.ts` › hybrid search › ranks a keyword-only match | the passage that shares the term is in the top results |
| A meaning-only match | `tests/search.test.ts` › hybrid search › ranks a meaning-only match with the fake provider | a paraphrase with no shared terms still reaches the top |
| RRF arithmetic on a fixed example | `tests/rrf.test.ts` (six tests) | `k = 60`; `1/61`, `1/62`; the sum `1/61 + 1/62`; one entry per passage; the tie broken by the better keyword rank |
| The store is verified before it is chosen | `tests/spike/libsql-capabilities.test.ts` (step 2) | the exact statements and their results |

Two more files carry the behaviour the design fixes and the spec needs to be true:

- `tests/search.test.ts` › chunking: paragraphs together with their heading, the overlap of consecutive passages, and
  the default of about 800 characters with 120 of overlap.
- `tests/store.test.ts` › the schema: `documents`, `passages` and `passages_fts` exist, the vector column is
  `F32_BLOB`, opening twice is safe, and no store file is left in the repository.

## Fixtures

- `tests/fixtures/documents.ts`: a minimal PDF writer (catalog, pages, Helvetica, cross-reference table) and a
  minimal DOCX writer (a ZIP with `[Content_Types].xml`, `_rels/.rels` and `word/document.xml` with `w:pStyle`). Both
  write real files, so the parsers are exercised against the formats and not against a mock.
- `samples/`: the corpus of design decision 7, written for this repository about a fictional business
  (Café La Horquilla): `cafe-la-horquilla.md` (hours, prices, policies, Spanish), `bike-workshop-policies.md`
  (bookings, storage, groups, guarantee, English), `notas-del-negocio.txt` (payment, invoicing, pets, accessibility,
  Spanish) and `README.txt` that says what the folder is and what it is not.

The fixtures are exercised through the real files on disk. No test calls the network.

## Verdict

PASS. Forty-five assertions in five new files, every one of them red for the right reason: the modules do not exist
yet. The implementation of step 4 makes them green one step at a time.

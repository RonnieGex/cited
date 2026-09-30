# Step 10.1 · Tests first of the amendment (decisions 14, 15 and 16)

Task of `tasks.md`: "Red first: unit tests for decision 14 (a server provider without its key is not verified), decision
15 (a PNG named `.txt`, an oversized file rejected before it is read, a name with `../`), decision 16 (undo clears the
sample name and keeps a name the owner typed); E2E of "from zero to an answer" in Spanish and of the file cases in the
browser (PDF with text, scanned PDF, DOCX, oversized, not supported, `../` name)".

Commit that carries the cases: `9b39f93` ("Bring the tests of the amendment first: an unusable provider, the bytes of a
file, the undo and the walk in Spanish"). This report validates that commit and lands in the one that marks the box.

## The unit cases

| Decision | Case | Where |
|---|---|---|
| 14 | a server provider with no key is not verified, and it is not `progress` either: it needs attention | `tests/setup-checklist.test.ts` |
| 14 | a server provider that carries its key is verified | `tests/setup-checklist.test.ts` |
| 14 | the words of the step that needs attention name no variable of the server | `tests/setup-checklist.test.ts` |
| 14 | the notice of the step sends the owner to the installer, in both languages | `tests/setup-ui.test.tsx` |
| 15 | a PNG renamed to `.txt` is refused as a type | `tests/ingest.test.ts`, `tests/setup-routes.test.ts` |
| 15 | a JPEG renamed to `.md` and text bytes that are not UTF-8 are refused | `tests/ingest.test.ts` |
| 15 | a PDF and a DOCX named `.txt` are read by their content | `tests/ingest.test.ts` |
| 15 | an oversized file is refused by its size, before its bytes are read | `tests/admin-documents.test.ts` |
| 15 | a name with `..`, a slash or a control character is reduced to its base name | `tests/admin-documents.test.ts`, `tests/setup-routes.test.ts` |
| 15 | the route asks for the size before the bytes (`readUploadField`, never `entry.arrayBuffer()`) | `tests/admin-documents.test.ts` |
| 16 | undo removes the documents of the sample and clears the name it set | `tests/setup-routes.test.ts` |
| 16 | undo keeps a name the owner typed after the sample | `tests/setup-routes.test.ts` |
| 16 | undo needs the session of the panel | `tests/setup-routes.test.ts` |
| 16 | the panel undoes the sample with one request that also clears its name | `tests/setup-ui.test.tsx` |

## The red run of the unit cases

Command, on Windows with Node 24.21.0, in the worktree `<worktree>`:

```
npx -y -p node@24 node -v
npx -y -p node@24 node node_modules/vitest/vitest.mjs run tests/setup-checklist.test.ts tests/ingest.test.ts tests/admin-documents.test.ts tests/setup-routes.test.ts tests/setup-ui.test.tsx
```

Output at `9b39f93`:

```
v24.21.0

 Test Files  5 failed (5)
      Tests  14 failed | 55 passed (69)
```

The fourteen, with the reason each one gives:

- `the derived state of the four steps > does not verify the first step with a server provider whose key is missing`:
  `expected 'verified' to be 'attention'` — `setupChecklist()` verified any provider whose source was `server`.
- `the derived state of the four steps > keeps the words of the step that needs attention free of the name of a
  variable`: the same, the step was `verified`.
- `type detection > refuses a PNG renamed to a text extension`: `parseFile()` read the picture as text.
- `type detection > refuses a JPEG renamed to Markdown`: the same.
- `type detection > refuses a text name whose bytes are not UTF-8 text`: the same.
- `the files of an upload, read the way decision 15 asks >` its five cases: `readUploadField()` does not exist yet.
- `an upload of several files > refuses a PNG renamed to a text extension while the file after it is read`:
  `expected [ 'ready', 'ready' ] to deeply equal [ 'failed', 'ready' ]`.
- `undoing the sample business >` its three cases: `TypeError: DELETE is not a function`.
- `tests/setup-ui.test.tsx` failed whole, at the import of `@/components/setup/AttentionNotice`, which does not exist
  yet; the case of the notice and the case of the undo of the sample are inside that file.

The same command after the fixes of `75fab1e`:

```
 Test Files  5 passed (5)
      Tests  94 passed (94)
```

## The browser cases

Commit `9b39f93`, with the config of `playwright.config.ts` and the fixtures of `e2e/admin-fixtures.ts`:

- `e2e/setup-es.spec.ts` is new: the scenario "From zero to an answer" in Spanish on a server of its own (port 3211,
  its own store, its own encryption key) with the same deterministic double on 3216. It walks the four steps in
  Spanish, times the walk against the 300 s ceiling, checks axe on the welcome and on the finished panel, and covers
  the scenario "Not ready" in Spanish. The project `setup-es` is the fifth of the suite.
- `e2e/setup.spec.ts` gains four cases of files in the browser: a PDF with text and a DOCX read by their content even
  renamed; a picture renamed to `.txt` refused as a type; a file above 20 MB refused with the limit in words; and a
  name with `../` stored by its base name, sent from the page itself with a `DataTransfer`, because a file picker
  always sends the base name of a local path.
- The deterministic double moves to `e2e/provider-double.ts`, which the English walk and the Spanish walk share, and
  the fixed set of ports is written in one comment over the projects of `playwright.config.ts` (decision 17). The
  refused site of `e2e/widget.spec.ts` moves from 3211 to 3216: 3211 is the server of the Spanish walk now, and 3216 is
  free while the `public` project runs, because the suite keeps one worker.

## Why the browser cases have no red run of their own

`npm run build:e2e` builds with `next build`, which type checks the tree — `tsconfig.json` includes `**/*.ts` — so at
`9b39f93`, with the cases written and the fixes not yet in, the build stops before Playwright can start. Run in a clean
clone of that commit (`<clean clone>`), with Node 24.11.0:

```
npm run build:e2e
...
tests/admin-documents.test.ts(11,10): error TS2305: Module '"@/lib/admin/documents"' has no exported member 'readUploadField'.
tests/setup-routes.test.ts(10,26): error TS2305: Module '"@/app/api/admin/samples/route"' has no exported member 'DELETE'.
tests/setup-ui.test.tsx(3,33): error TS2307: Cannot find module '@/components/setup/AttentionNotice' or its corresponding type declarations.
tests/setup-ui.test.tsx(163,39): error TS2551: Property 'stepAttentionBody' does not exist on type 'AdminStrings'. Did you mean 'stepAttention'?
Failed to type check.
```

This is the same shape the round of the contract already used in `e401e0f`: the cases of a step land before its
implementation and the tree does not build until the next commit. The red run that proves the defect is therefore the
unit one above, which reads the same functions the browser drives: the only Major of the six that a browser case could
show is the picture renamed to `.txt` (the Major M-2), and `tests/ingest.test.ts` and `tests/setup-routes.test.ts` fail
on it at `9b39f93` and pass at `75fab1e`. The green run of the whole browser suite is the evidence of task 10.4, in a
clean clone of the commit that carries this report.

## Note on the ports

The four browser cases and the Spanish walk were written before the fixes, and the port of the Spanish server (3211) is
inside the fixed set of decision 17 (3100 and 3210 to 3217), which `e2e/widget.spec.ts` frees when its own case ends.

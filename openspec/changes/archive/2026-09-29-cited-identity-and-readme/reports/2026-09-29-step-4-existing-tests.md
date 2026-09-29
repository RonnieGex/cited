# Step 4 - Review and update of the existing tests

- Date: 2026-09-29
- Change: `cited-identity-and-readme`
- Branch: `feature/cited-identity-and-readme`
- Agent: `deepseek-harness`
- Commit verified against: `35db337` (the identity of the page and its tests) with the whole suite green on the tree of
  `eaaf2c7`
- Report of task 4.1: the whole suite; only the assertions of the old name were updated, and here is which ones and why.

## 4.1 The whole suite

```
> npm test

 Test Files  11 passed (11)
      Tests  101 passed (101)
   Duration  8.95s (environment 64%, tests 23%, setup 7%, import 3%, transform 3%, worker 1%)
```

The 72 tests that the base had at `35112e6` are still there and green; the 29 of `tests/readme.test.ts` are the new
contract.

The diff of the two files since `main` carries the name and nothing else:

```
> git diff main...HEAD -- tests/home.test.tsx e2e/home.spec.ts
diff --git a/e2e/home.spec.ts b/e2e/home.spec.ts
@@ -5,6 +5,6 @@ test("home page answers with the product name", async ({ page }) => {
   expect(response?.status()).toBe(200);
   await expect(page.getByRole("heading", { level: 1 })).toHaveText(
-    "Katalis Responde Community",
+    "Cited",
   );
 });
diff --git a/tests/home.test.tsx b/tests/home.test.tsx
@@ -7,7 +7,7 @@ describe("home page", () => {
     render(<Home />);

     expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
-      "Katalis Responde Community",
+      "Cited",
     );
   });
```

## The two assertions of the old name, and why they changed

The whole repository was searched for the former name before deciding what to touch:

```
> git grep -n -i -E "katalis[\s-]+responde[\s-]+community" -- . | Select-String -NotMatch -Pattern 'openspec/changes/(archive/|cited-identity-and-readme/)'
(no output)
```

Only two test files asserted the product name, and in both the assertion is the thing the change modifies:

| File | Line | Before | After | Why |
|---|---|---|---|---|
| `tests/home.test.tsx` | the level-one heading | `toHaveTextContent("Katalis Responde Community")` | `toHaveTextContent("Cited")` | the scenario "The page names the product" of `product-identity` says the heading is `Cited`; the page renders `Cited` |
| `e2e/home.spec.ts` | the level-one heading | `toHaveText("Katalis Responde Community")` | `toHaveText("Cited")` | the same scenario, verified against the running application |

Nothing else changed in those files: `tests/home.test.tsx` still renders the page and still asks for one `main`
region, and `e2e/home.spec.ts` still asserts the 200 of `GET /` before the heading.

The end-to-end spec passes against the built application:

```
> npm run test:e2e
Running 1 test using 1 worker

  ok 1 [chromium] › e2e\home.spec.ts:3:5 › home page answers with the product name (181ms)

  1 passed (9.2s)
```

## The tests that were not touched

No other test names the product, so no other assertion was modified. The files that could have needed a change and did
not:

- `tests/personal-paths.test.ts` reads the tracked files for a home directory and for a symlink; it has no product
  name in it. It did fail during this change, for a real reason of my own making: two report files of steps 1 and 2
  carried a local path. The reports were corrected, not the test.
- `tests/codeql-workflow.test.ts`, `tests/store.test.ts`, `tests/ingest.test.ts`, `tests/embeddings.test.ts`,
  `tests/rrf.test.ts`, `tests/search.test.ts`, `tests/spike/libsql-capabilities.test.ts`, `tests/store-remote.test.ts`
  and `tests/fixtures/documents.ts` do not name the product.

## Verdict

PASS. The suite is green with 101 tests, and the only assertions of the old name that changed are the two that assert
what this change renames, each one because the spec that this change modifies demands the new name.

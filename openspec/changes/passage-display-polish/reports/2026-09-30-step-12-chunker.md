# Step 12 — the chunker cuts a block at every blank line again (task 12.2)

- **Date:** 2026-09-30
- **Change:** `passage-display-polish` (`tasks.md`, task 12.2; `design.md`, decision 18)
- **Branch:** `feature/passage-display-polish`
- **Commit this report was verified against:** `b65bb97` (the chunker and the one expectation of the tests of the change
  that the fix corrects)
- **Agent:** DeepSeek (implementer)
- **Verdict:** the golden fixture written from `86b250f` is **green**, the list tests of the change are green, and the
  whole unit suite is green (**90 files, 1057 tests**). The fixed chunker returns **345** passages for the 23 files, the
  same count as `86b250f`, and the only raw difference with `main` is the line break of a list join.

## What changed

`lib/ingest/chunk.ts` against `86b250f` — the whole change is the join, and the empty line ends a block again:

```diff
+const listItem = /^([-*]|\d+\.)\s+\S/;
+
+function passageText(parts: string[]): string {
+  let text = "";
+
+  for (const part of parts) {
+    if (text.length === 0) {
+      text = part;
+      continue;
+    }
+
+    text = listItem.test(part) ? `${text}\n${part}` : `${text} ${part}`;
+  }
+
+  return text;
+}
+
+function blockText(lines: string[]): string {
+  return passageText(lines.filter((line) => line.length > 0));
+}
+
   const flush = (): void => {
-    const text = buffer.join(" ").trim();
+    const text = blockText(buffer);
@@
-  const length = (): number => current.join(" ").trim().length;
+  const length = (): number => passageText(current).trim().length;
 
   const emit = (): void => {
-    const text = current.join(" ").trim();
+    const text = passageText(current).trim();
@@
-        current.push(`${carry} ${head}`.trim());
+        current.push(passageText([carry, head]).trim());
```

The empty line was already a block boundary of `main` and the branch had removed it; this commit puts it back, and the
join of a part that opens with a list item becomes a line break (decision 18). The size of a passage does not move:
a space and a line break are both one character, so `length()` reads the same number.

## Evidence

`git diff --stat` of the commit: `lib/ingest/chunk.ts` (24 lines changed) and `tests/answer-lead.test.ts`.

```text
<worktree> > npx -y -p node@24 node node_modules/vitest/vitest.mjs run tests/chunk-golden.test.ts tests/chunk-lists.test.ts tests/search.test.ts

 Test Files  3 passed (3)
      Tests  17 passed (17)
   Duration  10.63s (environment 34%, tests 29%, import 24%, setup 7%, transform 6%)
```

```text
<worktree> > npx -y -p node@24 node node_modules/vitest/vitest.mjs run

 Test Files  90 passed (90)
      Tests  1057 passed (1057)
   Duration  80.64s (tests 71%, environment 17%, import 6%, setup 4%, transform 2%)
```

The same generator of task 12.1 over the chunker of this commit and the two comparisons of the two fixtures
(`npx -y -p node@24 node scripts/chunk-golden.mts lib/ingest/chunk.ts <scratch>/chunker-fixed.json "b65bb97:lib/ingest/chunk.ts"`):

```text
23 files, 345 passages

# the line break of a list join read as a space
files 23, moved 0, mainPassages 345, branchPassages 345

# the text read as it is
docs/backend-standards.md passage 2
  main:   len 697 1. Stack - Next.js 16 route handlers under `app/api/`. There is no separate service: the A…
  branch: len 697 1. Stack
- Next.js 16 route handlers under `app/api/`. There is no separate service: the A…
files 23, moved 17, mainPassages 345, branchPassages 345
```

Every file that moves moves only in the files that hold a list, and only where an item opens a line: 17 of the 23 files
hold one, and the count of passages is 345 on both sides. That is decision 18 written as a measurement.

## One expectation changed in the tests of the change

`tests/answer-lead.test.ts`, "carries the length of the repeated words for a passage that continues the one before it".

| | |
|---|---|
| Before | `# Precios` with a paragraph of 799 characters, `# Cambio` with two paragraphs (24 repetitions of `palabra` and 80 of `consulta` plus a closing sentence), no blank line between the last two; the test expected **5** passages and read `passages[3]` and `passages[4]`, the two halves of one block the old chunker cut in two, whose second half repeated `consulta` from the first |
| After | the same document with a blank line between the last two paragraphs, the second one opening with the sentence that closes the first (`El taller revisa la bicicleta antes de devolverla.`); the test expects **4** passages and reads `passages[2]` and `passages[3]`, the second one the passage that follows the overflow of the first |

**Why.** The old fixture passed because of the Major: without the cut at the empty line the two paragraphs were one block,
the block was cut inside the run of the word `consulta`, and the passage that followed opened with `consulta consulta
consulta…`, which the passage before it also ended with, so `leadLength` gave it 116 characters of lead where the
chunker had cut a sentence. Measured on the chunker of `c2f5d2a` with the old document:

```text
passages: 5
[3] len=794 head="palabra palabra palabra palabr" tail="lta consulta consulta consulta"
[4] len=151 head="consulta consulta consulta con" tail="s cambio de cámara: 120 pesos."
lead of passage 4 against passage 3: 116
its first own words: " pesos cambio de cámara: 120 pesos."
```

Decision 18 removes that cut, so the fixture produced 4 passages and `lead: 0`. The new fixture repeats the words in the
text of the document, as the fixture of decision 20 does, and the assertion is stronger: `expect(carried).toBe(leaded
.length)` instead of `toBeGreaterThan(0)`, with `leaded` the repeated sentence. A citation that lost its `lead` (the
mutation of the review, `lead={0}`) fails this case.

No other expectation of the suite changed. The scenario "Search does not move" (`tests/search.test.ts`) is green inside
the 1057, and the samples of `samples/` return the same passages as before the fix, because none of their sections is
longer than one passage.

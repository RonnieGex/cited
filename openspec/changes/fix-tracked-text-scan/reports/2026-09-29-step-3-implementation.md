# Step 3 report - fix-tracked-text-scan: the implementation

- Date: 2026-09-29
- Change: fix-tracked-text-scan
- Agent: deepseek-harness
- Commit: `5b7fc46` (`fix(fix-tracked-text-scan): decide the tracked-path scan from the git mode`)
- Parent of the red scenarios: `2c3e2ae`

## Task 3.1 - the scan follows the git mode

The whole change lives in `tests/personal-paths.test.ts`. The scan asks git for the mode of every tracked path, and
decides with that mode how to inspect the path.

```
git diff 2c3e2ae..5b7fc46 -- tests/personal-paths.test.ts

-function trackedFiles(root: string): string[] {
-  const output = execFileSync("git", ["ls-files", "-z"], {
+function trackedEntries(root: string): TrackedEntry[] {
+  const output = execFileSync("git", ["ls-files", "-s", "-z"], {
     cwd: root,
     encoding: "utf8",
   });

-  return output.split("\0").filter((path) => path.length > 0);
+  return output
+    .split("\0")
+    .filter((record) => record.length > 0)
+    .map((record) => {
+      const separator = record.indexOf("\t");
+      const [mode = ""] = record.slice(0, separator).split(" ");
+
+      return { mode, path: record.slice(separator + 1) };
+    });
 }

-function textOf(root: string, path: string): string | null {
-  const bytes = readFileSync(resolve(root, path));
+function fileText(absolute: string): string | null {
+  const bytes = readFileSync(absolute);

   return bytes.includes(0) ? null : bytes.toString("utf8");
 }

+function textOf(root: string, entry: TrackedEntry): string | null {
+  const absolute = resolve(root, entry.path);
+
+  if (entry.mode === symlinkMode) {
+    return lstatSync(absolute).isSymbolicLink() ? readlinkSync(absolute) : fileText(absolute);
+  }
+
+  if (regularFileModes.includes(entry.mode)) {
+    return fileText(absolute);
+  }
+
+  return null;
+}
+
+function textOfPath(root: string, path: string): string | null {
+  const entry = trackedEntries(root).find((candidate) => candidate.path === path);
+
+  return entry === undefined ? null : textOf(root, entry);
+}

-const ruleDefiningContracts = ["openspec/changes/bootstrap/tasks.md"];
+const ruleDefiningContracts = [
+  "openspec/changes/bootstrap/tasks.md",
+  "openspec/changes/archive/2026-09-29-bootstrap/tasks.md",
+];
+
+const regularFileModes = ["100644", "100755"];
```

The rules of the spec delta, one by one:

| Rule | Where |
|---|---|
| The mode of each path comes from git | `git ls-files -s -z`, which prints `<mode> <object> <stage>\t<path>` per record |
| A symlink is checked by its target | mode `120000`: `readlinkSync` when the checkout made a real link, the text of the file when the checkout could not (`core.symlinks=false`, the Windows case) |
| A regular file is checked by its content | modes `100644` and `100755`: `readFileSync`, unchanged |
| A binary file is skipped | a NUL byte in the content returns `null`, unchanged for regular files and now applied to the text fallback of a link too |
| Anything else is skipped | any other mode (a gitlink `160000`, for instance) returns `null` and is never opened |
| The contract is exempt at its active and the archived path | `ruleDefiningContracts` holds both paths |

The link is never opened as a path when the checkout made a real link, which is what produced `EISDIR` on the Linux
runner: `.claude/agents` is a link to the directory `ai-specs/agents`, and reading it read the directory.

One correction inside the implementation commit before it was published: the first version parsed the mode as
`record.slice(0, separator).split(" ")[0]` and `npm run typecheck` rejected it, because `noUncheckedIndexedAccess` is
on and the element of an array is `string | undefined`:

```
tests/personal-paths.test.ts(101,3): error TS2322: Type '{ mode: string | undefined; path: string; }[]' is not
assignable to type 'TrackedEntry[]'.
```

The commit was amended with `const [mode = ""] = ...` and the whole battery is green since. The intermediate state was
never pushed and never left `feature/fix-tracked-text-scan`.

## Green after the fix

On Windows:

```
npm test
  -> Test Files  2 passed (2)
          Tests  9 passed (9)
```

In a fresh clone of the branch inside the disposable `node:24` container:

```
docker run --rm -v "${PWD}:/src:ro" -v "<scratch>:/scripts:ro" node:24 \
  bash /scripts/branch-run.sh feature/fix-tracked-text-scan 'bash /scripts/container-checks.sh'
  -> === HEAD of the clone ===
     5b7fc46 fix(fix-tracked-text-scan): decide the tracked-path scan from the git mode
     === npm ci exit code: 0 ===
     ✓ tests/personal-paths.test.ts (7 tests) 272ms
     ✓ tests/home.test.tsx (2 tests) 235ms
     Test Files  2 passed (2)
          Tests  9 passed (9)
     === exit code: 0 ===
```

## Verdict

PASS. The scan decides from `git ls-files -s`, checks a link by its target on both kinds of checkout, skips what is
neither a regular file nor a link, and exempts the rule-defining contract at its active and its archived path. Green
on Linux and on Windows.

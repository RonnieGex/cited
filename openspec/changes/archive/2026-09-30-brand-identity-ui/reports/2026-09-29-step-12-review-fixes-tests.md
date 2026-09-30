# Step 12, review fixes: tests

Area: tests. Files touched: `tests/readme.test.ts` (the test named in the finding). No other file changed.

## Finding 1 (compliance, major): the guard "a spec an open change still adds is never written by hand" was removed

Where: `tests/readme.test.ts`, the test "marks every row Available or Planned, with the spec or the change that delivers it".

The design does not contradict the finding: task 4.1 allows amending only assertions on markup the design moved, and this
guard is about the specs, not the markup. The premise of the removal was false, since a hand-written spec would already
carry the delta's `### Requirement:` headers.

Fix: the guard is back in a narrowed form. For an Available row whose spec is in force and that an open change still
delivers with `## ADDED Requirements`, no `### Requirement:` header of that delta may already appear in
`openspec/specs/<capability>/spec.md`. A helper `requirementHeaders` reads the headers. Today it runs on two rows,
`admin-panel` and `public-chat`, both in force and both still extended by the deltas of `brand-identity-ui`.

Test first, green with the tree as it is:

```
npx vitest run tests/readme.test.ts -t "status table"
 Test Files  1 passed (1)
      Tests  3 passed | 39 skipped (42)
```

Proof that the guard bites: a temporary mutation added the delta text to the spec in force
(`const written = readText(linked) + readText(delivering[0] ?? linked);`). The test was run, and the file was then
restored from a copy (`grep -c MUTATION` gives 0 and nothing of it was committed):

```
npx vitest run tests/readme.test.ts -t "status table"
AssertionError: The panel: the setup, the business, the documents and the conversations: openspec/changes/brand-identity-ui/specs/admin-panel/spec.md still adds "### Requirement: The panel is a workspace with the identity", which is never written by hand into openspec/specs/admin-panel/spec.md: expected true to be false // Object.is equality
      Tests  1 failed | 2 passed | 39 skipped (42)
```

The files of the area after the fix:

```
npx vitest run tests/readme.test.ts tests/brand-static.test.ts
 Test Files  2 passed (2)
      Tests  66 passed (66)
```

Commit: `cafd148` "Restore the README guard against hand-written specs in a narrowed form". Output of the gitleaks
hook:

```
INF 0 commits scanned.
INF scanned ~989 bytes (989 bytes) in 338ms
INF no leaks found
```

## Issues

- BROKEN: none.
- RISK: the guard matches the header text exactly. A spec copied by hand with a reworded header would get past it.
  `openspec archive` would still catch the collision when the change is archived.
- NOT DONE: none.
- UNKNOWN: the whole suite, the build and Playwright were not run here, by rule. The reintegration agent runs them in
  the `community-e2e` worktree.

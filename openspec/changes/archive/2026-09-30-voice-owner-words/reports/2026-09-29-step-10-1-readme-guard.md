# Step 10.1: the guard of the README goes back to its text of `2f9a75b`

- Date: 2026-09-29
- Change: `voice-owner-words`
- Branch: `feature/voice-owner-words`
- Agent: deepseek-harness
- Commit verified: `0ed8386` (the last commit before this report)
- Task: 10.1 (design decision 6)

## The revert

```
$ git checkout 2f9a75b -- tests/readme.test.ts
$ git diff 2f9a75b --stat -- tests/readme.test.ts
(no output: the file is byte for byte the one of the contract)
```

`tests/readme.test.ts` lost the amendment of this change: `requirementTitles()` and
`handWrittenByAnOpenChange()` are gone, and the guard of the status table asks again what it asked at `2f9a75b`:

```ts
expect(
  inForce && delivering.length > 0,
  `${row.capability}: a spec an open change still adds is never written by hand`,
).toBe(false);
```

The revert alone would make the file red over the delta of `027ffbc` only if that delta still added requirements to a
capability already in force. It does not: `specs/voice-agent/spec.md` of this change opens with
`## MODIFIED Requirements` and modifies "The browser never sees the ElevenLabs key" and "The cap is checked before the
configuration" in full, so `addsCapability()` is false for it and `openChangeSpecs("voice-agent")` is empty. The row of
the voice in the README keeps pointing at `openspec/specs/voice-agent/spec.md`, which exists, and the guard is quiet.
The delta of `provider-settings` was already `MODIFIED` before this amendment and never bothered the guard.

## The green

```
$ npx -y -p node@24 node node_modules/vitest/vitest.mjs run tests/readme.test.ts
 Test Files  1 passed (1)
      Tests  42 passed (42)
   Duration  3.69s
exit=0
```

And the whole suite over the same tree, with Node 24.21.0:

```
$ npx -y -p node@24 -c "npm test"
 Test Files  69 passed (69)
      Tests  602 passed (602)
   Duration  38.60s
suite exit=0
```

The 602 are the 599 of the closed round plus the three tests of task 10.2 (`business_unnamed` in the route and in the
two languages of the screen).

## One correction before this run

The first whole-suite run of this task was red in `tests/personal-paths.test.ts` with one offender: the report of step
10.3 transcribed the `EPERM` of Windows with the absolute path of the temporary folder of the machine. The guard refuses
`<a drive>:\Users\` in any tracked file but the two contracts that state the rule, and it was right. The three paths of
that report were elided to `<the worktree>` and `<the folder of the test>` in `0ed8386`, one commit after the report was
written and its box marked, the same way the report of step 1 was corrected in `42e9afb` in the round that this one
amends. The evidence of the report did not change: only the personal prefix did.

## Verdict

Task 10.1 is done: the guard of the README is back to its text of `2f9a75b`, the `MODIFIED` delta of `voice-agent`
leaves it quiet, and the whole suite is green with it (69 files, 602 tests).

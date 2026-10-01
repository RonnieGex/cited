# Step 2.2 · The guard of the notice of the binaries of sharp, red before the fix

Task of `tasks.md`: "`tests/third-party-notices.test.ts`: the section of the binaries of sharp names
`@img/sharp-libvips-*`, `LGPL-3.0-or-later` and the version of `package-lock.json` (scenarios of
`supply-chain-security`)".

The code this report verifies is the tree of `9c983c0` ("Guard the agent folders with a test that is red: five cases
fail on the links"), which changes no production file of the base `b42dfea`: `THIRD_PARTY_NOTICES.md` still has no
section on what npm installs.

## The command and its result

Windows, in the worktree `<worktree>`, with the Node 24.21.0 that `npx -y -p node@24` resolves:

```
npx -y -p node@24 node node_modules/vitest/vitest.mjs run tests/third-party-notices.test.ts
```

```
 ❯ tests/third-party-notices.test.ts (6 tests | 1 failed) 22ms
 FAIL  tests/third-party-notices.test.ts > the notice of what npm installs and this repository does not ship > names
 AssertionError: expected [ Array(1) ] to deeply equal []
 + [ "the section ## Installed by npm, not shipped is missing" ]
 Test Files  1 failed (1)
      Tests  1 failed | 5 passed (6)
   Duration  344ms
exit=1
```

## What the new cases read

- The four cases that came before are still green: the license of the resampler, the license of the worklets, the rows
  of the served files and the row of the font.
- "names the pattern, the version of the lock and the license of the prebuilt binaries of sharp" is red: the section
  `## Installed by npm, not shipped` does not exist yet. It reads `package-lock.json`, takes every
  `node_modules/@img/sharp-libvips-*` entry, requires one single version (1.3.4 today) and the license
  `LGPL-3.0-or-later` from the lock itself, and then requires the section to carry the pattern
  `@img/sharp-libvips-*`, that version, that license, the folder `node_modules/@img/sharp-libvips-`, the origin
  `through next`, and the statements `does not ship` and `links against them`.
- "fails a section that names another version of the binaries" is green before the fix by construction: it builds a
  synthetic section from the version of the lock and asserts that the same guard reports the missing version when the
  section names `0.0.0`. It is the unit half of scenario "The version stays true"; the half over the real file is the
  case above, which is red.

## Verdict

Red on `9c983c0`, and for the reason of the change: `THIRD_PARTY_NOTICES.md` names the copies this repository serves
and says nothing about the prebuilt binaries of sharp that `npm ci` installs, their LGPL-3.0-or-later or the version
`1.3.4` that `package-lock.json` pins for `@img/sharp-libvips-*`.

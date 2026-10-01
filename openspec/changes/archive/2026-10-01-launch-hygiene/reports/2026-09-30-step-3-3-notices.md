# Step 3.3 · The section on what npm installs and this repository does not ship

Task of `tasks.md`: "The section of `THIRD_PARTY_NOTICES.md` (decision 4)".

The code this report verifies is `4c622fd` ("Name the prebuilt binaries of sharp in the third-party notices"), in the
branch `feature/launch-hygiene` of the worktree `<worktree>`. The commit that closes this step adds this report and the
box, and changes nothing of the code below.

## What the commit carries

`THIRD_PARTY_NOTICES.md` gains the closing section `## Installed by npm, not shipped`, with:

| Package | Version | License | Where its license text travels |
| --- | --- | --- | --- |
| `@img/sharp-libvips-*`, one optional package per platform | 1.3.4, the version `package-lock.json` pins | LGPL-3.0-or-later | `node_modules/@img/sharp-libvips-<platform>/LICENSE`, inside each installed package |
| `@img/sharp-<platform>`, the binding sharp loads (`win32-x64` on Windows) | 0.35.5, the version `package-lock.json` pins | Apache-2.0 AND LGPL-3.0-or-later, and the `wasm32` binding adds MIT | `node_modules/@img/sharp-<platform>/LICENSE`, inside each installed package |

and the statement that the repository does not ship those binaries (no `Dockerfile` and no `node_modules`) and that no
code of this repository links against them. The two versions and the two licenses are read from `package-lock.json`:
twenty-seven `@img/*` entries, the ten `@img/sharp-libvips-*` at 1.3.4 with `LGPL-3.0-or-later`, the platform bindings
at 0.35.5 with `Apache-2.0 AND LGPL-3.0-or-later`, which is what `next` 16.3.6 installs.

## Evidence

| Command | Result | Commit |
| --- | --- | --- |
| `npx -y -p node@24 node node_modules/vitest/vitest.mjs run tests/third-party-notices.test.ts` | 1 file, 6 tests passed, 317 ms, exit 0 | `4c622fd` |
| `node -e "Object.entries(require('./package-lock.json').packages).filter(@img)"` | `@img/sharp-libvips-*` 1.3.4 `LGPL-3.0-or-later`, `@img/sharp-win32-x64` 0.35.5 `Apache-2.0 AND LGPL-3.0-or-later` | `4c622fd` |
| `Test-Path Dockerfile` and `git ls-files \| grep Dockerfile` | false, no record | `4c622fd` |

The case "names the pattern, the version of the lock and the license of the prebuilt binaries of sharp" is the one that
was red in `0b7e34e` and is green here; the case "fails a section that names another version of the binaries" keeps its
own synthetic section, so the guard is measured and not assumed.

## Decisions taken by the implementer

1. The section carries a second row for the platform binding (`@img/sharp-<platform>`), which is the package that
   actually holds the LGPL part on Windows, with the extra MIT of the `wasm32` binding named in the cell. The
   requirement asks for `@img/sharp-libvips-*`; naming the second package makes the row of the version true on every
   platform instead of only on the ones that install libvips.
2. The guard of `tests/third-party-notices.test.ts` asked for the literal `through next`; the house style of the file
   writes a package name in backticks, so the section says `installed through \`next\`` and the guard asks for
   `installed through` and `next`. The requirement (the origin is named) is the same; only the literal of the guard
   changed, before the section existed in the tree.

## Verdict

`THIRD_PARTY_NOTICES.md` names `@img/sharp-libvips-*`, `LGPL-3.0-or-later`, the version 1.3.4 of `package-lock.json`,
the folder where the license text travels and the statement that nothing of this repository links or ships those
binaries, and the test that reads all of it is green on `4c622fd`. Verified.

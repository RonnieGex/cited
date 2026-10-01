Contract of Claude (in the role of Fable), from Franc's "cerremos lo que tenemos con broche de oro" (2026-09-30): the
loose ends of the public launch (2p and the notice of sharp). DeepSeek implements, an independent session reviews,
Franc accepts. A task is `[x]` only with its exact command and result in a report under
`reports/YYYY-MM-DD-step-N-<name>.md`, naming the commit of the code it verified.

## 0. Step 0: the branch

- [x] 0.1 `feature/launch-hygiene`, created by Fable from `origin/main` at `86b250f`, with this contract

## 1. Base before

- [x] 1.1 `npm ci`, `npm test`, `npm run typecheck`: counts, runtime and `node -v`; `git ls-files -s` of the three
      agent paths (mode `120000`), in `reports/<date>-step-1-base.md`

## 2. Tests first (each one red on `86b250f`)

- [x] 2.1 `tests/agent-copies.test.ts`: the three folders hold the files of `ai-specs/agents/` byte for byte, and git
      tracks no path with mode `120000`; plus a case that builds a drifted copy in a temporary folder and expects the
      check to name the folder and the file (scenarios "A Windows clone…" and "A copy that drifts")
- [ ] 2.2 `tests/third-party-notices.test.ts`: the section of the binaries of sharp names `@img/sharp-libvips-*`,
      `LGPL-3.0-or-later` and the version of `package-lock.json` (scenarios of `supply-chain-security`)

## 3. Implementation

- [ ] 3.1 `scripts/sync-agents.mjs` and `npm run agents:sync`; the three links replaced by the folders it writes
      (decision 1)
- [ ] 3.2 `.gitattributes` gives the copies LF if the existing rules do not (decision 2)
- [ ] 3.3 The section of `THIRD_PARTY_NOTICES.md` (decision 4)

## 4. Existing tests

- [ ] 4.1 `tests/personal-paths.test.ts` keeps passing with its own link fixtures; its notes updated (decision 3)

## 5. Run the tests and the checks

- [ ] 5.1 `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run secrets:scan`,
      `npm run openspec:validate`, in `reports/<date>-step-5-checks.md`

## 6. Manual verification

- [ ] 6.1 A fresh clone on Windows with `git -c core.symlinks=false clone` of the branch: the three folders exist with
      their three files, and `codex exec --skip-git-repo-check "List the files of .codex/agents" < NUL` run inside the
      clone gets past loading its configuration without `os error 267` (paste its first lines; an answer or a message
      of the account's usage limit both show the configuration loaded; no other command of Codex). A second clone in a
      `node:24` container shows the same three folders. Output in `reports/<date>-step-6-clones.md`

## 7. End to end

- [ ] 7.1 Not applicable: the change has no frontend; the report says so

## 8. Documentation

- [ ] 8.1 `docs/development-guide.md` and `CONTRIBUTING.md`: agents are edited in `ai-specs/agents/` and copied with
      `npm run agents:sync`; the paragraph on the links rewritten

## 9. Close

- [ ] 9.1 `## Issues` at the end of the last report, with the decisions taken by the implementer
- [ ] 9.2 Fable pushes the branch and opens the pull request
- [ ] 9.3 Adversarial review by an independent session (`katalis-dev/tasks/revision-launch-hygiene.md`)
- [ ] 9.4 Franc accepts; the change is archived and merged through the pull request

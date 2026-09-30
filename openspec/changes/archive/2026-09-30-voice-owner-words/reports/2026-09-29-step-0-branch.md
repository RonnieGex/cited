# Step 0: the branch

- Date: 2026-09-29
- Change: `voice-owner-words`
- Branch: `feature/voice-owner-words`
- Agent: deepseek-harness
- Commit of this report: the commit that carries it (the branch state below was read at `dc29d08`, the commit that set
  `LOOP_STATE.md` to RUNNING)
- Tasks: 0.1

## 0.1 The branch, the base and `npm ci`

### Command and output

```
$ git rev-parse --abbrev-ref HEAD
feature/voice-owner-words

$ git log -1 --format='%H %p %s' 2f9a75b
2f9a75b87739c85fb2fb05e3474f9ffdf36addac d71220d Write the contract of voice-owner-words: the voice routes and screen stop naming environment variables

$ git log -1 --format='%H %p %s' d71220d
d71220db9e2bf9094cca88495d455aecdca57d3a 03101b6 d9a1997 Merge provider-keys-in-panel: the owner connects AI providers from the panel, keys encrypted, SSRF-safe tests

$ git status --short --branch
## feature/voice-owner-words
```

The branch is the one Fable created: `2f9a75b` (the contract) sits directly on `d71220d`, the local merge of `main`
whose first parent is `03101b6` (the `elevenlabs-voice-agent` lane) and whose second parent is `d9a1997` (the archived
`provider-keys-in-panel`). The working tree was clean at the start of the round; the only commit of the round before
this report is `dc29d08` (the loop state set to RUNNING). No push and no remote: the branch exists only in this
worktree.

### `npm ci`

```
$ npm ci
added 694 packages, and audited 699 packages in 57s

216 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities

npm warn EBADENGINE current: { node: 'v24.11.0', npm: '11.6.1' }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE   package: 'w3c-xmlserializer@6.0.0',
npm warn EBADENGINE   required: { node: '^22.22.2 || ^24.15.0 || >=26.0.0' },
npm warn EBADENGINE   current: { node: 'v24.11.0', npm: '11.6.1' }
npm warn EBADENGINE }
npm warn deprecated eslint@9.39.5: This version is no longer supported. Please see https://eslint.org/version-support for other options.
exit=0
```

The install of the locked tree finished with exit code 0, 694 packages added, 0 vulnerabilities and no error. The
`EBADENGINE` warning is the one the contract anticipates: the Windows interpreter of this machine is `v24.11.0`, older
than the `^24.15.0` that `w3c-xmlserializer@6.0.0` declares, which is exactly why step 5.1 repeats the whole suite in
a `node:24` Linux container (the image answers `v24.21.0`, measured below).

```
$ node --version
v24.11.0

$ docker run --rm node:24 node --version
v24.21.0
```

## Verdict

Task 0.1 is done: the branch and its base are the ones of the contract, the locked tree is installed with exit code 0,
and the interpreter of the Linux run of step 5.1 (v24.21.0) is newer than 24.15.

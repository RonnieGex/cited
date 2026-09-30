# Step 0: the branch (task 0.1)

Date: 2026-09-30. Implementer: DeepSeek. Contract: `openspec/changes/guided-setup-and-knowledge/tasks.md` at 2a69eb5.

## The branch and its base (decision 11)

    $ git rev-parse --abbrev-ref HEAD
    feature/guided-setup-and-knowledge

    $ git rev-parse HEAD
    2a69eb5cd319a16c843479c0c259d4922fb56e3f

    $ git merge-base HEAD main
    5929b641a26a03717e96775745af1da3091db0fe

    $ git rev-parse main
    5929b641a26a03717e96775745af1da3091db0fe

    $ git log --oneline -3
    2a69eb5 Write the contract of guided-setup-and-knowledge: from zero to an answer in four steps, on the identity of Cited
    5929b64 Merge brand-identity-ui: the identity of Cited reaches the panel and the public page
    a5fa956 Let the evidence test find the reports of brand-identity-ui after the archive moves them

The branch is the one the contract names, it was born from `main` (5929b64) and `main` is exactly its merge base: no
commit of `main` is missing and nothing was written on `main` (its tip is the base of this branch). The three commits
that `main` carries and the contract counts on — the keys in the panel, the voice agent with its codes, the identity of
the brand (the wordmark, the citation mark, the highlighter, the numbered ink navigation) — are all inside this branch.

Nothing was found uncommitted in the tree when the round started (`git status --porcelain` was empty before this file
was written).

## The machine, and the Node the engine asks for

The engine of the repository declares `>=24.15.0 <25.0.0` (`package.json`, `engines`), and the Node of this Windows
machine is older:

    $ node -v
    v24.11.0

`npm.cmd` uses its sibling Node and would prove nothing about the version the tests run on, so every command of this
round runs the Node of the contract and prints it, as the task asks:

    $ npx -y -p node@24 node -v
    v24.21.0

## `npm ci`

    $ npm ci
    added 694 packages, and audited 699 packages in 33s
    found 0 vulnerabilities
    [exit=0]

`npm ci` warns that the Node of the machine (v24.11.0) does not satisfy the engine of three packages, which is the
same fact as above: the install is done by the sibling Node of `npm.cmd`, and every test and build of this round runs
with `npx -y -p node@24 node …`, which does satisfy it.

## The state of the branch at the end of this step

    $ git status --porcelain=v1
     M LOOP_STATE.md

Only the loop state of this round (STATUS: RUNNING) is uncommitted; it is part of the commit of this step.

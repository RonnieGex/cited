# Step 9: verify

Date: 2026-10-09. Executor: parent Codex. Branch: docs/english-example. Inspected base SHA: b4e749f539399637d763a1ebaf6da55e729fdfd5 plus R6 working tree.

Executed openspec validate --all --strict through its installed openspec.js with Node v24.21.0: exit 0; r6-openspec.json. Reconciled evidence, locale selection, honest counts, preserved Spanish raw bytes, own-call provenance, automated checks, browser measurements, curl and documentation against tasks. node tasks/verify-agents-r6.mjs passed; r6-integrity.json contains SHA-256 per historical file and exact English-copy counts. The public sample capture records the main commit and matched installed library hash. Runtime APIs and database model untouched. Task-owned landing server PID 48144 stopped after captures; Get-NetTCPConnection confirms no listeners on 3240, 3243, 3246, 4176 or 4186 in r6-ports.json. No desktop application/profile touched. Independent final adversarial review remains the next step, followed by archive, commit and remote CI where configured.

Verdict: PASS.

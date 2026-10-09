# Round-two validation

Authority: Fable correction assignment; implementer Codex.

- TDD: `npx -y -p node@24 node node_modules/vitest/vitest.mjs run tests/readme.test.ts`: initially 1 failed/44 passed on old graphic, then 45 passed after implementation. An intermediate Windows edit introduced CRLF; normalized touched text to LF, preserving parser expectations. Updated alt/roadmap contracts alongside new wording.
- `npx -y -p node@24 node node_modules/vitest/vitest.mjs run --reporter=dot`: 96 files, 1166 passed, 0 failed. Summary: 2026-10-09-r2-unit.txt.
- `npx -y -p node@24 node scripts/store-state.ts .data/agents-readme.sqlite` and `Get-FileHash .data/agents-readme.sqlite -Algorithm SHA256` before/after: identical row counts and SHA-256; saved adjacent files. This is the isolated public sample fixture.
- `npx -y -p node@24 node scripts/render-readme-graphics.mjs agents roadmap`: four PNGs, minimum text 16px, no overflow. Both themes inspected. Only agents and roadmap changed; old rounded/glowing graphics are intact.
- `npx -y -p node@24 node node_modules/eslint/bin/eslint.js scripts/render-readme-graphics.mjs scripts/readme-graphics/manifest.mjs scripts/readme-graphics/data.mjs scripts/readme-graphics/agent-evidence.mjs tests/readme.test.ts`: exit 0.
- `npx -y -p node@24 node node_modules/typescript/bin/tsc --noEmit`: exit 0.
- `openspec validate agents-readme --strict --json`: valid, no issues.
- Agent-executed curl: `curl.exe --silent --show-error --fail-with-body --config - http://127.0.0.1:3240/api/mcp --data-binary @<temporary-request>`: exit 0, genuine cited_search returns 380-peso sample passage. Bearer supplied over stdin, not printed. Sanitized result in 2026-10-09-r2-curl.json.
- `git diff --check`: exit 0.

Natural plugin output is copied exactly from dsh-cited. The supporting price passage is explicitly labelled as a separate recorded search. The renderer checks saved event/transcript consistency and a matching search call/result before drawing. CI E2E and required checks are verified on the final PR head after push.

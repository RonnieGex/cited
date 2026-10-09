Contract of Franc to DeepSeek, through Fable (2026-10-08): "hazlo, empieza con la spec del MCP en Cited, crea un loop,
que todo lo haga DeepSeek y al final lo revisas tú". DeepSeek implements in the loop, Fable reviews at the end. A task
is `[x]` only with its exact command and result in a report under `reports/YYYY-MM-DD-step-N-<name>.md`, naming the
commit of the code it verified.

## 0. Step 0: the branch

- [x] 0.1 `feature/mcp-server`, created from `origin/main` at `f644f85`, with this contract. Evidence: `git branch
      --show-current` prints `feature/mcp-server` and `git log --oneline -1` prints `f644f85 Merge launch-hygiene: real
      agent folders on every platform, and the notice of sharp`

## 1. Spec, before any code

- [x] 1.1 `openspec/changes/mcp-server/`: `proposal.md`, `design.md`, `tasks.md` and the spec of the new capability
      `mcp-server`, with SHALL requirements and WHEN/THEN scenarios; `npx openspec validate mcp-server --strict` exit 0,
      in `reports/<date>-step-1-spec.md`

## 2. Tests first (each one red before the code)

- [x] 2.1 `tests/mcp-protocol.test.ts`: the negotiation of the version, the four JSON-RPC error codes, the answer to a
      notification and the answer to a method the server does not implement (scenarios of "The endpoint speaks the
      stateless Streamable HTTP transport" and of "Every failure is a JSON-RPC error or a tool error")
- [x] 2.2 `tests/mcp-tools.test.ts`: the two definitions with their schemas and annotations, the search over a seeded
      store with no chat provider, the answer and the refusal of `cited_ask`, the arguments outside the schema, the
      query longer than `MAX_QUESTION_CHARS`, the hourly limit per token and the daily cap of the model (scenarios of
      "The server exposes two read-only tools" and of "The limits of the token bound the calls")
- [x] 2.3 `tests/mcp-route.test.ts`: the real `POST` of `app/api/mcp/route.ts` with `Request` objects, a seeded store
      and the deterministic doubles, with no network: the `404` without a token, the `401` with `WWW-Authenticate`, the
      `403` of a foreign origin, the `202` of a notification, the `400` of the version header, the `405` of `GET` and
      `DELETE`, the token absent from every body, and the conversation stored as `/api/ask` stores it (scenarios of the
      four remaining requirements)
- [x] 2.4 The red run of the three files, with its counts and its failures, in `reports/<date>-step-2-red.md`

## 3. Implementation

- [ ] 3.1 `lib/guards/bearer.ts` with the constant-time comparison, and `lib/voice/secret.ts` re-exporting it
      (decision 15)
- [ ] 3.2 `lib/mcp/protocol.ts` and `lib/mcp/server.ts`: the versions, the server information and `handleMessage()`
      (decisions 1, 8, 13)
- [ ] 3.3 `lib/mcp/auth.ts` and `lib/mcp/limits.ts`: the origin check, the bearer and the per-token window
      (decisions 2, 3, 4, 5)
- [ ] 3.4 `lib/mcp/tools.ts` and the `quota` input of `lib/answer/ask.ts` (decisions 6, 9, 10, 11, 12, 14)
- [ ] 3.5 `app/api/mcp/route.ts`: the transport, its status codes and its headers
- [ ] 3.6 The three files of step 2 green, in `reports/<date>-step-3-green.md`

## 4. Existing tests

- [ ] 4.1 `tests/voice-secrets.test.ts` and `tests/voice-tool.test.ts` keep passing with the re-export; the store of
      `tests/store.test.ts` keeps its list of tables (decision 7)

## 5. Run the tests and the checks

- [ ] 5.1 `npm run typecheck`, `npm run lint`, `npx -y -p node@24 node node_modules/vitest/vitest.mjs run`,
      `npm run build` in a clean clone with no `.env`, `npx openspec validate --all --strict`, `npm run secrets:scan`
      and `npm run audit:high`: exit 0 each, with the counts, the runtime and `node -v`, in
      `reports/<date>-step-5-checks.md`

## 6. Manual verification

- [ ] 6.1 `scripts/mcp-seed.ts` fills a store with `samples/` in keyword mode; `next start` on port 3230 with
      `CITED_MCP_TOKEN` and no chat provider; `curl.exe` runs `initialize`, `tools/list`, `tools/call cited_search`,
      a call without the bearer, a call with a foreign `Origin`, a `GET` and an unknown method, with the pasted
      responses, in `reports/<date>-step-6-manual.md`
- [ ] 6.2 `scripts/mcp-smoke.mjs` against that server: `initialize`, `tools/list` and `cited_search`, with its output

## 7. The gate

- [ ] 7.1 `scripts/gate-mcp.mjs` affirms every line of the contract and prints one line per assertion, and its run ends
      with `GATE: GREEN`, in `reports/<date>-step-7-gate.md`

## 8. End to end

- [ ] 8.1 Not applicable: the change has no page and no component; the report says so

## 9. Documentation

- [ ] 9.1 `docs/mcp.md`: what it is, how to activate it, the variables and the exact configuration of DeepSeek
      Harness, Claude Code, Codex, Cursor and `curl`, written as documented and never as verified
- [ ] 9.2 `README.md` and `README.es.md`: the short section "Works with your agent" / "Funciona con tu agente" that
      links `docs/mcp.md`; `tests/readme.test.ts` keeps its bilingual map and its order in step
- [ ] 9.3 `.env.example` with `CITED_MCP_TOKEN` and `MCP_RATE_LIMIT_PER_HOUR` commented; `docs/development-guide.md`
      with the port, the script and the variable; `docs/security.md` with the row of the endpoint

## 10. Close

- [ ] 10.1 `## Issues` (BROKEN, RISK, NOT DONE, UNKNOWN) at the end of the last report, with the decisions of the
      implementer
- [ ] 10.2 Every `[x]` of this file travels in the commit that carries its evidence
- [ ] 10.3 `LOOP_STATE.md` with `STATUS: DONE` or `STATUS: BLOCKED` and the cause, and
      `katalis-dev/tasks/entrega-cited-mcp-server.md` in Mexican Spanish
- [ ] 10.4 Fable reviews the branch, connects each client and marks as verified only the ones that work; the review and
      the archive of the change are not mine

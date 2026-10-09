# Step 10.4: review and real clients

- Date: 2026-10-09
- Reviewer: Fable (the implementer was DeepSeek)
- Commit reviewed: `3685490` (code verified by the gate at `1788899`)

## Review

The route, `lib/mcp/` and the change to `lib/answer/ask.ts` were read against the contract of the mission and the spec.

- The guards run in the order of decision 3 (off, origin, bearer); the bearer is compared in constant time through the
  helper the voice tool already used, and an empty token refuses every call.
- The hourly window is keyed by the SHA-256 of the token, never by the token itself.
- `cited_search` never builds a chat model; it uses the embeddings of the installation when it has them and the keyword
  mode otherwise.
- `cited_ask` reuses `askQuestion()` with `quota: "external"`: the per-address limit of the public route is skipped
  because the endpoint counts its own per token, and the daily cap of model calls and the retention still apply.
- Every failure is a JSON-RPC error or a tool result with `isError`; every text that leaves passes `publicMessage()`.

No defect was found that blocks the merge. Findings that stay as risks are listed at the end.

## A real answer through the endpoint

A production server of the build on port 3240, a store seeded from `samples/` in keyword mode, a random token and the
DeepSeek chat model of the reviewer's environment:

```
tools/call cited_ask {"question": "¿Cuánto cuesta una afinación de bicicleta?"}
-> answered | Una afinación de bicicleta cuesta 380 pesos [1]. | citations: [(1, cafe-la-horquilla.md)]
```

The same question in English was refused, which is the expected behaviour of the keyword mode over Spanish documents
(no embeddings were configured): the refusal is honest, not an invented answer.

## Real clients

A small logging proxy (port 3241, outside the repository) forwarded each request to the server and wrote the JSON-RPC
method, the status and the user agent. The token never appears below.

| Client | What reached Cited | Result |
|---|---|---|
| DeepSeek Harness, headless profile, DeepSeek model, `dsh-mcp-client` row of `docs/mcp.md` section 4 | `server/discover` 400, `initialize` 200, `notifications/initialized` 202, `GET` 405, `tools/list` 200, `tools/call cited_search` 200 | answered "La afinación de bicicleta cuesta 380 pesos, según el documento cafe-la-horquilla.md (sección «Precios») [1]" |
| Claude Code 2.1.268 (`claude mcp add --transport http`, local scope, removed afterwards) | `initialize` 200, `notifications/initialized` 202, `GET` 405, `tools/list` 200 | `claude mcp get` reports `Connected` |
| Codex 0.157.0 (`mcp_servers.cited.url` and `bearer_token_env_var` of `docs/mcp.md` section 6, passed with `-c`) | `initialize` 200, `notifications/initialized` 202, `tools/list` 200 | connected; the model run itself failed with `401` from the OpenAI API because the CLI was signed out |

Claude Code could not run a model either (its CLI session had expired), so for Claude Code and Codex the verified scope
is the connection and the tool list; the tool call is the same request DeepSeek Harness and `curl` made. The README says
exactly that.

## Changes made in this step

- `README.md` and `README.es.md`: the "Works with your agent" section lists each client with what was verified on
  2026-10-09; Cursor stays as documented, not tested.
- `docs/mcp.md`: the DeepSeek Harness row now shows the full `insert` patch, where to keep it and where the token comes
  from; the Claude Code and Codex sections say what was verified.

## Issues

### BROKEN

- `npm audit --audit-level=high` is red on this branch and on `main` (`next` 16.3.6 and the chain of
  `eslint-config-next`). It is not caused by this change. It is fixed in its own pull request before this one merges,
  because the required check `Dependency audit` blocks every pull request until then.

### RISK

- The hourly window lives in the memory of one process; several processes multiply the ceiling (design decision 5).
- The `Origin` check compares with the `Host` header; behind a proxy that rewrites `Host`, a browser client on the real
  domain would receive `403`. Command-line clients send no `Origin` and are not affected.

### NOT DONE

- A tool call from Claude Code and from Codex, blocked only by the sign-in of their CLIs on this machine.
- Cursor was not tested.

### UNKNOWN

- How each client behaves once the `2026-07-28` revision becomes the only one it speaks: today all three fall back to
  `2025-06-18`.

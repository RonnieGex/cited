# Step 6: the manual verification with curl

- Date: 2026-10-08
- Change: `mcp-server`
- Branch: `feature/mcp-server`
- Agent: DeepSeek (implementer)
- Worktree: `<worktree>`
- Server: `next start --port 3230` over the build of `next build`, store seeded from `samples/` in keyword mode, no
  chat provider and no embeddings provider, `CITED_MCP_TOKEN=<token>`

The store and the bodies of the requests are files of the temporary folder of the machine (`<temp>`), never of the
repository. The query of the first request is the line of `samples/cafe-la-horquilla.md` that states the price of a
bicycle tune-up. The token of the run is written as `<token>` in every command: it was a local value of this machine,
it was never committed and it belongs to no service.

```
$ node scripts/mcp-seed.ts <temp>/store.sqlite samples/
ingested cafe-la-horquilla.md (md, 4 passages)
documents 4, store <temp>/store.sqlite
```

## 1. `tools/call cited_search`, with the query taken from `samples/`

```
$ curl.exe -sS http://127.0.0.1:3230/api/mcp -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d "@<temp>/search.json"
{"jsonrpc":"2.0","id":3,"result":{"content":[{"type":"text","text":"Cited found 2 passage(s) for \"afinacion de
bicicleta\". Cite each one by its number, like [1].\n\n1. cafe-la-horquilla.md · Precios\nPrecios\n- Espresso: 35
pesos.\n- Café de olla: 45 pesos.\n- Pan dulce del día: 30 pesos.\n- Afinación de bicicleta: 380 pesos.\n- Cambio de
cámara: 120 pesos.\n2. notas-del-negocio.txt\n…"}],"structuredContent":{"passages":[{"n":1,"document":\
"cafe-la-horquilla.md\","heading":"Precios","position":2,"excerpt":"Precios\n- Espresso: 35 pesos.\n… Afinación de
bicicleta: 380 pesos.\n- Cambio de cámara: 120 pesos."},{"n":2,"document":"notas-del-negocio.txt","heading":null,
"position":0,"excerpt":"Café La Horquilla — notas del negocio …"}]}}}
```

The passage of `cafe-la-horquilla.md` comes back with its document, its section, its position and its text, exactly as
an answer of the public chat cites it, and no chat model was called: the installation declares no `CHAT_PROVIDER`.

## 2. `initialize`

```
$ curl.exe -sS -i http://127.0.0.1:3230/api/mcp -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d "@<temp>/initialize.json"
HTTP/1.1 200 OK
cache-control: no-store
content-type: application/json; charset=utf-8
```

The body carries `"protocolVersion":"2025-06-18"`, `"serverInfo":{"name":"cited","version":"0.1.0"}` and
`"capabilities":{"tools":{}}`.

## 3. `tools/list`

The answer names exactly `cited_search` and `cited_ask`, each one with its `inputSchema`, its `outputSchema` and
`"annotations":{"readOnlyHint":true,"openWorldHint":false}`.

## 4. Without the bearer, with a foreign `Origin`, with `GET` and with an unknown method

```
$ curl.exe -sS -o - -w "\nstatus=%{http_code} www-authenticate=%header{www-authenticate}\n" -X POST \
    http://127.0.0.1:3230/api/mcp -H "Content-Type: application/json" -d "@<temp>/search.json"
unauthorized
status=401 www-authenticate=Bearer

$ curl.exe -sS -o - -w "\nstatus=%{http_code}\n" -X POST http://127.0.0.1:3230/api/mcp \
    -H "Authorization: Bearer <token>" -H "Origin: https://evil.example" \
    -H "Content-Type: application/json" -d "@<temp>/search.json"
forbidden
status=403

$ curl.exe -sS -o - -w "status=%{http_code} bytes=%{size_download}\n" -X POST http://127.0.0.1:3230/api/mcp \
    -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d "@<temp>/initialized.json"
status=202 bytes=0

$ curl.exe -sS http://127.0.0.1:3230/api/mcp -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" -d "@<temp>/unknown.json"
{"jsonrpc":"2.0","id":4,"error":{"code":-32601,"message":"the method resources/list is not implemented"}}

$ curl.exe -sS -o - -w "status=%{http_code}\n" http://127.0.0.1:3230/api/mcp \
    -H "Authorization: Bearer <token>"
method not allowed
status=405

$ curl.exe -sS -o - -w "\nstatus=%{http_code}\n" -X POST http://127.0.0.1:3230/api/mcp \
    -H "Authorization: Bearer <token>" -H "MCP-Protocol-Version: 2024-11-05" \
    -H "Content-Type: application/json" -d "@<temp>/unknown.json"
{"jsonrpc":"2.0","id":null,"error":{"code":-32600,"message":"the protocol version 2024-11-05 is not supported"}}
status=400
```

## 5. The same server started without `CITED_MCP_TOKEN`

```
$ curl.exe -sS -o - -w "status=%{http_code} bytes=%{size_download}\n" -X POST http://127.0.0.1:3231/api/mcp \
    -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d "@<temp>/search.json"
status=404 bytes=0
```

## 6. `scripts/mcp-smoke.mjs`

```
$ node scripts/mcp-smoke.mjs --url http://127.0.0.1:3230/api/mcp --token <token> --query "afinacion de bicicleta"
== initialize ==
{ "protocolVersion": "2025-06-18", … "serverInfo": { "name": "cited", "version": "0.1.0" } }
== tools/list ==
[ "cited_search", "cited_ask" ]
== cited_search ==
[ "1. cafe-la-horquilla.md — Precios\n- Espresso: 35 pesos.\n…", "2. notas-del-negocio.txt — …", … ]
== cited_ask ==
the AI is not connected yet: the owner connects it in the panel, or whoever installs Cited sets it on the server
SMOKE: GREEN
```

`cited_ask` is a tool error of the honest kind on this server: the installation has no chat provider, so there is no
answer to write, and the sentence names no variable of the environment.

## Verdict

PASS. Every status code and every body of the contract was measured against the production build of this branch, with
the token, without it, from another origin and from the command line.

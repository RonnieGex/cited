# MCP server

Cited speaks the [Model Context Protocol](https://modelcontextprotocol.io), so an agent can search the documents of an
installation and answer from them, with the citations and with the same honest refusal the public chat gives. The
endpoint is one route of the same application, it is off until the owner declares a token, and the two tools it exposes
are read-only.

## 1. Turn it on

```bash
npm run build
CITED_MCP_TOKEN=<a long random token> npm start
```

| Variable | Default | What it does |
|---|---|---|
| `CITED_MCP_TOKEN` | empty | the bearer every client sends. Without it the endpoint is off and answers `404` to every method, revealing nothing about the installation |
| `MCP_RATE_LIMIT_PER_HOUR` | `120` | how many tool calls one token may make in an hour. A value that is empty, zero, negative or not an integer keeps the default |

The endpoint is `POST /api/mcp` of the installation, so its URL is `https://<the host of the installation>/api/mcp`.
Both variables are read when the process starts, and neither of them is ever written to the store, to a response or to a
line of a log.

A token that is long and random is the whole authentication of the endpoint: generate it once with `openssl rand
-base64 32` (or the equivalent of the platform), keep it out of the repository, and give it to the agent that needs it.
Rotating it is starting the process with the new value.

## 2. The two tools

| Tool | Input | Output |
|---|---|---|
| `cited_search` | `{ "query": string, "limit"?: 1..8, 5 by default }` | `{ "passages": [{ "n", "document", "heading", "position", "excerpt" }] }` |
| `cited_ask` | `{ "question": string, "sessionId"?: string }` | `{ "status": "answered", "answer", "citations": [{ "n", "document", "heading", "position", "excerpt", "lead" }] }`, or `{ "status": "refused", "answer", "citations": [] }` |

`cited_search` ranks the passages of the documents with the same hybrid search the public chat uses. It uses the
embeddings of the installation when they are configured and the keyword mode when they are not, it writes nothing, and
it never calls a language model: a search spends none of the balance of the owner. The text of the result carries the
passages numbered, so the model of the client can cite them as `[1]`.

`cited_ask` runs the pipeline of `POST /api/ask`: it searches, asks the chat model of the installation to answer only
from the passages it received, and returns the answer with its numbered citations. When the documents do not hold the
answer it returns `refused` with the sentence of the refusal instead of an invention. With a `sessionId` the turn is
stored like any other conversation of the installation, with the same retention.

## 3. The transport

The endpoint speaks the **Streamable HTTP** transport of MCP, in its revision `2025-06-18` and its revision
`2025-03-26`, without sessions:

- `POST` with one JSON-RPC 2.0 message answers `200` with one JSON object and `Content-Type: application/json`; the
  endpoint never opens a stream of events.
- A notification (`notifications/initialized`) answers `202` with no body.
- `GET` and `DELETE` answer `405`.
- A request that carries an `MCP-Protocol-Version` the server does not speak answers `400`.
- A request without `Authorization: Bearer <token>`, or with a token that does not match, answers `401` with
  `WWW-Authenticate: Bearer`.
- A request whose `Origin` names a host that is not the host of the installation answers `403`. A request with no
  `Origin`, which is the case of a client of the command line, is served.

Every failure is a JSON-RPC error (`-32700`, `-32600`, `-32601`, `-32602`) or a tool result with `isError: true`; no
failure is a server error of the route, and no text of a provider and no name of a variable of the environment ever
leaves it.

## 4. DeepSeek Harness

**The short way: the native plugin.** In DeepSeek Harness, open **Plugins → Add plugin**, paste
`https://github.com/RonnieGex/dsh-cited` and install; then write the URL of the installation and the token in the card
of the plugin. It exposes the same two tools and calls this endpoint. Verified on 2026-10-09 with the desktop app
0.2.0-rc.2. Its repository explains the rest: https://github.com/RonnieGex/dsh-cited

**The MCP way.** The MCP client is the plugin `@deepseek-ai/dsh-mcp-client`, one row per server. A row goes inside an
`insert` patch:

```yaml
- insert:
    - id: mcp-cited
      name: '@deepseek-ai/dsh-mcp-client'
      config:
        serverName: cited
        transport: streamable-http
        url: https://<the host of the installation>/api/mcp
        headers:
          Authorization: !!js '`Bearer ${process.env.CITED_MCP_TOKEN}`'
```

Save it as a file and pass it for one run with `dsh --patch <file>`, or merge the `insert` into the patch layer of a
profile (`$DSH_HOME/profiles/<name>/cordis.patch.yml`) or of the machine (`$DSH_HOME/cordis.patch.yml`) to keep it.
Do not overwrite an existing patch file: add the row to it. The `!!js` line reads the token from the environment of the
process that starts DeepSeek Harness, so declare `CITED_MCP_TOKEN` there (a user environment variable for the desktop
app) instead of writing the token in the file.

The tools appear as `mcp__cited__cited_search` and `mcp__cited__cited_ask`. Verified on 2026-10-09 with the headless
profile and the DeepSeek model: the client connected, listed both tools, called `cited_search` and answered with the
citation. The client first tries the `server/discover` method of a newer protocol revision, receives `400` and goes on
with `2025-06-18`, which is the expected negotiation.

## 5. Hermes Agent

**The short way: the native plugin.** The plugin of this repository installs in one step and turns both tools into
native Hermes tools:

```bash
hermes plugins install RonnieGex/hermes-cited --enable
```

Declare `CITED_URL` and `CITED_MCP_TOKEN` in `$HERMES_HOME/.env` and the agent gets `cited_search` and `cited_ask`
without an MCP configuration, plus the `/cited` and `/dot` conversation modes, a deterministic verifier that replaces
an answer whose numbers no passage of the turn contains, and the hash-chained log of
`$HERMES_HOME/cited/audit.jsonl`. Its repository explains the rest: https://github.com/RonnieGex/hermes-cited

**The MCP way.** The same two tools with nothing installed. In `$HERMES_HOME/config.yaml`:

```yaml
mcp_servers:
  cited:
    url: https://<the host of the installation>/api/mcp
    headers:
      Authorization: Bearer ${CITED_MCP_TOKEN}
    enabled: true
    trust: untrusted
```

`${CITED_MCP_TOKEN}` is read from `$HERMES_HOME/.env` or the environment, never written in the file. `trust:
untrusted` lets the two tools, which are read-only, run without an approval prompt. They appear as
`mcp__cited__cited_search` and `mcp__cited__cited_ask`. Copy the skill that makes the agent reach for Cited before the
web, `hermes_cited/skills/cited/SKILL.md` of the plugin, to `$HERMES_HOME/skills/cited/SKILL.md`.

**This route needs a Cited with the `initialize` fix.** Hermes sends `MCP-Protocol-Version: 2025-11-25` from
`initialize`. An installation that rejects that header answers `400` and the connection fails with `the protocol
version 2025-11-25 is not supported`; the fix is [RonnieGex/cited#21](https://github.com/RonnieGex/cited/pull/21).

Verified on 2026-10-09 with Hermes Agent v0.21.6+387 (commit `dce1e9b`) on Windows, against a local Cited on
`127.0.0.1:3246` seeded from `samples/`, in a temporary `HERMES_HOME`: `hermes mcp test cited` connected and listed both
tools, and a natural question in the MCP route called `mcp__cited__cited_search` and answered 380 pesos with the
citation of `cafe-la-horquilla.md · Precios`. The native plugin was installed with `hermes plugins install
"file:///C:/absolute/path/to/hermes-cited" --enable --yes-deps`; in cited mode the same question called the native
`cited_search` and no web tool, answered 380 pesos and ended with the seal `Verified by Cited`, the English guarantee
question answered 90 days, a question the samples do not answer was refused without inventing a price, and the chain of
the log of those turns verified with `python -m hermes_cited.verify_log`.

## 6. Claude Code

```bash
claude mcp add --transport http cited https://<the host of the installation>/api/mcp --header "Authorization: Bearer <token>"
```

`claude mcp get cited` should then say `Connected`. Verified on 2026-10-09 with Claude Code 2.1: the client connected and
listed both tools (it also tries a `GET` for an event stream, receives `405` and goes on, as the transport allows). The
tool call itself was not run from Claude Code that day; it is the same `tools/call` that DeepSeek Harness and `curl` ran.

## 7. Codex

In `config.toml`:

```toml
[mcp_servers.cited]
url = "https://<the host of the installation>/api/mcp"
bearer_token_env_var = "CITED_MCP_TOKEN"
```

Codex reads the token from the environment variable it names, so declare `CITED_MCP_TOKEN` before starting it. Verified
on 2026-10-09 with Codex 0.157: the client connected and listed both tools. The tool call itself was not run from Codex
that day.

## 8. Cursor

In `mcp.json`:

```json
{
  "mcpServers": {
    "cited": {
      "url": "https://<the host of the installation>/api/mcp",
      "headers": { "Authorization": "Bearer <token>" }
    }
  }
}
```

## 9. curl

```bash
curl.exe -sS https://<the host of the installation>/api/mcp -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

The same request against a local run, which is what the smoke script sends:

```bash
curl.exe -sS http://127.0.0.1:3230/api/mcp -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"cited_search","arguments":{"query":"afinación de bicicleta"}}}'
```

## 10. Limits and privacy

- `MCP_RATE_LIMIT_PER_HOUR` counts the tool calls of one token in the current hour, in the memory of the process, and
  answers a tool error with a public sentence when it is reached. `initialize`, `ping` and `tools/list` do not consume
  it. An installation that runs several processes counts each one apart: the limit is a guard of the balance of the
  owner, not a distributed quota.
- The daily cap of `DAILY_MODEL_CALL_LIMIT` and the cap of `MAX_ANSWER_TOKENS` apply to `cited_ask` exactly as they
  apply to the public chat, and a question longer than `MAX_QUESTION_CHARS` is refused by both tools.
- `cited_search` stores nothing. `cited_ask` stores the turn of a conversation when it receives a `sessionId`, in the
  store of the installation, with the retention of `CONVERSATION_RETENTION_DAYS` and no telemetry of any kind. No
  channel is marked in the store, so no migration is needed to turn the endpoint on.
- The token of an installation is the only credential of the endpoint. It is never returned, never stored and never
  written to a line of a log.

## 11. The smoke script

`scripts/mcp-smoke.mjs` runs `initialize`, `tools/list`, `cited_search` and `cited_ask` against a live server and prints
what each one answered:

```bash
node scripts/mcp-seed.ts .data/mcp-smoke.sqlite samples/
DATABASE_URL=.data/mcp-smoke.sqlite CITED_MCP_TOKEN=<token> npm start -- --port 3230
node scripts/mcp-smoke.mjs --url http://127.0.0.1:3230/api/mcp --token <token>
```

The gate of the change, `node scripts/gate-mcp.mjs`, runs the whole repository (types, lint, the suite, the build, the
strict validation of the specs, the secret scan and the audit) and then affirms every status code of section 3 against
a production server on port 3230 and a server without the token on port 3231.

## Sources

- Transports, Streamable HTTP: <https://modelcontextprotocol.io/specification/2025-06-18/basic/transports>
- Lifecycle: <https://modelcontextprotocol.io/specification/2025-06-18/basic/lifecycle>
- Tools: <https://modelcontextprotocol.io/specification/2025-06-18/server/tools>
- DeepSeek Harness, MCP client plugin:
  <https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/mcp/mcp-client>
- Claude Code, MCP: <https://code.claude.com/docs/en/mcp>
- Codex, MCP servers: <https://developers.openai.com/codex/config-reference>
- Cursor, MCP: <https://docs.cursor.com/context/model-context-protocol>

The configurations of this document are written as the documentation of each client describes them. Fable connects each
client and marks as verified only the ones that work.

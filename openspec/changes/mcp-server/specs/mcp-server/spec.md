## Why

Cited answers with citations through `POST /api/ask`, the public page and the widget, and an agent that speaks the
Model Context Protocol has no way to read the documents of an installation. This capability is the MCP endpoint of
Cited: the passages with their citation fields, the answer with its citations and the honest refusal, behind a token
of the owner and behind a limit per token.

## ADDED Requirements

### Requirement: The endpoint speaks the stateless Streamable HTTP transport

`app/api/mcp/route.ts` SHALL be the single MCP endpoint, SHALL accept `POST` with one JSON-RPC 2.0 message and SHALL
answer `200` with `Content-Type: application/json` and one JSON object, without a Server-Sent Events stream. The
endpoint SHALL assign no session, so every request stands alone. A notification SHALL be answered `202` with no body.
`GET` and `DELETE` SHALL be answered `405`. The server SHALL negotiate the protocol version `2025-06-18` or
`2025-03-26`, answering the requested version when it supports it and the latest version it supports otherwise. A
request that carries an `MCP-Protocol-Version` header the server does not support SHALL be answered `400`.

#### Scenario: A request gets one JSON object

- **WHEN** a `POST` carries an `initialize` request with `Accept: application/json, text/event-stream`
- **THEN** the response is `200`, its `Content-Type` is `application/json`, its body is one JSON-RPC object whose
  `result.serverInfo.name` is `cited` and whose `result.capabilities.tools` is present, and no `text/event-stream`
  is offered

#### Scenario: A notification is accepted without a body

- **WHEN** a `POST` carries the `notifications/initialized` notification
- **THEN** the response is `202` and its body is empty

#### Scenario: The protocol version is negotiated

- **WHEN** an `initialize` request asks for `2025-03-26` and another asks for `1999-01-01`
- **THEN** the first receives `protocolVersion` `2025-03-26` and the second receives `2025-06-18`

#### Scenario: An unsupported version header is refused

- **WHEN** a `POST` carries `MCP-Protocol-Version: 2024-11-05`
- **THEN** the response is `400` and no tool runs

#### Scenario: The methods without a body

- **WHEN** the endpoint receives a `GET` and a `DELETE`
- **THEN** both are answered `405` and neither is answered with an event stream

### Requirement: The server is off until its token exists, and behind it

Without `CITED_MCP_TOKEN` the route SHALL answer `404` with no body and SHALL reveal nothing about itself. With a
declared token, every request SHALL require `Authorization: Bearer <token>`, compared in constant time; a request
without the header or with a token that does not match SHALL be answered `401` with `WWW-Authenticate: Bearer`. A
request whose `Origin` header names a host that is not the host of the request SHALL be answered `403`; a request with
no `Origin` SHALL be accepted. The token SHALL never appear in a response body, a header or a log line.

#### Scenario: An installation without a token is closed

- **WHEN** `CITED_MCP_TOKEN` is empty and a `POST`, a `GET` and a `DELETE` arrive
- **THEN** all three are answered `404` with an empty body

#### Scenario: A missing or wrong bearer

- **WHEN** the token is declared and a request carries no `Authorization` header, and another carries a different
  token
- **THEN** both are answered `401` with `WWW-Authenticate: Bearer`, and neither body carries the declared token

#### Scenario: An origin that is not the site's

- **WHEN** the token is declared and a `POST` carries `Origin: https://evil.example`
- **THEN** the response is `403` and no tool runs

#### Scenario: No origin, and the site's own origin

- **WHEN** the token is declared and one request carries no `Origin` and another carries the `Origin` of the host it
  was sent to
- **THEN** both are served

### Requirement: The server exposes two read-only tools

`tools/list` SHALL answer exactly `cited_search` and `cited_ask`, each with a `description`, an `inputSchema`, an
`outputSchema` and `annotations` whose `readOnlyHint` is `true` and whose `openWorldHint` is `false`. `cited_search`
SHALL take `{ query: string, limit?: integer }` with `limit` between 1 and 8 and 5 by default, SHALL rank with
`hybridSearch()` over the store of the installation, SHALL use the embeddings of the installation when they are
configured and the keyword mode otherwise, SHALL never call the chat model, and SHALL answer `structuredContent` with
`passages` of `n`, `document`, `heading`, `position` and `excerpt`, beside a numbered text in `content`. `cited_ask`
SHALL take `{ question: string, sessionId?: string }` and SHALL answer what `askQuestion()` returns, with the answer
and its citations or with the honest refusal.

#### Scenario: The list of tools

- **WHEN** `tools/list` arrives
- **THEN** the result names `cited_search` and `cited_ask` and no other tool, and every entry carries `inputSchema`,
  `outputSchema`, `readOnlyHint: true` and `openWorldHint: false`

#### Scenario: A search finds the passage

- **WHEN** the store holds the sample corpus, no chat provider is configured, and `cited_search` asks for the price of
  a bicycle tune-up
- **THEN** the result is not an error, at least one passage names `cafe-la-horquilla.md`, and its `excerpt` states that
  price

#### Scenario: A search with no chat provider

- **WHEN** `cited_search` runs in an installation with no chat provider at all
- **THEN** it answers the passages it found and no model call is made

#### Scenario: The answer of the pipeline

- **WHEN** `cited_ask` asks a question the sample corpus answers
- **THEN** the structured content carries `status` `answered`, an answer with a `[n]` marker and the citation of the
  document it came from

#### Scenario: The honest refusal

- **WHEN** `cited_ask` asks something no document of the store mentions
- **THEN** the structured content carries `status` `refused`, an empty list of citations and the message of the
  refusal, and the result is not an error

### Requirement: The limits of the token bound the calls

The endpoint SHALL count every `tools/call` of one token in the current hour and SHALL refuse the calls over
`MCP_RATE_LIMIT_PER_HOUR` (default 120) with a tool result whose `isError` is `true` and whose text is a public
sentence that names no variable of the environment. A `query` or a `question` longer than `MAX_QUESTION_CHARS` SHALL be
a tool result with `isError` `true`. The daily cap of model calls SHALL apply to `cited_ask` as it applies to
`/api/ask`. An argument the schema of the tool does not accept SHALL be answered with the JSON-RPC error `-32602`.

#### Scenario: The hourly limit of a token

- **WHEN** `MCP_RATE_LIMIT_PER_HOUR` is 2 and a third `tools/call` arrives with the same token
- **THEN** the third result carries `isError` `true`, its text names no variable, and a call with another token is
  still served

#### Scenario: A question longer than the maximum

- **WHEN** `cited_search` receives a `query` of `MAX_QUESTION_CHARS + 1` characters
- **THEN** the result carries `isError` `true` and never echoes the query

#### Scenario: The daily cap of the model

- **WHEN** `DAILY_MODEL_CALL_LIMIT` is 1 and a second `cited_ask` arrives the same day
- **THEN** the second result carries `isError` `true` with a public sentence, and the counter of the day is 1

#### Scenario: An argument outside the schema

- **WHEN** `cited_search` receives `limit: 9`, and another call receives no `query` at all
- **THEN** both are answered with the JSON-RPC error `-32602`

### Requirement: Every failure is a JSON-RPC error or a tool error, never a server error

The endpoint SHALL answer `-32700` to a body that is not JSON, `-32600` to a message that is not a JSON-RPC request,
`-32601` to a method the server does not implement, and `-32602` to the parameters of a tool that do not match its
schema. Every text the endpoint sends SHALL pass through `publicMessage()`, so no name of a variable of the
environment and no text of a provider or of its SDK leaves the route, and no failure SHALL be answered with a `500`.

#### Scenario: A body that is not JSON

- **WHEN** a `POST` carries `{`
- **THEN** the response is a JSON-RPC error whose code is `-32700`

#### Scenario: A message that is not a request

- **WHEN** a `POST` carries `{"jsonrpc": "2.0"}` with no `method`
- **THEN** the response is a JSON-RPC error whose code is `-32600`

#### Scenario: A method the server does not implement

- **WHEN** a `POST` carries a request for `resources/list`
- **THEN** the response is a JSON-RPC error whose code is `-32601`

#### Scenario: No provider text and no variable name leaves

- **WHEN** `cited_ask` runs in an installation with no chat provider configured
- **THEN** the result carries `isError` `true` and its text matches no name of a variable of the environment and no
  text of a provider

### Requirement: cited_ask stores what the public route stores

`cited_ask` SHALL store a conversation turn exactly as `POST /api/ask` stores it, with the same table, the same
`sessionId` and the same retention of `CONVERSATION_RETENTION_DAYS`, SHALL keep no other trace of the call, and SHALL
need no migration of the store for marking the channel of the agent.

#### Scenario: A session keeps its thread

- **WHEN** two `cited_ask` calls carry the same `sessionId`
- **THEN** the store holds two turns of that session and the second prompt carries the first question and answer

#### Scenario: The retention still applies

- **WHEN** the store holds a turn older than `CONVERSATION_RETENTION_DAYS` and a `cited_ask` arrives
- **THEN** the old turn is purged as it is purged for `/api/ask`

#### Scenario: No migration of the store

- **WHEN** the tables of an installation that never ran this change are compared with the tables after a `cited_ask`
- **THEN** the schema is the same list of tables and the change adds none

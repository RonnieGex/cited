## MODIFIED Requirements

### Requirement: The endpoint speaks the stateless Streamable HTTP transport

`app/api/mcp/route.ts` SHALL be the single MCP endpoint, SHALL accept `POST` with one JSON-RPC 2.0 message and SHALL
answer `200` with `Content-Type: application/json` and one JSON object, without a Server-Sent Events stream. The
endpoint SHALL assign no session, so every request stands alone. A notification SHALL be answered `202` with no body.
`GET` and `DELETE` SHALL be answered `405`. The server SHALL negotiate the protocol version `2025-06-18` or
`2025-03-26`, answering the requested version when it supports it and the latest version it supports otherwise. The
valid individual `initialize` request defined below SHALL be negotiated by its body whatever `MCP-Protocol-Version` header it carries. Any other
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

#### Scenario: An initialize with a newer version header is negotiated

- **WHEN** a `POST` carries `MCP-Protocol-Version: 2025-11-25` and an `initialize` request whose `protocolVersion` is
  `2025-11-25`
- **THEN** the response is `200` and its `result.protocolVersion` is `2025-06-18`

#### Scenario: An unsupported version header is refused

- **WHEN** a `POST` carries `MCP-Protocol-Version: 2024-11-05` and a `tools/list` request
- **THEN** the response is `400` and no tool runs

#### Scenario: The methods without a body

- **WHEN** the endpoint receives a `GET` and a `DELETE`
- **THEN** both are answered `405` and neither is answered with an event stream

## ADDED Requirements

### Requirement: Only valid individual initialization bypasses the version header

The exception SHALL require a non-null, non-array object with `jsonrpc === "2.0"`, `method === "initialize"`,
an own `id` that is a string or a finite integer, and non-null, non-array `params` with a non-empty string
`protocolVersion`. All other messages with unsupported headers SHALL receive HTTP 400 without executing tools.

#### Scenario: Valid IDs and body negotiation

- **WHEN** valid initialize requests with string and finite integer IDs propose `2025-03-26` with unsupported headers
- **THEN** they receive HTTP 200 with `protocolVersion: 2025-03-26` and the original IDs

#### Scenario: Invalid envelopes never inherit the exception

- **WHEN** an unsupported header accompanies an initialize notification, an envelope without jsonrpc, an object ID,
  absent params, array params, an empty protocolVersion, a fractional ID, a null ID or an array of messages
- **THEN** the response is HTTP 400 and no tool executes

#### Scenario: Subsequent messages enforce the header

- **WHEN** tools/list, tools/call or notifications/initialized carries an unsupported version header
- **THEN** the response is HTTP 400 and no tool executes

### Requirement: Every POST body has a byte limit and total read deadline

After the disabled endpoint (404), origin (403) and bearer (401) guards, in that order, every POST body SHALL be read
with a maximum of 1,048,576 bytes (1 MiB) and a total deadline of 10,000 milliseconds. Content-Length above that limit
SHALL return HTTP 413 without acquiring a reader. Actual bytes SHALL be counted even if that header is absent or
understates the body. Overflow SHALL cancel the reader and return HTTP 413; timeout SHALL cancel it and return HTTP
408. The timer SHALL be cleared and the reader lock released on every exit, including malformed JSON and read errors.
Cancellation SHALL NOT delay the response if the underlying source does not settle its cancellation promise.
The bounded bytes SHALL be decoded as UTF-8 and parsed before the version-header rule. Rejected bodies SHALL NOT
execute tools.

#### Scenario: Guards never read

- **WHEN** a POST fails the disabled, origin or bearer guard, including with an oversized Content-Length
- **THEN** it receives respectively 404, 403 or 401 without acquiring a reader

#### Scenario: Declared oversized body

- **WHEN** an authorized POST declares Content-Length 1048577
- **THEN** it receives HTTP 413 without reading

#### Scenario: Actual streamed byte boundary

- **WHEN** authorized bodies contain 1048576 and 1048577 bytes, with absent or understated Content-Length and absent,
  supported and unsupported protocol headers
- **THEN** the exact-limit valid initialize is processed and overflow returns HTTP 413 with reader cancellation

#### Scenario: Stalled and trickling streams reach the total deadline

- **WHEN** a body has not ended 10000 milliseconds after reading began, even if chunks arrive
- **THEN** it receives HTTP 408 with its reader cancelled and unlocked, and no tool executes

#### Scenario: Cleanup on every path

- **WHEN** a body succeeds, is malformed, fails to read, exceeds the size limit or reaches the deadline
- **THEN** the timer is cleared and any acquired reader lock is released

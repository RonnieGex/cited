## MODIFIED Requirements

### Requirement: The endpoint speaks the stateless Streamable HTTP transport

`app/api/mcp/route.ts` SHALL be the single MCP endpoint, SHALL accept `POST` with one JSON-RPC 2.0 message and SHALL
answer `200` with `Content-Type: application/json` and one JSON object, without a Server-Sent Events stream. The
endpoint SHALL assign no session, so every request stands alone. A notification SHALL be answered `202` with no body.
`GET` and `DELETE` SHALL be answered `405`. The server SHALL negotiate the protocol version `2025-06-18` or
`2025-03-26`, answering the requested version when it supports it and the latest version it supports otherwise. The
`initialize` request SHALL be negotiated by its body whatever `MCP-Protocol-Version` header it carries. Any other
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

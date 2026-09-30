# provider-settings Specification

## Purpose
How the owner of a business connects the AI providers of Cited from the panel, without touching the environment of
the server: the chat and embeddings provider, a key stored encrypted, a test that never lets a key or a private address
through, and answers in the owner's words that never name a variable outside the page "For the installer".

## Requirements
### Requirement: The owner connects a provider in the panel

The panel SHALL let the owner choose a chat provider and an embeddings provider (or keyword search), paste a key, test
it and save it, without any environment variable; a key SHALL be saved only after a successful test, SHALL be stored
encrypted with AES-256-GCM under `ENCRYPTION_KEY`, and SHALL never be sent back to the browser, which sees only the
provider, the model, the last four characters and the last test.

#### Scenario: A good key

- **WHEN** the owner tests and saves a key that the provider double accepts
- **THEN** the page shows the provider, the model, `••••` with the last four characters and the latency, and the store
  holds a value that starts with `v1:` and does not contain the key

#### Scenario: A rejected key

- **WHEN** the provider double answers `401` to the test
- **THEN** the page says in words that the provider rejected the key, nothing is saved, and the response carries no
  text of the provider's error

#### Scenario: No encryption key

- **WHEN** `ENCRYPTION_KEY` is empty and the owner tries to save a key
- **THEN** nothing is saved and the page says that the server needs an encryption key, without naming any value

#### Scenario: The key never comes back

- **WHEN** every page and every `/api/admin/*` response is read after a key is saved
- **THEN** none contains the key or its ciphertext

### Requirement: The server wins over the panel

For each kind, a provider configured by the server environment SHALL be used before the one saved in the panel, and
the panel SHALL show it as set by the server with no edit control; the answer pipeline and the ingestion SHALL read the
provider only through the resolver.

#### Scenario: Both are set

- **WHEN** the server sets a chat provider and the panel holds another
- **THEN** answers use the server's, and the page shows "Set by the server" for answers

### Requirement: Honest provider catalogue with disclosed links

Each provider in the panel SHALL show its cost and speed in one line, where it processes data, whether it offers
meaning search, and a link to get a key; an affiliate link SHALL be used only when the catalogue carries one and
`AFFILIATE_LINKS` is not `off`, and SHALL show "(paid link)" or "(enlace pagado)" next to it; no provider logo and no
"partner" or "recommended" wording SHALL appear; `HOSTED_OFFER_URL` SHALL show the hosted offer under the list.

#### Scenario: Affiliate links turned off

- **WHEN** the catalogue carries an affiliate URL for a provider and `AFFILIATE_LINKS=off`
- **THEN** the page links the plain signup URL and shows no paid-link label

#### Scenario: A disclosed link

- **WHEN** the catalogue carries an affiliate URL and `AFFILIATE_LINKS` is empty
- **THEN** the link uses it and "(paid link)" is visible next to it before any click, in the interface language

### Requirement: Testing a provider is bounded

The test, save and remove routes SHALL require the admin session and the same-origin check, SHALL allow at most 20
tests per hour, SHALL time out after 10 seconds, and SHALL answer one of `rejected_key`, `no_credit`, `rate_limited`,
`model_not_found`, `unreachable` or `timeout` when the test fails.

#### Scenario: Without the session

- **WHEN** `/api/admin/providers/test` is called without the admin session
- **THEN** it answers `401` and makes no call to any provider

### Requirement: No provider error reaches the browser

No route SHALL return, log or render the text of an error raised by a provider or its SDK; each failure SHALL map to one
of the categories of the test route (or to a generic "the AI could not answer" on the public routes), and any text
shaped like a key SHALL be removed before a message leaves the server process.

#### Scenario: A provider that echoes the key

- **WHEN** the chat double answers `401` with a message that contains the saved key, during a public question and during
  a test
- **THEN** neither `/api/ask` nor the test route returns any part of the key or of the provider's message

### Requirement: A provider address cannot reach private networks

A base URL SHALL be accepted only for the providers that need one (Ollama, LM Studio and a custom OpenAI-compatible
endpoint); it SHALL use `https`, except `http` to a local host when the server sets `ALLOW_LOCAL_PROVIDERS=1`; the
resolved address SHALL NOT be loopback, link-local, private, carrier-grade NAT or the metadata address unless
`ALLOW_LOCAL_PROVIDERS=1`; redirects SHALL NOT be followed; the cloud providers SHALL use their fixed official hosts.

#### Scenario: An address inside the server

- **WHEN** the owner tests Ollama with `http://127.0.0.1:11434`, `http://169.254.169.254` or `http://10.0.0.5` and the
  server does not set `ALLOW_LOCAL_PROVIDERS`
- **THEN** the test answers that the address is not allowed and no connection is opened

### Requirement: The test limit holds under concurrency

The limit of 20 provider tests per hour SHALL be reserved atomically before each call, so concurrent tests never
exceed it.

#### Scenario: Forty tests at once

- **WHEN** forty tests arrive at the same time
- **THEN** exactly twenty reach the provider double and the others answer `429`

### Requirement: The address that was validated is the address that is connected to

The server SHALL connect only to the address it classified: for every request to an address the owner supplied (the
test, and every chat or embeddings call that uses it) the host SHALL be resolved once, every resolved address SHALL be
classified, and the connection SHALL be opened to the address that was classified and never to a second resolution of
the name; addresses SHALL be classified in every notation, including IPv4 mapped into IPv6 in dotted or hexadecimal
form, unique local, link-local, NAT64 and 6to4 addresses that embed a private IPv4.

#### Scenario: A name that changes its answer

- **WHEN** the resolver double answers a public address the first time and `127.0.0.1` the second time for the same name
- **THEN** the connection goes to the first address, or nothing connects, and the local double never receives the request

#### Scenario: A mapped address

- **WHEN** the base URL is `http://[::ffff:7f00:1]:11434`, `http://[::ffff:127.0.0.1]:11434` or a name that resolves to
  one of them
- **THEN** the test answers that the address is not allowed and no connection is opened

### Requirement: The owner never reads a variable name in an answer of the panel

The routes of the panel SHALL answer failures with a reason code and no text that names a variable of the environment;
the page SHALL map each code to a sentence in the owner's words, and for a setting that only the installer can change it
SHALL point to the page "For the installer", the only place where the variable may be named.

#### Scenario: Local providers turned off

- **WHEN** the owner tests Ollama at `127.0.0.1` and the server does not allow local providers
- **THEN** the response carries the code `address_not_allowed` and no variable name, and the page says in words that the
  installer must allow local providers and links "For the installer"

#### Scenario: An installation that is not finished

- **WHEN** `ADMIN_SESSION_SECRET` is missing, or `ADMIN_PASSWORD` has fewer than 16 characters, and any route of
  `/api/admin/*` or any page of `/admin` is requested
- **THEN** the route answers `503` with the code `panel_not_configured` or `admin_password_too_short` and no variable
  name, the page says in the owner's words that the person who installs Cited has to finish the installation, and the
  names of the missing variables reach only the server log and the page "For the installer"


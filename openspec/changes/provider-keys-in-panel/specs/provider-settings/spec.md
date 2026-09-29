## ADDED Requirements

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

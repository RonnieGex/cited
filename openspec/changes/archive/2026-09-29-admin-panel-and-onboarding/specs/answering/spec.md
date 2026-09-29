## MODIFIED Requirements

### Requirement: The owner's spend is bounded

The route SHALL refuse a question longer than `MAX_QUESTION_CHARS` (default 1000) with `400`; SHALL allow at most
`RATE_LIMIT_PER_IP_PER_HOUR` (default 30) questions per IP per hour, answering `429` with `Retry-After`; SHALL make at
most `DAILY_MODEL_CALL_LIMIT` (default 500) model calls per UTC day, answering `503` with a daily-limit message after
it, reserving each call atomically before it is made so that concurrent questions never exceed the limit; and SHALL
pass `MAX_ANSWER_TOKENS` (default 600) to the model. The IP SHALL be stored only as a salted hash. `TRUST_PROXY` SHALL be
the number of trusted proxies in front of the application (`1` for Traefik alone, `2` for a CDN in front of Traefik);
with it the IP SHALL be the address that many places from the right of `X-Forwarded-For`, the one the outermost
trusted proxy received the request from; without it the forwarding headers SHALL be ignored.

#### Scenario: The limits hold

- **WHEN** the tests send a question of 1001 characters, 31 questions from one IP in an hour, and one question after
  the daily limit is reached
- **THEN** they receive `400`, `429` with `Retry-After`, and `503` respectively, and no model call is made in any of the
  three

#### Scenario: Concurrent questions at the daily limit

- **WHEN** eight questions arrive at once with `DAILY_MODEL_CALL_LIMIT=1` and the counter at 0
- **THEN** exactly one model call is made, the other seven answer `503`, and the counter of the day is 1

#### Scenario: A forged forwarding header

- **WHEN** `TRUST_PROXY=1` and one client sends two questions whose `X-Forwarded-For` differ only in the addresses the
  client wrote before the one its proxy appended, with `RATE_LIMIT_PER_IP_PER_HOUR=1`
- **THEN** both questions fall in the same bucket and the second answers `429`

#### Scenario: Two trusted proxies

- **WHEN** `TRUST_PROXY=2` and two clients reach the application through the same CDN edge and Traefik
- **THEN** each client falls in its own bucket, and a client that writes its own `X-Forwarded-For` still falls in its
  bucket

#### Scenario: No IP in clear

- **WHEN** the tables of the store are read after the tests
- **THEN** no column carries an IP address in clear

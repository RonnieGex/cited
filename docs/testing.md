# Testing

The two suites of Cited, the command of each one and the fixed set of ports of the browser suite.

## 1. The unit and route suite

```
npm test
```

Vitest runs the files under `tests/`, one for each module or route. A case that needs a store opens a temporary one and
closes it when it ends, so the suite leaves no database behind.

No test reaches a real provider. The deterministic providers (`CHAT_PROVIDER=fake`, `EMBEDDINGS_PROVIDER=fake`) answer
in the place of a model, and `tests/provider-double.ts` is a local HTTP server on an ephemeral port that records every
request and answers a scripted response.

## 2. The browser suite

```
npm run test:e2e
```

Playwright builds the application with `build:e2e` and starts the servers it needs, each one with its own store of
`.data/` and its own encryption key, both disposable and removed at the start of a run. The chat of every case answers
from a local double the specs serve themselves: a key that reaches the suite never reaches a provider.

The suite keeps one worker, because the specs of the keys and the two walks of the guided setup share the port of that
double one at a time.

## 3. The ports of the browser suite

The fixed set is 3100 and 3210 to 3217. No spec opens a port outside it.

| Port | What answers there |
|---|---|
| 3100 | the public server the widget reads |
| 3210, 3212 | the sites of the widget tests that may embed the chat |
| 3211 | the guided setup walked in Spanish |
| 3213 | the panel |
| 3214 | the panel of the keys |
| 3215 | the panel with the affiliate switch on |
| 3216 | the deterministic provider double, served by one spec at a time |
| 3217 | the guided setup walked in English |

`playwright.config.ts` says the same in the comment over the projects, and it is the file to edit when a suite needs a
port: the set is fixed so that a run never collides with the services of a machine (PostgreSQL on 5432, the store of the
CRM on 5433, Postiz on 5434, its Redis on 6380 and Temporal on 7233).

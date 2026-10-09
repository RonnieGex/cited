# Security

Living document. It describes the threat model of Cited and the state of each control. The
hardening change (`security-hardening`) reviews this document; every change that touches one of these areas updates
the row it owns, and no row is written as done before it is verified.

The public endpoint makes anyone able to ask: the threat is not only a stolen secret, it is also a stranger spending
the API balance of the owner.

## What exists today, in this change

| Control | State | Where |
|---|---|---|
| No secret is committed | Enforced by the pipeline | the blocking `secrets` job of `.github/workflows/ci.yml` scans every commit of the history with the gitleaks command line over the rules of `.gitleaks.toml` |
| Environment files never enter the history | Done | `.gitignore` (`.env*` except `.env.example`) |
| No key has a value in the repository | Done | `.env.example` with empty values |
| A key the owner pastes in the panel is encrypted and never returns to the browser | Done | `lib/secrets/` (AES-256-GCM under `ENCRYPTION_KEY`), the table `provider_settings` and the routes of `/api/admin/providers` |
| Dependency vulnerabilities above the high level stop the pipeline | Done | `.github/workflows/ci.yml` calls `npm run audit:high`, the guard of `scripts/audit-high.mjs`: the production tree audits clean and accepts no exception, and the whole tree audits clean except the advisories of `security/audit-exceptions.json`, whose entries carry their evidence and expire within 30 days |
| Static analysis of the code in the pipeline | Done | `.github/workflows/codeql.yml` (JavaScript and TypeScript) runs on every push to `main`, on every pull request and on a weekly schedule while the repository is public; while it is private the analysis job is skipped, not failed, because GitHub accepts code scanning uploads from a private repository only with a paid plan |
| Dependency updates reviewed | Done | `.github/dependabot.yml` |
| No commercially licensed font file | Done | the repository carries no `.woff`, `.woff2`, `.ttf` or `.otf` |
| Threat model written and reviewed | This document | `docs/security.md` |

Everything else in this document is planned, and each row names the change that builds it. Nothing below is claimed
as working today.

The local hook of `.githooks/pre-commit` is a developer aid, not a control: it only exists after
`npm run hooks:install`, it needs gitleaks on the `PATH` and it can be skipped with `git commit --no-verify`. The
enforced scan is the pipeline, which scans the full history on every push and every pull request and blocks the job
when it finds a secret. A fork that never installs the hook is still covered by its own pipeline.

## 1. The public endpoint

Anyone can ask a question, so the endpoint is treated as hostile input.

- The maximum length of a question is 1000 characters. **Planned** in `pluggable-models-and-ask`.
- The answer text is returned as sanitized markdown and never as raw HTML, so a document cannot inject a script into
  the public questions. **Planned** in `pluggable-models-and-ask` and `public-page-and-widget`.
- The system instruction is written against instruction injection: the retrieved documents are data, not orders, and
  the model is told so. **Planned** in `pluggable-models-and-ask`.
- An answer that the documents do not support is refused instead of invented. **Planned** in
  `pluggable-models-and-ask`.

## 2. The administration panel

- `ADMIN_PASSWORD` is required and has at least sixteen characters: without it, or with a shorter one, the panel does
  not start, and the app says so instead of serving an open or a weak panel. **Done** in `admin-panel-and-onboarding`.
- The session lives in a cookie that is `httpOnly`, `sameSite=strict` and `secure` outside `localhost`, signed with
  `ADMIN_SESSION_SECRET`, and the password is compared in constant time. **Done** in `admin-panel-and-onboarding`;
  since `codeql-findings` the comparison is a slow derivation: `passwordMatches` derives both the given password and
  `ADMIN_PASSWORD` with `scrypt` (N=16384, r=8, p=1) under one salt of 16 random bytes drawn when the process starts,
  and compares the two derivations with a constant-time comparison, so no fast hash of the SHA-2 family touches a
  password. The salt of the process is never stored, `lib/admin/session.ts` still uses `createHash` only for the
  signature of the session cookie, and the derivation of about 100 ms stays under the one second every failed attempt
  already waits.
- Access attempts are limited by address: five failures from one known address within fifteen minutes lock that
  address for fifteen minutes, with `Retry-After`. The address is known only when `TRUST_PROXY` declares how many
  proxies sit in front and the forwarding chain carries the address that many places from the right; without a known
  address no attempt locks anybody and every failed attempt takes at least one second. **Done** in
  `admin-panel-and-onboarding`.
- Every data fetch of the panel is behind the same session, every mutation also checks the origin of the request, and
  nothing is hidden only in the interface. **Done** in `admin-panel-and-onboarding`.
- The keys of the providers are pasted in the panel, tested before they are saved and stored encrypted with
  AES-256-GCM under `ENCRYPTION_KEY`; the browser sees the provider, the model, the last four characters and the last
  test, and never the key nor its ciphertext; a value the server sets wins and is read only. The test, the save and the
  removal require the session and the origin, the calls to a provider are bounded by ten seconds and both routes share
  a limit of twenty tests per hour. **Done** in `provider-keys-in-panel`.

## 3. The balance of the owner

The API key belongs to the person who forks the project, so an abuse spends their money.

- A limit of questions per IP address. **Done** in `pluggable-models-and-ask`.
- A configurable daily cap of model calls and of voice minutes. **Done** in `pluggable-models-and-ask` for the model
  calls and in `elevenlabs-voice-agent` for the voice minutes: a session reserves five minutes of the UTC day before
  the signed URL is asked for, and the day answers `429` when the cap of `DAILY_VOICE_MINUTE_LIMIT` is reached.
- A cap of tokens per answer. **Done** in `pluggable-models-and-ask`.
- The panel tests a key before saving it and never shows it again, only its last four characters. **Done** in
  `provider-keys-in-panel`; the panel of `admin-panel-and-onboarding` shows whether a key of the environment is set
  and never its value.

## 4. The widget and the voice agent

- An allowlist of domains for the widget, applied both in CORS and in the voice provider. **Done** in
  `public-page-and-widget` for `frame-ancestors`, and in `elevenlabs-voice-agent` for the agent: the allowlist of
  `platform_settings.auth` carries the hostname of the installation and the ones of `ALLOWED_ORIGINS`, and nothing
  else, so no other site can start a conversation with the agent.
- The voice key never reaches the browser: the browser asks the server for a signed URL that expires in 15 minutes.
  **Done** in `elevenlabs-voice-agent`: `GET /api/voice/signed-url` is the only reader of `ELEVENLABS_API_KEY` and it
  answers the URL alone.
- The tool the voice agent calls requires a secret of its own installation, sent as a Bearer token. **Done** in
  `elevenlabs-voice-agent`: `POST /api/voice/tool` compares `VOICE_TOOL_SECRET` in constant time and refuses every call
  of an installation that declares none.
- The microphone of the public site and of the widget needs `connect-src` for the two endpoints of ElevenLabs, and
  `worker-src` with `blob:` for the audio worklet the SDK loads when no path is given. **Done** in
  `elevenlabs-voice-agent`, and `tests/csp.test.ts` pins the three directives whole. `script-src` keeps its nonce with
  `strict-dynamic`.

## 5. Uploaded content

- A document is validated by its real type, its size (20 MB maximum) and its page count before it is read.
  **Planned** in `core-libsql-hybrid-search`. Since `codeql-findings` the size of a file of the disk is read from the
  open file whose bytes are read: `parseFile` opens the path once, reads the size with the `stat` of that open file,
  refuses a file above the limit before reading any byte and reads the bytes from the same open file, so a file cannot
  be swapped between the check of the limit and the read.
- Nothing that is uploaded is executed, and its text is never interpreted as code or as an instruction to the model.
  **Planned** in `core-libsql-hybrid-search`.
- The RRF hybrid search reads parameters, never concatenated SQL. **Planned** in `core-libsql-hybrid-search`.

## 6. Headers and transport

- `poweredByHeader` is off, so the framework version is not advertised. **Done** in this change.
- A strict content security policy and `X-Frame-Options` outside the widget. **Planned** in `security-hardening`.
- HTTPS in the one-click deployments. **Planned** in `docs-deploy-and-launch`.

## 7. Privacy

- Conversations are stored only in the installation, with a configurable retention of days and a button that deletes
  them. **Done** in `pluggable-models-and-ask` for the retention and in `admin-panel-and-onboarding` for the button.
- Zero telemetry to Katalis. No counter, no beacon and no call home. **Planned** in `security-hardening`, which
  verifies it by inspecting the network calls of a running installation.
- The keys of the owner are the only credentials: they live in the environment of the server, or encrypted with
  AES-256-GCM in the store of the installation when the owner pasted them in the panel, and the raw answer of a
  provider never reaches the browser. **Done** in `provider-keys-in-panel`.

## 8. Supply chain

- Continuous integration with types, lint, unit tests, build, `npm run audit:high`, gitleaks over the whole
  history and the strict OpenSpec validation, all of them blocking. **Done** in this change.
- A high advisory with no published fix is recorded in `security/audit-exceptions.json` with its reason and the
  evidence that no fixed version exists, and it expires 30 days later at most: an expired entry stops the pipeline. The
  list carries one entry today, `GHSA-vfj7-8cjw-p6xm` of `braces`, which reaches the tree only through the development
  chain of `eslint-config-next` and expires on 2026-11-08. A package of the production tree is never excepted: the
  production audit has no exception at all. **Done** in this change; `SECURITY.md` says how an entry is added or
  renewed.
- CodeQL for JavaScript and TypeScript, on push, on pull request and on a weekly schedule. **Done** in this change.
- Dependabot for npm and for GitHub Actions. **Done** in this change.
- A published Docker image built from the pipeline, pinned by digest and never by `latest`. **Planned** in
  `docs-deploy-and-launch`.
- `SECURITY.md` with the reporting channel: the private vulnerability reporting of GitHub. The role address
  `security@katalis.dev` is added when the mailbox exists, and a personal address is never used. **Done** in this
  change.

## 9. What is out of the model

Two things are deliberately not defended against, and the documentation says so instead of pretending:

- A person who forks the project and publishes their own keys, their own database or their own conversations. What
  each installation does with its data is out of reach of this repository.
- A denial of service with enough traffic to exhaust the platform of the owner. The limits protect the balance, not
  the availability of the host.

## Reporting

See `SECURITY.md`. A vulnerability in this repository is reported privately, never in a public issue.

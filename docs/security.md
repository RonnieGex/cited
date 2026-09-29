# Security

Living document. It describes the threat model of Katalis Responde Community and the state of each control. The
hardening change (`security-hardening`) reviews this document; every change that touches one of these areas updates
the row it owns, and no row is written as done before it is verified.

The public endpoint makes anyone able to ask: the threat is not only a stolen secret, it is also a stranger spending
the API balance of the owner.

## What exists today, in this change

| Control | State | Where |
|---|---|---|
| No secret can be committed by accident | Done | `.githooks/pre-commit`, `.gitleaks.toml`, `docs/development-guide.md` |
| Environment files never enter the history | Done | `.gitignore` (`.env*` except `.env.example`) |
| No key has a value in the repository | Done | `.env.example` with empty values |
| Dependency vulnerabilities above the high level stop the pipeline | Done | `.github/workflows/ci.yml`, `npm run audit:high` |
| Static analysis of the code in the pipeline | Done | `.github/workflows/codeql.yml` (JavaScript and TypeScript) |
| Dependency updates reviewed | Done | `.github/dependabot.yml` |
| No commercially licensed font file | Done | the repository carries no `.woff`, `.woff2`, `.ttf` or `.otf` |
| Threat model written and reviewed | This document | `docs/security.md` |

Everything else in this document is planned, and each row names the change that builds it. Nothing below is claimed
as working today.

## 1. The public endpoint

Anyone can ask a question, so the endpoint is treated as hostile input.

- The maximum length of a question is 1000 characters. **Planned** in `pluggable-models-and-ask`.
- The answer text is returned as sanitized markdown and never as raw HTML, so a document cannot inject a script into
  the page. **Planned** in `pluggable-models-and-ask` and `admin-and-public-ui`.
- The system instruction is written against instruction injection: the retrieved documents are data, not orders, and
  the model is told so. **Planned** in `pluggable-models-and-ask`.
- An answer that the documents do not support is refused instead of invented. **Planned** in
  `pluggable-models-and-ask`.

## 2. The administration panel

- `ADMIN_PASSWORD` is required: without it the panel does not start, and the app says so at startup instead of
  serving an open panel. **Planned** in `admin-and-public-ui`.
- The session lives in a cookie that is `httpOnly`, `secure` and `sameSite`. **Planned** in `admin-and-public-ui`.
- Access attempts are limited, so the password cannot be guessed at full speed. **Planned** in
  `admin-and-public-ui`.
- Every data fetch of the panel is behind the same session; nothing is hidden only in the interface. **Planned** in
  `admin-and-public-ui`.

## 3. The balance of the owner

The API key belongs to the person who forks the project, so an abuse spends their money.

- A limit of questions per IP address. **Planned** in `pluggable-models-and-ask`.
- A configurable daily cap of model calls and of voice minutes. **Planned** in `pluggable-models-and-ask`.
- A cap of tokens per answer. **Planned** in `pluggable-models-and-ask`.
- The panel shows whether each key is present and offers a test button; the key is never shown again and never stored
  in the database. **Planned** in `admin-and-public-ui`.

## 4. The widget and the voice agent

- An allowlist of domains for the widget, applied both in CORS and in the voice provider. **Planned** in
  `admin-and-public-ui` and `elevenlabs-voice-agent`.
- The voice key never reaches the browser: the browser asks the server for a signed URL that expires in 15 minutes.
  **Planned** in `elevenlabs-voice-agent`.
- The tool the voice agent calls requires a secret of its own installation, sent as a Bearer token. **Planned** in
  `elevenlabs-voice-agent`.

## 5. Uploaded content

- A document is validated by its real type, its size (20 MB maximum) and its page count before it is read.
  **Planned** in `core-libsql-hybrid-search`.
- Nothing that is uploaded is executed, and its text is never interpreted as code or as an instruction to the model.
  **Planned** in `core-libsql-hybrid-search`.
- The RRF hybrid search reads parameters, never concatenated SQL. **Planned** in `core-libsql-hybrid-search`.

## 6. Headers and transport

- `poweredByHeader` is off, so the framework version is not advertised. **Done** in this change.
- A strict content security policy and `X-Frame-Options` outside the widget. **Planned** in `security-hardening`.
- HTTPS in the one-click deployments. **Planned** in `docs-deploy-and-launch`.

## 7. Privacy

- Conversations are stored only in the installation, with a configurable retention of days and a button that deletes
  them. **Planned** in `core-libsql-hybrid-search` and `admin-and-public-ui`.
- Zero telemetry to Katalis. No counter, no beacon and no call home. **Planned** in `security-hardening`, which
  verifies it by inspecting the network calls of a running installation.
- The keys of the owner are the only credentials, and they live in the environment of the server. **Planned** in
  `pluggable-models-and-ask`.

## 8. Supply chain

- Continuous integration with types, lint, unit tests, build, `npm audit --audit-level=high`, gitleaks over the whole
  history and the strict OpenSpec validation, all of them blocking. **Done** in this change.
- CodeQL for JavaScript and TypeScript, on push, on pull request and on a weekly schedule. **Done** in this change.
- Dependabot for npm and for GitHub Actions. **Done** in this change.
- A published Docker image built from the pipeline, pinned by digest and never by `latest`. **Planned** in
  `docs-deploy-and-launch`.
- `SECURITY.md` with the reporting address. **Done** in this change.

## 9. What is out of the model

Two things are deliberately not defended against, and the documentation says so instead of pretending:

- A person who forks the project and publishes their own keys, their own database or their own conversations. What
  each installation does with its data is out of reach of this repository.
- A denial of service with enough traffic to exhaust the platform of the owner. The limits protect the balance, not
  the availability of the host.

## Reporting

See `SECURITY.md`. A vulnerability in this repository is reported privately, never in a public issue.

<h1 align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/readme-banner-dark.png">
    <img src="docs/images/readme-banner-light.png" alt="Cited, by Katalis: ask your own documents and get the passage and where it came from" width="1280">
  </picture>
</h1>

<p align="center">Ask your own documents. Get the passage and where it came from.</p>

[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)
[![Node 24.15 or newer](https://img.shields.io/badge/node-%3E%3D24.15-3c873a)](package.json)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black)](package.json)
[![TypeScript in strict mode](https://img.shields.io/badge/TypeScript-strict-3178c6)](https://www.typescriptlang.org/)
[![libSQL as the store](https://img.shields.io/badge/store-libSQL-4b8bbe)](https://github.com/tursodatabase/libsql)
![Status: early development](https://img.shields.io/badge/status-early%20development-orange)
[![Continuous integration](https://github.com/RonnieGex/cited/actions/workflows/ci.yml/badge.svg)](https://github.com/RonnieGex/cited/actions/workflows/ci.yml)

[English](README.md) · [Español](README.es.md)

**Cited is in early development and not ready for production.** What you can run today is the core: it turns a
folder of documents into citable passages and finds them again with a hybrid search. Read the [status table](#status)
before you promise anything to anyone.

## Why Cited

| <picture><source media="(prefers-color-scheme: dark)" srcset="docs/images/reason-sources-dark.png"><img src="docs/images/reason-sources-light.png" alt="Cited reads only the documents you point it at" width="400"></picture> | <picture><source media="(prefers-color-scheme: dark)" srcset="docs/images/reason-citations-dark.png"><img src="docs/images/reason-citations-light.png" alt="Every passage of Cited carries its document, its heading and its position" width="400"></picture> | <picture><source media="(prefers-color-scheme: dark)" srcset="docs/images/reason-voice-dark.png"><img src="docs/images/reason-voice-light.png" alt="Voice with ElevenLabs, planned for the next change" width="400"></picture> |
|---|---|---|

1. **Only your documents.** Ingestion reads the files you point it at, and nothing else: no web, no model memory,
   nothing invented.
2. **Every passage keeps its source.** Document, heading and position travel with the text, so a reader can open the
   document and land on the passage instead of trusting a summary.
3. **Talk to it.** Retrieval and search return passages in text today; talking to the same documents with ElevenLabs
   arrives in a later change, and the card that shows it says `Next` for that reason.

## Status

Every row is either available today or planned, and each planned row names the change that delivers it.

| Capability | State | Spec or change |
|---|---|---|
| Ingestion of PDF, DOCX, Markdown and text with limits | Available | [knowledge-search](openspec/specs/knowledge-search/spec.md) |
| Hybrid search: full text and vectors, fused with Reciprocal Rank Fusion | Available | [knowledge-search](openspec/specs/knowledge-search/spec.md) |
| Embeddings through an OpenAI-compatible API or Ollama | Available | [knowledge-search](openspec/specs/knowledge-search/spec.md) |
| Local libSQL file or Turso | Available | [knowledge-search](openspec/specs/knowledge-search/spec.md) |
| Answers with citations from any model provider, spend limits | Planned | `pluggable-models-and-ask` |
| Admin panel, public page and widget in Spanish and English | Planned | `admin-and-public-ui` |
| Voice agent with ElevenLabs, created in one click | Planned | `elevenlabs-voice-agent` |
| Shared design system | Planned | `design-system-shared` |
| Security hardening and abuse tests | Planned | `security-hardening` |
| Deployed in one click, with a Docker image and bilingual docs | Planned | `docs-deploy-and-launch` |

## How it works

**From a folder of documents to a cited passage.**

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/images/how-it-works-dark.png"><img src="docs/images/how-it-works-light.png" alt="How Cited works: documents, passages, libSQL and Reciprocal Rank Fusion, with the answer marked Next" width="1280"></picture>

<details>
<summary>The same flow as a text diagram</summary>

```mermaid
flowchart LR
  A[Ingest: PDF, DOCX, MD, TXT] --> B[Passages with their heading]
  B --> C[libSQL: FTS5 and native vectors]
  C --> D[Reciprocal Rank Fusion]
  D --> E[Answer with numbered citations (next)]
  D --> F[Web widget (next)]
  D --> G[Voice agent (next)]
```

</details>

## See it work

**Ask a question. Get the passage and where it came from.**

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/images/demo-dark.png"><img src="docs/images/demo-light.png" alt="A real run of the quick start of Cited: ingestion and one search" width="1280"></picture>

The image is drawn by `scripts/render-readme-graphics.mjs` from the output of the commands in the quick start, so it
cannot show a result the code does not produce.

## Roadmap

**What runs today, and what comes next.**

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/images/roadmap-dark.png"><img src="docs/images/roadmap-light.png" alt="The roadmap of Cited: what is available today and what each next change adds" width="1280"></picture>

The changes of the plan arrive in this order: the shared design system, then drafting an answer and numbering its
citations, then the panel and the public page, then the voice with ElevenLabs, then the hardening, then the deploys
and the docs.

## Voice

**Talk to your documents.**

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/images/voice-teaser-dark.png"><img src="docs/images/voice-teaser-light.png" alt="Voice agent of Cited, planned for the ElevenLabs change" width="1280"></picture>

`elevenlabs-voice-agent` is planned, not built: it is marked `Next` in every graphic that shows it.

## Quick start

One command ingests the sample corpus and one command searches it. No key is needed: the deterministic provider runs
offline.

```
git clone https://github.com/RonnieGex/cited.git
cd cited
npm ci
cp .env.example .env
EMBEDDINGS_PROVIDER=fake npm run ingest -- samples/
EMBEDDINGS_PROVIDER=fake npm run search -- "¿Cuánto cuesta una afinación de bicicleta?"
npm run dev
```

The template of the environment has every value empty on purpose, so the two commands of the corpus carry the
deterministic provider in front: `fake` runs offline and needs no key. To keep it for the whole session, write
`EMBEDDINGS_PROVIDER=fake` in `.env` once and drop it from the commands. The last command serves the app on
`http://localhost:3000`.

The output of the two commands, on the sample corpus:

```
$ EMBEDDINGS_PROVIDER=fake npm run ingest -- samples/
ingested README.txt (txt, no pages, 1 passages)
ingested bike-workshop-policies.md (md, no pages, 5 passages)
ingested cafe-la-horquilla.md (md, no pages, 4 passages)
ingested notas-del-negocio.txt (txt, no pages, 1 passages)
documents 4, passages 11, skipped 0, store .data/katalis.sqlite, 25 ms, rss 114 MB
```

```
$ EMBEDDINGS_PROVIDER=fake npm run search -- "¿Cuánto cuesta una afinación de bicicleta?"
question: ¿Cuánto cuesta una afinación de bicicleta?
store: .data/katalis.sqlite
1. cafe-la-horquilla.md [Precios] position 2 score 0.032522
   Precios - Espresso: 35 pesos. - Café de olla: 45 pesos. - Pan dulce del día: 30 pesos. - Afinación de bicicleta: 380 pesos. - Cambio de cámara: 120 pesos.
2. cafe-la-horquilla.md [Políticas] position 3 score 0.032522
   Políticas Aceptamos efectivo y tarjeta. El taller recibe bicicletas hasta una hora antes del cierre. Si una reparación necesita refacciones, avisamos por teléfono antes de empezar.
3. notas-del-negocio.txt [no heading] position 0 score 0.031746
   Café La Horquilla — notas del negocio Dirección: avenida central, frente al parque. Sin estacionamiento propio, pero hay uno público a media cuadra. Formas de pago: efectivo, tarjeta de débito y crédito. No aceptamos cheques ni transferenci
4. cafe-la-horquilla.md [Café La Horquilla] position 0 score 0.030331
   Café La Horquilla Somos un café y taller de bicicletas en el centro de la ciudad. Abrimos de martes a domingo.
5. bike-workshop-policies.md [Guarantee] position 4 score 0.015625
   Guarantee Every repair carries a 90 day guarantee on the work. Parts carry the guarantee of their maker. Bring the ticket; without it we can still look up the repair by the frame number.
6. bike-workshop-policies.md [Bookings and cancellations] position 1 score 0.015385
   Bookings and cancellations A repair booking is free. Cancel or move your appointment at least 24 hours before the agreed time and there is no charge. A late cancellation costs 50 pesos, and a dropped appointment costs the full estimate.
7. bike-workshop-policies.md [Groups and events] position 3 score 0.015152
   Groups and events We host a Saturday ride that leaves the shop at 9:30. Groups of more than 8 people should write to us a week ahead so we can arrange a mechanic and a second guide.
8. bike-workshop-policies.md [Bike workshop policies at Café La Horquilla] position 0 score 0.014925
   Bike workshop policies at Café La Horquilla Everything a customer needs to know before leaving a bicycle with us.
8 results, 5 ms, rss 78 MB
```

The store lives in `.data/katalis.sqlite`, which git ignores. `docs/search.md` explains the schema, the chunking and
the ranking.

### Requirements

- Node 24, never older than 24.15 (`.nvmrc`, `engines`)
- npm 11 or newer
- gitleaks for the commit hook, and Playwright Chromium for the browser tests, only if you contribute

## Configuration

The variables the owner sets, what each one is for, and whether the code reads it today.

| Variable | What it is for | Read today |
|---|---|---|
| `EMBEDDINGS_PROVIDER` | the embeddings provider: `openai`, `ollama` or `fake` | yes |
| `EMBEDDINGS_BASE_URL` | base URL of the OpenAI-compatible embeddings API | yes |
| `EMBEDDINGS_MODEL` | name of the embeddings model | yes |
| `EMBEDDINGS_API_KEY` | key of the embeddings provider | yes |
| `EMBEDDINGS_DIMENSIONS` | optional override of the vector size of the provider | yes |
| `OLLAMA_BASE_URL` | base URL of a local Ollama, `http://localhost:11434` by default | yes |
| `DATABASE_URL` | path of the local libSQL file, `.data/katalis.sqlite` by default | yes |
| `TURSO_DATABASE_URL` | URL of a remote libSQL database; it wins over the local file | yes |
| `TURSO_AUTH_TOKEN` | token of the remote database, required when the URL is remote | yes |
| `ADMIN_PASSWORD` | password of the administration panel, reserved | no |
| `ADMIN_SESSION_SECRET` | secret that signs the administration session, reserved | no |
| `VOICE_TOOL_SECRET` | secret the voice tool expects in its Bearer token, reserved | no |
| `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `DEEPSEEK_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `LMSTUDIO_BASE_URL` | credentials of the chat providers, reserved for `pluggable-models-and-ask` | no |
| `CHAT_MODEL`, `EMBEDDING_MODEL`, `EMBEDDING_API_KEY` | model selection of the chat and of the agent, reserved | no |
| `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID` | the voice with ElevenLabs, reserved | no |
| `MAX_QUESTION_CHARS`, `RATE_LIMIT_PER_IP_PER_HOUR`, `DAILY_MODEL_CALL_LIMIT`, `DAILY_VOICE_MINUTE_LIMIT`, `MAX_ANSWER_TOKENS` | spend limits and abuse protection, reserved | no |
| `CONVERSATION_RETENTION_DAYS` | days a conversation is kept, reserved | no |
| `ALLOWED_ORIGINS` | origins allowed to embed the widget, reserved | no |

A row marked `no` is a name the repository already reserves and no code reads yet. No key has a value in this
repository, and `.env` is ignored by git.

## Security

Keys live only in the environment of the server. They never reach the browser and they are never stored in the
database. The threat model is `docs/security.md`; a vulnerability is reported privately, as `SECURITY.md` says, never
in a public issue. The repository has carried no commercially licensed font file since its first commit.

## Contributing

Cited is specified before it is coded: every change is an OpenSpec change with a proposal, its spec deltas, a design
and a task list with its evidence. Read `docs/katalis-sdd-standard.md` and
`docs/openspec-tasks-mandatory-steps.md`, then `CONTRIBUTING.md`.

Before a pull request, run the same checks the pipeline runs:

```
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
npm run audit:high
npm run secrets:scan
npm run openspec:validate
```

## License

Apache-2.0, with a [LICENSE](LICENSE) file and a [NOTICE](NOTICE) file that carries the attribution. A fork keeps the
notice.

<br>

<p align="center">
  <picture><source media="(prefers-color-scheme: dark)" srcset="public/brand/katalis-flame-192.png"><img src="public/brand/katalis-flame-ink-192.png" alt="Katalis" height="48"></picture>
  <a href="https://katalis.dev">Built by Katalis</a>
</p>

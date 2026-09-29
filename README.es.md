<h1 align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/readme-banner-dark.png">
    <img src="docs/images/readme-banner-light.png" alt="Cited, by Katalis: respuestas de tus propios documentos, con la página de donde salieron" width="1280">
  </picture>
</h1>

<p align="center">Respuestas de tus propios documentos, con la página de donde salieron.</p>

[![Licencia: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)
[![Node 24.15 o superior](https://img.shields.io/badge/node-%3E%3D24.15-3c873a)](package.json)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black)](package.json)
[![TypeScript en modo estricto](https://img.shields.io/badge/TypeScript-strict-3178c6)](https://www.typescriptlang.org/)
[![libSQL como almacén](https://img.shields.io/badge/store-libSQL-4b8bbe)](https://github.com/tursodatabase/libsql)
![Estado: desarrollo temprano](https://img.shields.io/badge/status-early%20development-orange)
[![Integración continua](https://github.com/RonnieGex/cited/actions/workflows/ci.yml/badge.svg)](https://github.com/RonnieGex/cited/actions/workflows/ci.yml)

[English](README.md) · [Español](README.es.md)

**Cited está en desarrollo temprano y no sirve todavía para producción.** Lo que puedes correr hoy es el núcleo:
convierte una carpeta de documentos en pasajes citables y los vuelve a encontrar con una búsqueda híbrida. Lee la
[tabla de estado](#status) antes de prometerle algo a alguien.

## Why Cited

| <picture><source media="(prefers-color-scheme: dark)" srcset="docs/images/reason-sources-dark.png"><img src="docs/images/reason-sources-light.png" alt="Cited responde solo con los documentos del negocio" width="400"></picture> | <picture><source media="(prefers-color-scheme: dark)" srcset="docs/images/reason-citations-dark.png"><img src="docs/images/reason-citations-light.png" alt="Cada pasaje de Cited lleva su documento, su encabezado y su posición" width="400"></picture> | <picture><source media="(prefers-color-scheme: dark)" srcset="docs/images/reason-voice-dark.png"><img src="docs/images/reason-voice-light.png" alt="Voz con ElevenLabs, planeada para el siguiente cambio" width="400"></picture> |
|---|---|---|

1. **Responde solo con tus documentos.** La ingesta lee los archivos que le señalas, y nada más: ni web, ni memoria
   del modelo, ni página inventada.
2. **Cada pasaje lleva su fuente.** Documento, encabezado y posición viajan con el texto, así que quien lee puede
   abrir la página de donde salió una respuesta en lugar de confiar en un resumen.
3. **Texto hoy, voz después.** La recuperación y la búsqueda funcionan ahora; platicar con los mismos documentos con
   ElevenLabs llega en un cambio posterior, y por eso la tarjeta que lo muestra dice `Next`.

## Status

Cada fila está disponible hoy o planeada, y cada fila planeada nombra el cambio que la entrega.

| Capacidad | Estado | Especificación o cambio |
|---|---|---|
| Ingesta de PDF, DOCX, Markdown y texto con límites | Available | [knowledge-search](openspec/specs/knowledge-search/spec.md) |
| Búsqueda híbrida: texto completo y vectores, fusionados con Reciprocal Rank Fusion | Available | [knowledge-search](openspec/specs/knowledge-search/spec.md) |
| Embeddings por una API compatible con OpenAI u Ollama | Available | [knowledge-search](openspec/specs/knowledge-search/spec.md) |
| Archivo libSQL local o Turso | Available | [knowledge-search](openspec/specs/knowledge-search/spec.md) |
| Respuestas con citas de cualquier proveedor de modelo, límites de gasto | Planned | `pluggable-models-and-ask` |
| Panel de administración, página pública y widget en español e inglés | Planned | `admin-and-public-ui` |
| Agente de voz con ElevenLabs, creado en un clic | Planned | `elevenlabs-voice-agent` |
| Design system compartido | Planned | `design-system-shared` |
| Endurecimiento de seguridad y pruebas de abuso | Planned | `security-hardening` |
| Despliegue en un clic, con imagen de Docker y documentación bilingüe | Planned | `docs-deploy-and-launch` |

## How it works

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/images/how-it-works-dark.png"><img src="docs/images/how-it-works-light.png" alt="Cómo funciona Cited: documentos, pasajes, libSQL, Reciprocal Rank Fusion y la respuesta" width="1280"></picture>

<details>
<summary>El mismo flujo como diagrama de texto</summary>

```mermaid
flowchart LR
  A[Ingesta: PDF, DOCX, MD, TXT] --> B[Pasajes con su encabezado]
  B --> C[libSQL: FTS5 y vectores nativos]
  C --> D[Reciprocal Rank Fusion]
  D --> E[Respuesta con citas numeradas (next)]
  D --> F[Widget para el sitio (next)]
  D --> G[Agente de voz (next)]
```

</details>

## See it answer

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/images/demo-dark.png"><img src="docs/images/demo-light.png" alt="Una corrida real del arranque rápido de Cited: la ingesta y una búsqueda" width="1280"></picture>

La imagen la dibuja `scripts/render-readme-graphics.mjs` con la salida de los comandos del arranque rápido, así que
no puede mostrar un resultado que el código no produzca.

## Roadmap

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/images/roadmap-dark.png"><img src="docs/images/roadmap-light.png" alt="El roadmap de Cited: lo que puedes correr hoy y lo que agrega cada siguiente cambio" width="1280"></picture>

Los cambios del plan llegan en este orden: el design system compartido, luego redactar una respuesta y numerar sus
citas, luego el panel y la página pública, luego la voz con ElevenLabs, luego el endurecimiento, luego los despliegues
y la documentación.

## Voice

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/images/voice-teaser-dark.png"><img src="docs/images/voice-teaser-light.png" alt="Agente de voz de Cited, planeado para el cambio de ElevenLabs" width="1280"></picture>

`elevenlabs-voice-agent` está planeado, no construido: lleva `Next` en cada gráfica que lo muestra.

## Quick start

Un comando ingiere el corpus de ejemplo y otro lo busca. No hace falta ninguna llave: el proveedor determinista corre
sin conexión.

```
git clone https://github.com/RonnieGex/cited.git
cd cited
npm ci
cp .env.example .env
EMBEDDINGS_PROVIDER=fake npm run ingest -- samples/
EMBEDDINGS_PROVIDER=fake npm run search -- "¿Cuánto cuesta una afinación de bicicleta?"
npm run dev
```

La plantilla del entorno trae todos los valores vacíos a propósito, así que los dos comandos del corpus llevan delante
el proveedor determinista: `fake` corre sin conexión y no necesita llave. Para conservarlo toda la sesión, escribe
`EMBEDDINGS_PROVIDER=fake` en `.env` una vez y quítalo de los comandos. El último comando sirve la página en
`http://localhost:3000`.

La salida de los dos comandos, sobre el corpus de ejemplo:

```
$ EMBEDDINGS_PROVIDER=fake npm run ingest -- samples/
ingested README.txt (txt, no pages, 1 passages)
ingested bike-workshop-policies.md (md, no pages, 5 passages)
ingested cafe-la-horquilla.md (md, no pages, 4 passages)
ingested notas-del-negocio.txt (txt, no pages, 1 passages)
documents 4, passages 11, skipped 0, store .data/katalis.sqlite, 28 ms, rss 113 MB
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
8 results, 6 ms, rss 78 MB
```

El almacén vive en `.data/katalis.sqlite`, que git ignora. `docs/search.md` explica el esquema, el troceado y el
ordenamiento.

### Requisitos

- Node 24, nunca anterior a 24.15 (`.nvmrc`, `engines`)
- npm 11 o superior
- gitleaks para el gancho de commit y Chromium de Playwright para las pruebas de navegador, solo si contribuyes

## Configuration

Las variables que el dueño define, para qué sirve cada una y si el código la lee hoy.

| Variable | Para qué sirve | Se lee hoy |
|---|---|---|
| `EMBEDDINGS_PROVIDER` | el proveedor de embeddings: `openai`, `ollama` o `fake` | yes |
| `EMBEDDINGS_BASE_URL` | URL base de la API de embeddings compatible con OpenAI | yes |
| `EMBEDDINGS_MODEL` | nombre del modelo de embeddings | yes |
| `EMBEDDINGS_API_KEY` | llave del proveedor de embeddings | yes |
| `EMBEDDINGS_DIMENSIONS` | ajuste opcional del tamaño del vector del proveedor | yes |
| `OLLAMA_BASE_URL` | URL base de un Ollama local, `http://localhost:11434` por defecto | yes |
| `DATABASE_URL` | ruta del archivo libSQL local, `.data/katalis.sqlite` por defecto | yes |
| `TURSO_DATABASE_URL` | URL de una base libSQL remota; gana sobre el archivo local | yes |
| `TURSO_AUTH_TOKEN` | token de la base remota, obligatorio cuando la URL es remota | yes |
| `ADMIN_PASSWORD` | contraseña del panel de administración, reservada | no |
| `ADMIN_SESSION_SECRET` | secreto que firma la sesión del panel, reservado | no |
| `VOICE_TOOL_SECRET` | secreto que la herramienta de voz espera en su token Bearer, reservado | no |
| `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `DEEPSEEK_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `LMSTUDIO_BASE_URL` | credenciales de los proveedores de chat, reservadas para el cambio que redacta una respuesta y numera sus citas | no |
| `CHAT_MODEL`, `EMBEDDING_MODEL`, `EMBEDDING_API_KEY` | selección de modelo del chat y del agente, reservada | no |
| `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID` | la voz con ElevenLabs, reservado | no |
| `MAX_QUESTION_CHARS`, `RATE_LIMIT_PER_IP_PER_HOUR`, `DAILY_MODEL_CALL_LIMIT`, `DAILY_VOICE_MINUTE_LIMIT`, `MAX_ANSWER_TOKENS` | límites de gasto y protección contra abuso, reservados | no |
| `CONVERSATION_RETENTION_DAYS` | días que se guarda una conversación, reservado | no |
| `ALLOWED_ORIGINS` | orígenes permitidos para incrustar el widget, reservado | no |

Una fila marcada `no` es un nombre que el repositorio ya reserva y que ningún código lee todavía. Ninguna llave tiene
valor en este repositorio, y git ignora `.env`.

## Security

Las llaves viven solo en el entorno del servidor. Nunca llegan al navegador y nunca se guardan en la base de datos. El
modelo de amenazas es `docs/security.md`; una vulnerabilidad se reporta en privado, como dice `SECURITY.md`, nunca en
un issue público. El repositorio no lleva ningún archivo de fuente con licencia comercial desde su primer commit.

## Contributing

Cited se especifica antes de programarse: cada cambio es un cambio de OpenSpec con su propuesta, sus deltas de
especificación, su diseño y su lista de tareas con evidencia. Lee `docs/katalis-sdd-standard.md` y
`docs/openspec-tasks-mandatory-steps.md`, y luego `CONTRIBUTING.md`.

Antes de un pull request, corre las mismas comprobaciones que corre la pipeline:

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

Apache-2.0, con un archivo [LICENSE](LICENSE) y un archivo [NOTICE](NOTICE) que lleva la atribución. Un fork conserva
el aviso.

<br>

<p align="center">
  <picture><source media="(prefers-color-scheme: dark)" srcset="docs/images/katalis-logo-dark.png"><img src="docs/images/katalis-logo.png" alt="Katalis" height="64"></picture>
</p>

<p align="center"><a href="https://katalis.dev">Built by Katalis</a></p>

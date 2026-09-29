<h1 align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/readme-banner-dark.png">
    <img src="docs/images/readme-banner-light.png" alt="Cited, by Katalis: pregúntale a tus propios documentos y recibe el pasaje y de dónde salió" width="1280">
  </picture>
</h1>

<p align="center">Pregúntale a tus propios documentos. Recibe el pasaje y de dónde salió.</p>

[![Licencia: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)
[![Node 24.15 o superior](https://img.shields.io/badge/node-%3E%3D24.15-3c873a)](package.json)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black)](package.json)
[![TypeScript en modo estricto](https://img.shields.io/badge/TypeScript-strict-3178c6)](https://www.typescriptlang.org/)
[![libSQL como almacén](https://img.shields.io/badge/store-libSQL-4b8bbe)](https://github.com/tursodatabase/libsql)
![Estado: desarrollo temprano](https://img.shields.io/badge/status-early%20development-orange)
[![Integración continua](https://github.com/RonnieGex/cited/actions/workflows/ci.yml/badge.svg)](https://github.com/RonnieGex/cited/actions/workflows/ci.yml)

[English](README.md) · [Español](README.es.md)

**Cited está en desarrollo temprano y no sirve todavía para producción.** Lo que puedes correr hoy es el núcleo:
convierte una carpeta de documentos en pasajes citables, los vuelve a encontrar con una búsqueda híbrida y responde
con los pasajes que encontró, cada afirmación numerada como cita. Lee la [tabla de estado](#estado) antes de
prometerle algo a alguien.

## Por qué Cited

| <picture><source media="(prefers-color-scheme: dark)" srcset="docs/images/reason-sources-dark.png"><img src="docs/images/reason-sources-light.png" alt="Cited lee solo los documentos que le señalas" width="400"></picture> | <picture><source media="(prefers-color-scheme: dark)" srcset="docs/images/reason-citations-dark.png"><img src="docs/images/reason-citations-light.png" alt="Cada pasaje de Cited lleva su documento, su encabezado y su posición" width="400"></picture> | <picture><source media="(prefers-color-scheme: dark)" srcset="docs/images/reason-voice-dark.png"><img src="docs/images/reason-voice-light.png" alt="Voz con ElevenLabs, planeada para el siguiente cambio" width="400"></picture> |
|---|---|---|

1. **Solo tus documentos.** La ingesta lee los archivos que le señalas, y nada más: ni web, ni memoria del modelo,
   nada inventado.
2. **Cada pasaje conserva su fuente.** Documento, encabezado y posición viajan con el texto, así que quien lee puede
   abrir el documento y llegar al pasaje en lugar de confiar en un resumen.
3. **Háblale.** Cited ya responde con los pasajes que encontró y numera cada afirmación; platicar con los mismos
   documentos con ElevenLabs llega en un cambio posterior, y por eso la tarjeta que lo muestra dice `Next`.

## Estado

Cada fila está disponible hoy o planeada, y cada fila planeada nombra el cambio que la entrega.

| Capacidad | Estado | Especificación o cambio |
|---|---|---|
| Ingesta de PDF, DOCX, Markdown y texto con límites | Disponible | [knowledge-search](openspec/specs/knowledge-search/spec.md) |
| Búsqueda híbrida: texto completo y vectores, fusionados con Reciprocal Rank Fusion | Disponible | [knowledge-search](openspec/specs/knowledge-search/spec.md) |
| Embeddings por una API compatible con OpenAI u Ollama | Disponible | [knowledge-search](openspec/specs/knowledge-search/spec.md) |
| Archivo libSQL local o Turso | Disponible | [knowledge-search](openspec/specs/knowledge-search/spec.md) |
| Respuestas con citas de cualquier proveedor de modelo, límites de gasto | Disponible | [answering](openspec/specs/answering/spec.md) |
| El panel: la configuración, el negocio, los documentos y las conversaciones | Disponible | [admin-panel](openspec/specs/admin-panel/spec.md) |
| Chat público del negocio, con el widget que cualquier sitio puede incrustar | Disponible | [public-chat](openspec/specs/public-chat/spec.md) |
| Agente de voz con ElevenLabs, creado en un clic | Siguiente | `elevenlabs-voice-agent` |
| Design system compartido | Siguiente | `design-system-shared` |
| Endurecimiento de seguridad y pruebas de abuso | Siguiente | `security-hardening` |
| Despliegue en un clic, con imagen de Docker y documentación bilingüe | Siguiente | `docs-deploy-and-launch` |

## Cómo funciona

**De una carpeta de documentos a un pasaje citado.**

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/images/how-it-works-dark.png"><img src="docs/images/how-it-works-light.png" alt="Cómo funciona Cited: documentos, pasajes, libSQL, Reciprocal Rank Fusion y la respuesta con sus citas numeradas, con la voz marcada Next" width="1280"></picture>

<details>
<summary>El mismo flujo como diagrama de texto</summary>

```mermaid
flowchart LR
  A[Ingesta: PDF, DOCX, MD, TXT] --> B[Pasajes con su encabezado]
  B --> C[libSQL: FTS5 y vectores nativos]
  C --> D[Reciprocal Rank Fusion]
  D --> E[Respuesta con citas numeradas]
  D --> F[Widget para el sitio]
  D --> G[Agente de voz (next)]
```

</details>

## Míralo funcionar

**Haz una pregunta. Recibe el pasaje y de dónde salió.**

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/images/demo-dark.png"><img src="docs/images/demo-light.png" alt="Una corrida real del arranque rápido de Cited: la ingesta, una búsqueda y una respuesta con su cita" width="1280"></picture>

La imagen la dibuja `scripts/render-readme-graphics.mjs` con la salida de los comandos del arranque rápido, así que
no puede mostrar un resultado que el código no produzca: el mismo corpus, la misma búsqueda y la misma respuesta con
su cita.

**El chat público, como se ve hoy.** Esta no está dibujada: es una captura real de `/` con una pregunta respondida y la
cita abierta, tomada por `scripts/render-readme-captures.mjs` de la aplicación servida por `npm run start` con el
corpus de muestra, los proveedores deterministas y el negocio de muestra (Café La Horquilla, color `#1F5F4A`)
guardado en el panel, por eso el chat lleva su banda.

<img src="docs/images/chat-page.png" alt="El chat público de Cited bajo la banda de un negocio de muestra: una pregunta respondida en español con su cita numerada, el extracto del pasaje resaltado con su documento y su encabezado, el selector English | Español y el campo de la pregunta" width="1280">

**Y el dueño lo maneja desde el navegador.** El panel de `/admin` muestra qué está configurado, guarda el negocio y
su logo, sube los documentos y lista las preguntas con los pasajes que usaron. Abre en inglés, con el selector
`English | Español` en su encabezado, y lo sirve la misma aplicación que responde las preguntas.

<picture><img src="docs/images/admin/panel.png" alt="La pantalla del negocio del panel de Cited, con el nombre, el color, el tono, el idioma, los temas prohibidos, las dos bienvenidas y el logo del negocio" width="1280"></picture>

`docs/admin.md` explica las pantallas, las rutas, el store y las reglas del logo; la captura es una corrida real de
la aplicación construida, tomada por la suite de extremo a extremo de `e2e/admin.spec.ts` con los proveedores
deterministas.

## Hoja de ruta

**Lo que corre hoy y lo que viene después.**

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/images/roadmap-dark.png"><img src="docs/images/roadmap-light.png" alt="El roadmap de Cited: lo que puedes correr hoy y lo que agrega cada siguiente cambio" width="1280"></picture>

Los cambios del plan llegan en este orden: el design system compartido, luego la voz con ElevenLabs, luego el
endurecimiento, luego los despliegues y la documentación.

## Voz

**Háblale a tus documentos.**

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/images/voice-teaser-dark.png"><img src="docs/images/voice-teaser-light.png" alt="Agente de voz de Cited, planeado para el cambio de ElevenLabs" width="1280"></picture>

`elevenlabs-voice-agent` está planeado, no construido: lleva `Next` en cada gráfica que lo muestra.

## Arranque rápido

Dos comandos preparan el corpus y uno pide una respuesta. No hace falta ninguna llave: los proveedores deterministas
corren sin conexión.

```
git clone https://github.com/RonnieGex/cited.git
cd cited
npm ci
cp .env.example .env
EMBEDDINGS_PROVIDER=fake npm run ingest -- samples/
EMBEDDINGS_PROVIDER=fake npm run search -- "¿Cuánto cuesta una afinación de bicicleta?"
EMBEDDINGS_PROVIDER=fake CHAT_PROVIDER=fake npm run ask -- "¿Cuánto cuesta una afinación de bicicleta?"
npm run dev
```

La plantilla del entorno trae todos los valores vacíos a propósito, así que los tres comandos del corpus llevan delante
los proveedores deterministas: `fake` corre sin conexión y no necesita llave, ni para los embeddings ni para el chat.
Para conservarlo toda la sesión, escribe `EMBEDDINGS_PROVIDER=fake` y `CHAT_PROVIDER=fake` en `.env` una vez y
quítalos de los comandos. El último comando sirve la aplicación en `http://localhost:3000`, y `POST /api/ask` es la
misma respuesta por HTTP.

La salida de los tres comandos, sobre el corpus de ejemplo:

```
$ EMBEDDINGS_PROVIDER=fake npm run ingest -- samples/
ingested README.txt (txt, no pages, 1 passages)
ingested bike-workshop-policies.md (md, no pages, 5 passages)
ingested cafe-la-horquilla.md (md, no pages, 4 passages)
ingested notas-del-negocio.txt (txt, no pages, 1 passages)
documents 4, passages 11, skipped 0, store .data/katalis.sqlite, 29 ms, rss 114 MB
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
8 results, 6 ms, rss 79 MB
```

```
$ EMBEDDINGS_PROVIDER=fake CHAT_PROVIDER=fake npm run ask -- "¿Cuánto cuesta una afinación de bicicleta?"
question: ¿Cuánto cuesta una afinación de bicicleta?
store: .data/katalis.sqlite
status: answered
answer: Respuesta del proveedor de prueba: - Afinación de bicicleta: 380 pesos. [1]
citations:
  [1] cafe-la-horquilla.md [Precios] position 2
      Precios - Espresso: 35 pesos. - Café de olla: 45 pesos. - Pan dulce del día: 30 pesos. - Afinación de bicicleta: 380 pesos. - Cambio de cámara: 120 pesos.
citations 1, 46 ms, rss 100 MB
```

El almacén vive en `.data/katalis.sqlite`, que git ignora. `docs/search.md` explica el esquema, el troceado y el
ordenamiento, y `docs/answering.md` el prompt, las citas, los proveedores y los guardas.

### Requisitos

- Node 24, nunca anterior a 24.15 (`.nvmrc`, `engines`)
- npm 11 o superior
- gitleaks para el gancho de commit y Chromium de Playwright para las pruebas de navegador, solo si contribuyes

## Configuración

Las variables que el dueño define, para qué sirve cada una y si el código la lee hoy.

| Variable | Para qué sirve | Se lee hoy |
|---|---|---|
| `EMBEDDINGS_PROVIDER` | el proveedor de embeddings: `openai`, `ollama` o `fake` | sí |
| `EMBEDDINGS_BASE_URL` | URL base de la API de embeddings compatible con OpenAI | sí |
| `EMBEDDINGS_MODEL` | nombre del modelo de embeddings | sí |
| `EMBEDDINGS_API_KEY` | llave del proveedor de embeddings | sí |
| `EMBEDDINGS_DIMENSIONS` | ajuste opcional del tamaño del vector del proveedor | sí |
| `OLLAMA_BASE_URL` | URL base de un Ollama local, `http://localhost:11434` por defecto | sí |
| `DATABASE_URL` | ruta del archivo libSQL local, `.data/katalis.sqlite` por defecto | sí |
| `TURSO_DATABASE_URL` | URL de una base libSQL remota; gana sobre el archivo local | sí |
| `TURSO_AUTH_TOKEN` | token de la base remota, obligatorio cuando la URL es remota | sí |
| `CHAT_PROVIDER` | el proveedor de chat de las respuestas: `openai`, `anthropic`, `gemini`, `deepseek`, `groq`, `openrouter`, `ollama`, `lmstudio` o `fake` | sí |
| `CHAT_MODEL` | modelo opcional del proveedor de chat; sin él cada uno usa su default | sí |
| `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `DEEPSEEK_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY` | la llave del proveedor de chat elegido, y de ningún otro | sí |
| `LMSTUDIO_BASE_URL` | URL base de un LM Studio local, `http://localhost:1234/v1` por defecto | sí |
| `MAX_QUESTION_CHARS` | la pregunta más larga que acepta la ruta, 1000 caracteres por defecto | sí |
| `RATE_LIMIT_PER_IP_PER_HOUR` | las preguntas que una dirección puede hacer en una hora, 30 por defecto | sí |
| `DAILY_MODEL_CALL_LIMIT` | las llamadas al modelo de un día UTC, 500 por defecto | sí |
| `MAX_ANSWER_TOKENS` | el techo de tokens de una respuesta, 600 por defecto | sí |
| `CONVERSATION_RETENTION_DAYS` | los días que se guarda una conversación, 30 por defecto | sí |
| `TRUST_PROXY` | el número de proxies delante: `1` para Traefik solo, `2` para una CDN delante de Traefik; la dirección del visitante es esa cantidad de lugares desde la derecha de `x-forwarded-for`, y sin él la cabecera no se confía | sí |
| `ADMIN_SESSION_SECRET` | secreto que sala el hash de la dirección del visitante y firma la sesión del panel | sí |
| `ADMIN_PASSWORD` | contraseña del panel, la que abre `/admin` | sí |
| `VOICE_TOOL_SECRET` | secreto que la herramienta de voz espera en su token Bearer, planificado en `elevenlabs-voice-agent` | no |
| `EMBEDDING_MODEL`, `EMBEDDING_API_KEY` | modelo del agente de voz, planificado en `elevenlabs-voice-agent` | no |
| `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID` | la voz con ElevenLabs, planificada en `elevenlabs-voice-agent` | no |
| `DAILY_VOICE_MINUTE_LIMIT` | los minutos de voz de un día, planificado en `elevenlabs-voice-agent` | no |
| `ALLOWED_ORIGINS` | orígenes permitidos para incrustar el widget, separados por comas; solo su propio origen cuando está vacío | sí |

Una fila marcada `no` es un nombre que el repositorio ya reserva y que ningún código lee todavía. Ninguna llave tiene
valor en este repositorio, y git ignora `.env`.

## Seguridad

Las llaves viven solo en el entorno del servidor. Nunca llegan al navegador y nunca se guardan en la base de datos. El
modelo de amenazas es `docs/security.md`; una vulnerabilidad se reporta en privado, como dice `SECURITY.md`, nunca en
un issue público. El repositorio no lleva ningún archivo de fuente con licencia comercial desde su primer commit.

## Cómo contribuir

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

## Licencia

Apache-2.0, con un archivo [LICENSE](LICENSE) y un archivo [NOTICE](NOTICE) que lleva la atribución. Un fork conserva
el aviso.

<br>

<p align="center">
  <picture><source media="(prefers-color-scheme: dark)" srcset="public/brand/katalis-flame-192.png"><img src="public/brand/katalis-flame-ink-192.png" alt="Katalis" height="48"></picture>
  <a href="https://katalis.dev">Built by Katalis</a>
</p>

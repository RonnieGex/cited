# Katalis Responde Community

Free and forkable edition of Katalis Responde. A business forks this repository, fills in its own information and its
own API keys, and answers its customers with citations from its own documents: a page of questions, a widget for its
site and a voice agent.

**Under construction.** This repository carries the bootstrap only: the OpenSpec workspace, the standards, a Next.js
16 application with one page, the license, the threat model and a blocking pipeline. The knowledge store, the model
providers, the administration panel, the public page, the widget and the voice agent arrive in the next changes.
Nothing in this repository is a finished product yet.

## What it is and what it is not

**It is** the light edition. One business per installation, its own keys, its own documents. Easy to fork, easy to
run, easy to deploy.

**It is not** the paid service. It carries no several businesses per installation, no agency panel, no payment
integrations and no measured evaluation. It is deliberately lighter than the production service, and that difference
is the business model.

## Requirements

- Node 24, never older than 24.15 (`.nvmrc`, `engines`)
- npm 11 or newer
- gitleaks, for the commit hook
- Playwright Chromium, for the browser tests

## Quick start

```
npm ci
npm run hooks:install
npx playwright install chromium
npm run dev
```

The application answers on `http://localhost:3000`. The commands, the ports and the environment files are in
`docs/development-guide.md`.

## Checks

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

Every one of them is blocking in `.github/workflows/ci.yml`. CodeQL, Dependabot and the secret scan over the full
history run in the pipeline too.

## How the work is done

The specification comes before the code. Every change is an OpenSpec change with `proposal.md`,
`specs/<capability>/spec.md`, `design.md` and `tasks.md`, and its evidence in
`openspec/changes/<change>/reports/`. The rules are in `docs/katalis-sdd-standard.md` and
`docs/openspec-tasks-mandatory-steps.md`.

## Security

The threat model is `docs/security.md`, a living document. A vulnerability is reported privately, as `SECURITY.md`
says, never in a public issue.

## License

Apache License 2.0, with a `NOTICE` file that carries the attribution: **Built by Katalis (https://katalis.dev)**.
A fork keeps that notice, which is how the license works and how the project travels.

No commercially licensed font file is part of this repository. The design system arrives in change 1 with a free
font.

---

# Katalis Responde Community (español)

Edición gratuita y forkeable de Katalis Responde. Un negocio hace fork de este repositorio, mete su propia
información y sus propias llaves de API, y responde a sus clientes con citas de sus propios documentos: una página de
preguntas, un widget para su sitio y un agente de voz.

**En construcción.** Este repositorio trae solamente el arranque: el espacio de OpenSpec, los estándares, una
aplicación Next.js 16 con una página, la licencia, el modelo de amenazas y una pipeline bloqueante. El almacén de
conocimiento, los proveedores de modelo, el panel de administración, la página pública, el widget y el agente de voz
llegan en los siguientes cambios. Nada de este repositorio es todavía un producto terminado.

## Qué es y qué no es

**Es** la edición ligera. Un negocio por instalación, sus llaves, sus documentos. Fácil de forkear, de correr y de
desplegar.

**No es** el servicio de pago. No lleva varios negocios por instalación, ni panel de agencia, ni integraciones de
pago, ni evaluación medida. Es a propósito más liviana que el servicio de producción, y esa diferencia es el modelo
de negocio.

## Requisitos

- Node 24, nunca anterior a 24.15 (`.nvmrc`, `engines`)
- npm 11 o superior
- gitleaks, para el gancho de commit
- Chromium de Playwright, para las pruebas de navegador

## Arranque rápido

```
npm ci
npm run hooks:install
npx playwright install chromium
npm run dev
```

La aplicación responde en `http://localhost:3000`. Los comandos, los puertos y los archivos de entorno están en
`docs/development-guide.md`.

## Comprobaciones

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

Todas son bloqueantes en `.github/workflows/ci.yml`. CodeQL, Dependabot y el escaneo de secretos sobre todo el
historial también corren en la pipeline.

## Cómo se trabaja

La especificación va antes que el código. Cada cambio es un cambio de OpenSpec con `proposal.md`,
`specs/<capacidad>/spec.md`, `design.md` y `tasks.md`, y su evidencia en `openspec/changes/<cambio>/reports/`. Las
reglas están en `docs/katalis-sdd-standard.md` y `docs/openspec-tasks-mandatory-steps.md`.

## Seguridad

El modelo de amenazas es `docs/security.md`, un documento vivo. Una vulnerabilidad se reporta en privado, como dice
`SECURITY.md`, nunca en un issue público.

## Licencia

Apache License 2.0, con un archivo `NOTICE` que lleva la atribución: **Built by Katalis (https://katalis.dev)**. Un
fork conserva ese aviso, así funciona la licencia y así viaja el proyecto.

Ningún archivo de fuente con licencia comercial es parte de este repositorio. El design system llega en el cambio 1
con una fuente libre.

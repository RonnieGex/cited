# Step 5 — the checks of the change

- **Date:** 2026-09-30
- **Change:** `passage-display-polish` (`tasks.md`, tasks 5.1 and 5.2)
- **Branch:** `feature/passage-display-polish`
- **Commit this report was verified against:** `0c83ae7`
- **Agent:** DeepSeek (implementer)
- **Verdict:** every check of the mandatory list passes at the code of the change, and the corpus after the change
  differs from the baseline of step 1.2 in the three passages with a list and in nothing else.

## 5.1 The checks

All of them ran in the disposable clean clone of `0c83ae7` (a folder of the temporary directory of the machine, cloned
with `git clone --no-hardlinks --branch feature/passage-display-polish`), whose only environment file is the
`.env.example` of the repository. No `.env.local` of any worktree was opened.

```
<clean clone> > node -v
v24.11.0
```

```
<clean clone> > npm run typecheck
> cited@0.1.0 typecheck
> next typegen && tsc --noEmit

Generating route types...
✓ Types generated successfully
[exit code: 0]

<clean clone> > npm run lint
> cited@0.1.0 lint
> eslint .
[exit code: 0]

<clean clone> > npx -y -p node@24 node node_modules/vitest/vitest.mjs run
 Test Files  89 passed (89)
      Tests  1052 passed (1052)
   Duration  79.68s
[exit code: 0]

<clean clone> > npm run build
   ▲ Next.js 16.3.6
 ✓ Compiled successfully
 ✓ Generating static pages
ƒ Proxy (Middleware)
ƒ  (Dynamic)  server-rendered on demand
build exit=0
elapsed=24s

<clean clone> > npm run audit:high
> npm audit --audit-level=high
found 0 vulnerabilities
[exit code: 0]

<clean clone> > npm run secrets:scan
7:13PM INF 547 commits scanned.
7:13PM INF no leaks found
[exit code: 0]

<clean clone> > npm run openspec:validate
Totals: 14 passed, 0 failed (14 items)
[exit code: 0]
```

The unit suite of the baseline was 1018 tests in 85 files; the code of the change has 1052 in 89 files, so the change
adds 34 cases in four files and changes none of the counts of the others (every file of the baseline still passes).
CodeQL is not run here: it needs a GitHub runner, and the pipeline runs it.

## 5.2 The passages of the sample corpus after the change

Measured with the same tool and the same form as the baseline of `reports/2026-09-30-step-1-corpus.md`, in the clean
clone at the code of the change, with the deterministic providers and a scratch store:

```
<clean clone> > npx -y -p node@24 node .data/pdp/corpus-5-2.ts
README.txt | position 0 | heading null
   "Sample corpus of Cited These documents describe a fictional small business, Café La Horquilla, a café and bicycle workshop. … not prices of a real business.\n- cafe-la-horquilla.md: hours, prices and policies, in Spanish.\n- bike-workshop-policies.md: bookings, storage, groups and guarantee, in English.\n- notas-del-negocio.txt: payment, invoicing, pets, accessibility, in Spanish."
bike-workshop-policies.md | position 0 | heading "Bike workshop policies at Café La Horquilla"
   "Bike workshop policies at Café La Horquilla Everything a customer needs to know before leaving a bicycle with us."
bike-workshop-policies.md | position 1 | heading "Bookings and cancellations"
   "Bookings and cancellations A repair booking is free. Cancel or move your appointment at least 24 hours before the agreed time and there is no charge. A late cancellation costs 50 pesos, and a dropped appointment costs the full estimate."
bike-workshop-policies.md | position 2 | heading "Storage"
   "Storage We keep a bicycle for 15 days after we tell you it is ready. After that the storage fee is 25 pesos per day, and we call once more before any other step."
bike-workshop-policies.md | position 3 | heading "Groups and events"
   "Groups and events We host a Saturday ride that leaves the shop at 9:30. Groups of more than 8 people should write to us a week ahead so we can arrange a mechanic and a second guide."
bike-workshop-policies.md | position 4 | heading "Guarantee"
   "Guarantee Every repair carries a 90 day guarantee on the work. Parts carry the guarantee of their maker. Bring the ticket; without it we can still look up the repair by the frame number."
cafe-la-horquilla.md | position 0 | heading "Café La Horquilla"
   "Café La Horquilla Somos un café y taller de bicicletas en el centro de la ciudad. Abrimos de martes a domingo."
cafe-la-horquilla.md | position 1 | heading "Horario"
   "Horario - Martes a viernes: 8:00 a 19:00.\n- Sábado: 9:00 a 20:00.\n- Domingo: 9:00 a 14:00.\n- Lunes: cerrado por mantenimiento del taller."
cafe-la-horquilla.md | position 2 | heading "Precios"
   "Precios - Espresso: 35 pesos.\n- Café de olla: 45 pesos.\n- Pan dulce del día: 30 pesos.\n- Afinación de bicicleta: 380 pesos.\n- Cambio de cámara: 120 pesos."
cafe-la-horquilla.md | position 3 | heading "Políticas"
   "Políticas Aceptamos efectivo y tarjeta. El taller recibe bicicletas hasta una hora antes del cierre. Si una reparación necesita refacciones, avisamos por teléfono antes de empezar."
notas-del-negocio.txt | position 0 | heading null
   "Café La Horquilla — notas del negocio Dirección: avenida central, frente al parque. … No damos precios por mensaje para trabajos que requieren revisar la bicicleta."
```

Read side by side with the baseline: **four documents and eleven passages before and after, the same documents in the
same order, the same positions and the same headings.** Three passages changed and only by their line breaks:

| Document | Position | Before | After |
|---|---|---|---|
| `README.txt` | 0 | the three items of the list joined with " - " | the same words with `\n` before every item |
| `cafe-la-horquilla.md` | 1 | four items joined with " - " | the same words with `\n` before every item |
| `cafe-la-horquilla.md` | 2 | five items joined with " - " | the same words with `\n` before every item |

No other passage moved, no word changed, and no passage was added or lost.

## 5.2 The searches of `tests/search.test.ts`, before and after

```
=== hits for "cancelaciones" (5) ===
   politicas.md | position 1 | heading "Cambios y cancelaciones" | score 0.03278688524590164
   horario.md | position 0 | heading "Horario" | score 0.016129032258064516
   pagos.md | position 1 | heading "Formas de pago" | score 0.015873015873015872
   politicas.md | position 0 | heading "Políticas del taller" | score 0.015625
   pagos.md | position 0 | heading "Pagos" | score 0.015384615384615385
=== hits for "mantenimiento" (5) ===
   horario.md | position 0 | heading "Horario" | score 0.03252247488101534
   pagos.md | position 0 | heading "Pagos" | score 0.01639344262295082
   politicas.md | position 0 | heading "Políticas del taller" | score 0.015873015873015872
   politicas.md | position 1 | heading "Cambios y cancelaciones" | score 0.015625
   pagos.md | position 1 | heading "Formas de pago" | score 0.015384615384615385
=== hits for "¿Aceptan reprogramaciones gratuitas avisando anticipadamente?" (5) ===
   politicas.md | position 1 | heading "Cambios y cancelaciones" | score 0.01639344262295082
   pagos.md | position 1 | heading "Formas de pago" | score 0.016129032258064516
   horario.md | position 0 | heading "Horario" | score 0.015873015873015872
   politicas.md | position 0 | heading "Políticas del taller" | score 0.015625
   pagos.md | position 0 | heading "Pagos" | score 0.015384615384615385
=== hits for "taller" (5) ===
   politicas.md | position 0 | heading "Políticas del taller" | score 0.03278688524590164
   horario.md | position 0 | heading "Horario" | score 0.03225806451612903
   politicas.md | position 1 | heading "Cambios y cancelaciones" | score 0.031746031746031744
   pagos.md | position 1 | heading "Formas de pago" | score 0.015625
   pagos.md | position 0 | heading "Pagos" | score 0.015384615384615385
```

Also the passages of that corpus, before and after, are the same five with the same text: none of its documents has a
list. Every one of the four questions returns the same passages in the same order with the same scores as the baseline:
**the scenario "Search does not move" holds.**

# Step 1.2 — the passages of the sample corpus before the change

- **Date:** 2026-09-30
- **Change:** `passage-display-polish` (`tasks.md`, task 1.2)
- **Branch:** `feature/passage-display-polish`
- **Commit this report was verified against:** `dbc324f` (the contract; the code under measurement is `86b250f`)
- **Agent:** DeepSeek (implementer)
- **Verdict:** the baseline of the scenario "Search does not move" is written down here: the passages of the sample
  corpus with their `position`, `heading` and `text`, and the hits of the four questions of `tests/search.test.ts`.
  Every passage with a list carries the items joined with a space, which is the defect the change fixes.

## How it was measured

The tool `.data/pdp/baseline.ts` (a scratch file, never committed: `.data/` is ignored) ingests a corpus with
`createFakeEmbeddings()` — the deterministic provider, no network — into a scratch store and prints every passage and
then the hits of the questions. It reads no `.env` file: the store comes from `BASELINE_STORE` and the corpus from the
command line.

```
<worktree> > $env:BASELINE_STORE="<scratch>/pdp-base-samples"
<worktree> > npx -y -p node@24 node .data\pdp\baseline.ts samples <worktree>\samples
[exit code: 0]

<worktree> > $env:BASELINE_STORE="<scratch>/pdp-base-search"
<worktree> > npx -y -p node@24 node .data\pdp\baseline.ts search-corpus <scratch>/pdp-search-corpus
[exit code: 0]
```

The corpus of the second command is the one `tests/search.test.ts` builds at run time: `politicas.md`, `horario.md`
and `pagos.md`, written by the tool with the same text. The questions are the four of that file:
`cancelaciones`, `mantenimiento`, `¿Aceptan reprogramaciones gratuitas avisando anticipadamente?` and `taller`.

## The passages of `samples/` before the change

```
README.txt | position 0 | heading null
   "Sample corpus of Cited These documents describe a fictional small business, Café La Horquilla, a café and bicycle workshop. They exist so the tests, the manual verification and the RAM measurement of this repository have something real to ingest. They were written for this repository. They are not the book of Construye, not golden cases, not holdout data, not a customer document and not prices of a real business. - cafe-la-horquilla.md: hours, prices and policies, in Spanish. - bike-workshop-policies.md: bookings, storage, groups and guarantee, in English. - notas-del-negocio.txt: payment, invoicing, pets, accessibility, in Spanish."
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
   "Horario - Martes a viernes: 8:00 a 19:00. - Sábado: 9:00 a 20:00. - Domingo: 9:00 a 14:00. - Lunes: cerrado por mantenimiento del taller."
cafe-la-horquilla.md | position 2 | heading "Precios"
   "Precios - Espresso: 35 pesos. - Café de olla: 45 pesos. - Pan dulce del día: 30 pesos. - Afinación de bicicleta: 380 pesos. - Cambio de cámara: 120 pesos."
cafe-la-horquilla.md | position 3 | heading "Políticas"
   "Políticas Aceptamos efectivo y tarjeta. El taller recibe bicicletas hasta una hora antes del cierre. Si una reparación necesita refacciones, avisamos por teléfono antes de empezar."
notas-del-negocio.txt | position 0 | heading null
   "Café La Horquilla — notas del negocio Dirección: avenida central, frente al parque. Sin estacionamiento propio, pero hay uno público a media cuadra. Formas de pago: efectivo, tarjeta de débito y crédito. No aceptamos cheques ni transferencias para consumos menores a 200 pesos. Facturación: pedimos el RFC el mismo día de la compra. Las facturas del taller se emiten al terminar la reparación. Mascotas: bienvenidas en la terraza. Dentro del local solo si van en transportadora. Accesibilidad: la entrada tiene rampa y el baño es amplio. El taller está en planta baja. Contacto: mostrador, teléfono del local y correo del negocio. No damos precios por mensaje para trabajos que requieren revisar la bicicleta."
```

Four documents, eleven passages. The three passages with a list — `README.txt` position 0 (`cafe-la-horquilla.md:` …
`bike-workshop-policies.md:` …), `cafe-la-horquilla.md` position 1 and position 2 — carry it flattened into one
paragraph joined with " - ", which is the defect this change fixes.

## The passages of the corpus of `tests/search.test.ts`, before

```
horario.md | position 0 | heading "Horario"
   "Horario Horario Martes a viernes de 8:00 a 19:00. Sábado de 9:00 a 20:00. Domingo de 9:00 a 14:00. El lunes el taller permanece cerrado por mantenimiento."
pagos.md | position 0 | heading "Pagos"
   "Pagos"
pagos.md | position 1 | heading "Formas de pago"
   "Formas de pago Efectivo y tarjeta en el mostrador. Para consumos menores a 200 pesos no aceptamos transferencias. La factura se pide el mismo día de la compra."
politicas.md | position 0 | heading "Políticas del taller"
   "Políticas del taller"
politicas.md | position 1 | heading "Cambios y cancelaciones"
   "Cambios y cancelaciones Puedes mover tu cita sin costo si avisas con dos días de anticipación. Si avisas más tarde, el taller cobra la mitad de la mano de obra. Si no llegas, se cobra el trabajo completo."
```

## The searches of `tests/search.test.ts`, before (the baseline of "Search does not move")

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

## The passages of `samples/` and their hits, for the record

The same tool printed the eight hits of each question over the sample corpus. The two questions that the delta
`knowledge-search` names for the passage of `Horario` are written down here:

```
=== hits for "mantenimiento" (8) ===
   cafe-la-horquilla.md | position 1 | heading "Horario" | score 0.032018442622950824
   bike-workshop-policies.md | position 1 | heading "Bookings and cancellations" | score 0.01639344262295082
   README.txt | position 0 | heading null | score 0.016129032258064516
   notas-del-negocio.txt | position 0 | heading null | score 0.015873015873015872
   bike-workshop-policies.md | position 4 | heading "Guarantee" | score 0.015384615384615385
   bike-workshop-policies.md | position 3 | heading "Groups and events" | score 0.015151515151515152
   cafe-la-horquilla.md | position 0 | heading "Café La Horquilla" | score 0.014925373134328358
   bike-workshop-policies.md | position 0 | heading "Bike workshop policies at Café La Horquilla" | score 0.014705882352941176

=== hits for "taller" (8) ===
   cafe-la-horquilla.md | position 0 | heading "Café La Horquilla" | score 0.03278688524590164
   cafe-la-horquilla.md | position 3 | heading "Políticas" | score 0.03200204813108039
   notas-del-negocio.txt | position 0 | heading null | score 0.031754032258064516
   cafe-la-horquilla.md | position 1 | heading "Horario" | score 0.03125763125763126
   bike-workshop-policies.md | position 4 | heading "Guarantee" | score 0.015625
   bike-workshop-policies.md | position 0 | heading "Bike workshop policies at Café La Horquilla" | score 0.015151515151515152
   bike-workshop-policies.md | position 1 | heading "Bookings and cancellations" | score 0.014925373134328358
   bike-workshop-policies.md | position 2 | heading "Storage" | score 0.014705882352941176
```

Step 5.2 repeats the passages of this report at the code of the change: only the passages with a list may change, and
only by their line breaks.

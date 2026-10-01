# Step 11 — the samples of the READMEs are what the commands print (task 11.2)

- **Date:** 2026-09-30
- **Change:** `passage-display-polish` (`tasks.md`, task 11.2; decision 16 of `design.md`)
- **Branch:** `feature/passage-display-polish`
- **Commit this report was verified against:** `13b41f2` (its `scripts/`, `samples/`, `README.md`, `README.es.md` and
  `docs/` are the ones of `1371333`: this round adds no line of the product or of the documentation)
- **Agent:** DeepSeek (implementer)
- **Verdict:** `npm run search` and `npm run ask` print the flattened text of `Precios` with the ` - ` of each item,
  exactly as the samples of the READMEs and of `docs/answering.md` show. The NOT DONE that the round 2 declared for
  those samples is withdrawn: the commands produce that text on purpose, and the line break of the store only lives
  in the store.

## The commands

All three ran in the disposable clean clone of `13b41f2` (a folder of the temporary directory of the machine, cloned
with `git clone --no-hardlinks --branch feature/passage-display-polish`), whose only environment file is the
`.env.example` of the repository. Each one printed `.env not found. Continuing without it.` on stderr, so no `.env`
and no `.env.local` was read: the three carry the deterministic providers in front, exactly as the README says.

```text
<clean clone> > $env:EMBEDDINGS_PROVIDER = "fake"; npm run ingest -- samples/
ingested README.txt (txt, no pages, 1 passages)
ingested bike-workshop-policies.md (md, no pages, 5 passages)
ingested cafe-la-horquilla.md (md, no pages, 4 passages)
ingested notas-del-negocio.txt (txt, no pages, 1 passages)
documents 4, passages 11, skipped 0, store .data/katalis.sqlite, 38 ms, rss 130 MB

<clean clone> > npm run search -- "¿Cuánto cuesta una afinación de bicicleta?"
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

8 results, 5 ms, rss 94 MB

<clean clone> > $env:CHAT_PROVIDER = "fake"; npm run ask -- "¿Cuánto cuesta una afinación de bicicleta?"
question: ¿Cuánto cuesta una afinación de bicicleta?
store: .data/katalis.sqlite
status: answered
answer: Respuesta del proveedor de prueba: - Afinación de bicicleta: 380 pesos. [1]
citations:
  [1] cafe-la-horquilla.md [Precios] position 2 lead 0
      Precios - Espresso: 35 pesos. - Café de olla: 45 pesos. - Pan dulce del día: 30 pesos. - Afinación de bicicleta: 380 pesos. - Cambio de cámara: 120 pesos.
citations 1, 30 ms, rss 104 MB
```

The first hit of the search and the excerpt of the citation are, character by character, `README.md:172` and `:198`,
`README.es.md:174` and `:200`, `docs/answering.md:263` and the three samples of
`docs/images/readme-graphics.json:230`, `:234` and `:248`.

## Why the commands flatten it

The store keeps the line breaks of decision 2, and the probe of the same store prints them:

```text
position 2: "Precios - Espresso: 35 pesos.\n- Café de olla: 45 pesos.\n- Pan dulce del día: 30 pesos.\n- Afinación de bicicleta: 380 pesos.\n- Cambio de cámara: 120 pesos."
```

The two commands print the excerpt of a passage in one line on purpose: `scripts/search.ts:32` and
`scripts/ask.ts:70` write `hit.text.slice(0, 240).replace(/\s+/g, " ")`, so the `\n` of the store becomes the space
between the sentence of an item and the `- ` of the next one. The samples of the READMEs are the output of the
commands, and the round 2 had nothing to fix in them.

## The correction

- `reports/2026-09-30-step-10-amendment.md`, `### NOT DONE`: the declaration that the sample outputs of the READMEs
  "still show the flattened text of `Precios`" is withdrawn and replaced by the correction above, with the two lines
  of the formatter and the output of this report.
- `katalis-dev/tasks/entrega-passage-display-polish.md`, the `### NOT DONE` of "Ronda 2": the same declaration is
  withdrawn with the same words, in Spanish.

Nothing else changes: no line of `README.md`, of `README.es.md`, of `docs/answering.md`, of
`docs/images/readme-graphics.json` or of the store is touched, because the samples already are what the commands
print.

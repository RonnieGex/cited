# Step 7 - Manual verification

- Date: 2026-09-29
- Change: `core-hybrid-search`
- Branch: `feature/core-hybrid-search`
- Agent: `deepseek-harness`
- Commit verified against: `39684fd` plus the working tree of the change

There is no HTTP route in this change, so the command line plays the role that `curl.exe` plays in the other changes
of this repository. The three runs below use the fake provider, so no call leaves the machine: they are the manual
verification of task 7.1. The store lives in a temporary folder and is deleted at the end of the step, so no store
file is left in the repository.

## Ingestion of the sample corpus

```
> $env:EMBEDDINGS_PROVIDER = "fake"
> $env:DATABASE_URL = "<temporary folder>/store.sqlite"
> npm run ingest -- samples/

> node --env-file-if-exists=.env scripts/ingest.ts samples/

ingested README.txt (txt, no pages, 1 passages)
ingested bike-workshop-policies.md (md, no pages, 5 passages)
ingested cafe-la-horquilla.md (md, no pages, 4 passages)
ingested notas-del-negocio.txt (txt, no pages, 1 passages)
documents 4, passages 11, skipped 0, store <temporary folder>/store.sqlite, 32 ms, rss 107 MB
```

Four documents, eleven passages, nothing skipped. The headings of the Markdown files arrive with their passages, as
the search below shows.

## Question 1, Spanish: the price of a bicycle tune-up

```
> npm run search -- "¿Cuánto cuesta una afinación de bicicleta?"

question: ¿Cuánto cuesta una afinación de bicicleta?
store: <temporary folder>/store.sqlite

1. cafe-la-horquilla.md [Precios] position 2 score 0.032522
   Precios - Espresso: 35 pesos. - Café de olla: 45 pesos. - Pan dulce del día: 30 pesos. - Afinación de bicicleta: 380 pesos. - Cambio de cámara: 120 pesos.

2. cafe-la-horquilla.md [Políticas] position 3 score 0.032522
   Políticas Aceptamos efectivo y tarjeta. El taller recibe bicicletas hasta una hora antes del cierre. Si una reparación necesita refacciones, avisamos por teléfono antes de empezar.

3. bike-workshop-policies.md [Guarantee] position 4 score 0.031319
   Guarantee Every repair carries a 90 day guarantee on the work. Parts carry the guarantee of their maker. Bring the ticket; without it we can still look up the repair by the frame number.

…

8 results, 5 ms, rss 71 MB
```

The first result is the price list of the business, with the heading `Precios` and the exact price of the tune-up
(`380 pesos`). The question shares the term "afinación" with that passage, and the keyword ranking puts it first.

## Question 2, English: the cancellation policy

```
> npm run search -- "What is the cancellation policy?"

question: What is the cancellation policy?
store: <temporary folder>/store.sqlite

1. bike-workshop-policies.md [Bookings and cancellations] position 1 score 0.032787
   Bookings and cancellations A repair booking is free. Cancel or move your appointment at least 24 hours before the agreed time and there is no charge. A late cancellation costs 50 pesos, and a dropped appointment costs the full estimate.

2. bike-workshop-policies.md [Storage] position 2 score 0.032002
   Storage We keep a bicycle for 15 days after we tell you it is ready. After that the storage fee is 25 pesos per day, and we call once more before any other step.

…

8 results, 5 ms, rss 71 MB
```

The first result is the policy passage and the paragraph that answers the question, with its heading. The English
corpus is a different document from the Spanish one, so this also shows the two languages living in one store.

## Question 3, English: the guarantee without the ticket

```
> npm run search -- "I lost the ticket of my repair, is the work still guaranteed?"

question: I lost the ticket of my repair, is the work still guaranteed?
store: <temporary folder>/store.sqlite

1. bike-workshop-policies.md [Guarantee] position 4 score 0.032787
   Guarantee Every repair carries a 90 day guarantee on the work. Parts carry the guarantee of their maker. Bring the ticket; without it we can still look up the repair by the frame number.

…

8 results, 5 ms, rss 71 MB
```

The passage that ranks first is the paragraph that answers the question, and it shares the word "guarantee" with the
question: the keyword ranking and the vector ranking agree.

## A note on what the fake provider can and cannot do

The three runs above use the deterministic fake provider, which encodes a text by its words and its character
trigrams. That is enough for the keyword half of the fusion to carry a question that shares a term with a passage, and
it is enough for a paraphrase of a passage of the same language, which the tests of step 3 assert. It is **not** a
translation service: a question about prices phrased in English does not reach the Spanish price list with this
provider, because the two share almost no characters. A real embeddings model does cross that gap, and installing one
is a matter of filling `EMBEDDINGS_PROVIDER`, `EMBEDDINGS_BASE_URL`, `EMBEDDINGS_MODEL` and `EMBEDDINGS_API_KEY`.
Section 8 of `docs/search.md` says exactly that.

## Verdict

PASS. The ingestion of the sample corpus and three searches, one in Spanish and two in English, were run by hand with
the fake provider, and the top result of each one is the passage that answers the question. No call left the machine
and no store file stayed behind.

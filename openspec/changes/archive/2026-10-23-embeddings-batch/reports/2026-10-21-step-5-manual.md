# Step 5: manual verification with the ingestion command

Date: 2026-10-21. Agent: Fable. Working tree of commit `1d09bb6`.

The change has no HTTP surface, so there is no `curl.exe` check: the manual path of this variable is the ingestion
command of the README, run against a temporary store outside the repository, with the fake provider.

```
EMBEDDINGS_PROVIDER=fake EMBEDDINGS_BATCH=4 DATABASE_URL=<temporary>/batch4.sqlite npm run ingest -- samples/
```

```
ingested README.txt (txt, no pages, 1 passages)
ingested bike-workshop-policies.md (md, no pages, 5 passages)
ingested cafe-la-horquilla.md (md, no pages, 4 passages)
ingested notas-del-negocio.txt (txt, no pages, 1 passages)
documents 4, passages 11, skipped 0, store <temporary>/batch4.sqlite, 64 ms, rss 216 MB
exit 0
```

```
EMBEDDINGS_PROVIDER=fake EMBEDDINGS_BATCH=abc DATABASE_URL=<temporary>/batchabc.sqlite npm run ingest -- samples/
```

```
ingested README.txt (txt, no pages, 1 passages)
ingested bike-workshop-policies.md (md, no pages, 5 passages)
ingested cafe-la-horquilla.md (md, no pages, 4 passages)
ingested notas-del-negocio.txt (txt, no pages, 1 passages)
documents 4, passages 11, skipped 0, store <temporary>/batchabc.sqlite, 210 ms, rss 176 MB
exit 0
```

Both runs ingest the same four documents and eleven passages, and the bad value neither stops the run nor prints
anything. The command cannot show how many texts each request carried, because the fake provider has no transport;
that fact is proved by the recording provider of `tests/embeddings-batch.test.ts` (step 1). The temporary stores were
removed afterwards.

## Issues of the manual check

- NOT DONE: a run against a real OpenAI-compatible service with a limit of 16 texts. The service that motivated the
  change is the one of the Katalis Hermes installation, which the brief asks not to use; the local patch it ran with
  (`cited-embeddings-batch.diff`) read the same variable with the same default.

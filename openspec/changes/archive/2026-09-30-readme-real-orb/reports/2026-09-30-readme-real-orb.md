# readme-real-orb: evidence (2026-09-30)

Branch `feature/readme-real-orb` from `origin/main` `8b0c77f`.

## The capture

```
npm run build:e2e
# verify-no-test-sdk: OK: the test SDK is in the browser output (2 file(s)) and the real package is not.
EMBEDDINGS_PROVIDER=fake CHAT_PROVIDER=fake DATABASE_URL=.data/orb-capture.sqlite ELEVENLABS_API_KEY= \
  ELEVENLABS_AGENT_ID= ELEVENLABS_VOICE_ID= VOICE_TOOL_SECRET= npm start -- --port 3200
node scripts/render-readme-orb.mjs
frame 1: 15.1% of the sphere is white
frame 2: 13.2% of the sphere is white
frame 3: 13.0% of the sphere is white
frame 4: 11.1% of the sphere is white
frame 5: 12.2% of the sphere is white
frame 6: 12.4% of the sphere is white
frame 7: 11.1% of the sphere is white
frame 8: 10.0% of the sphere is white
wrote docs/images/voice/orb.png (468 x 468, frame 8) and docs/images/voice/orb.json
```

The signed URL of ElevenLabs is answered inside the browser by the script, as in `render-voice-captures.mjs`, and the
build carries the test SDK: no session with ElevenLabs was opened. Before the script existed, a probe checked that a
frame frozen by `prefers-reduced-motion` gives two identical shots on the same ground (difference box `None`) and that
the alpha recovered from the two grounds agrees on the three channels (largest disagreement `0.0`).

## The teaser

```
node scripts/render-readme-graphics.mjs voice-teaser
rendered docs/images/voice-teaser-dark.png (35320 bytes, smallest text 16px, 1 headlines, empty band 50px of 90px)
rendered docs/images/voice-teaser-light.png (37350 bytes, smallest text 16px, 1 headlines, empty band 50px of 90px)
rendered only voice-teaser: the record is left as it is.
```

The same run rewrote the quick start of `README.md` and `README.es.md` with new timings only (`30 ms` to `43 ms` and
the like); those two files were restored, so the README stays in step with `docs/images/readme-graphics.json`.

## Checks

```
npx vitest run tests/readme.test.ts tests/design-system.test.ts   # 2 files, 62 passed
npx vitest run                                                    # 1018 passed in the last two runs; see Issues
npx eslint scripts/render-readme-orb.mjs scripts/render-readme-graphics.mjs   # exit 0
openspec validate --all --strict                                  # 14 passed, 0 failed
openspec validate readme-real-orb --strict                        # valid
```

## Issues

- NOT DONE: the adversarial review by a session that did not write the change (task 4.1), and Franc's acceptance.
- UNKNOWN: the first full run of `npx vitest run` reported one failed test out of 1018, while the capture server was
  still running on port 3200; the runs after it showed no failure, the last two passing 1018 of 1018. Its name was not
  kept, so it may be a flaky test of the base or an effect of the busy machine.
- RISK: the frozen frame depends on the timing of the animation, so a new run of the capture gives a similar but not
  identical Orb; the image in the repository is the record, and `orb.json` says which frame of the run was kept.

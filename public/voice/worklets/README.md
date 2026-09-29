# The audio of the voice session

This folder is served by this origin on purpose. `AudioWorklet.addModule` is governed by `script-src`, and the policy
of the page (`lib/headers/csp.ts`) never names a third-party script host, so every processor the session loads has to
come from here. `components/voice/voice-session.ts` hands these paths to the SDK at `startSession`
(`workletPaths` and `libsampleratePath`).

| File here | Origin | Version installed | Licence |
| --- | --- | --- | --- |
| `raw-audio-processor.js` | `@elevenlabs/client`, public entrypoint `worklets/*` | `@elevenlabs/client` 1.26.0, through `@elevenlabs/react` 1.16.0 | MIT, Copyright (c) 2025 ElevenLabs |
| `audio-concat-processor.js` | `@elevenlabs/client`, public entrypoint `worklets/*` | `@elevenlabs/client` 1.26.0 | MIT, Copyright (c) 2025 ElevenLabs |
| `libsamplerate.worklet.js` | `@alexanderolsen/libsamplerate-js`, `dist/libsamplerate.worklet.js` | 2.1.2 | MIT, Copyright (c) 2021 Alexander Olsen |

The resampler is the file the SDK asks jsDelivr for when a session gives no `libsampleratePath`; a device whose audio
sample rate differs from the agent's needs it, and the CDN it would reach is exactly what the policy blocks.

`npm run worklets:voice` refreshes the three copies from the installed packages, and
`tests/voice-worklets.test.tsx` fails when a copy is not the file of the installed package.

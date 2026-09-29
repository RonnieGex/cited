# The audio of the voice session

This folder is served by this origin on purpose. `AudioWorklet.addModule` is governed by `script-src`, and the policy
of the page (`lib/headers/csp.ts`) never names a third-party script host, so every processor the session loads has to
come from here. `components/voice/voice-session.ts` hands these paths to the SDK at `startSession`
(`workletPaths` and `libsampleratePath`).

| File here | Origin | Version installed | Licence |
| --- | --- | --- | --- |
| `raw-audio-processor.js` | `@elevenlabs/client`, public entrypoint `worklets/*` | `@elevenlabs/client` 1.26.0, through `@elevenlabs/react` 1.16.0 | MIT, Copyright (c) 2025 ElevenLabs |
| `audio-concat-processor.js` | `@elevenlabs/client`, public entrypoint `worklets/*` | `@elevenlabs/client` 1.26.0 | MIT, Copyright (c) 2025 ElevenLabs |
| `libsamplerate.worklet.js` | `@alexanderolsen/libsamplerate-js`, `dist/libsamplerate.worklet.js` | 2.1.2 | MIT, Copyright (c) 2021 Alexander Olsen, and the BSD 2-clause of the libsamplerate it bundles, Copyright (c) 2012-2016 Erik de Castro Lopo |
| `LICENSE-elevenlabs-client.md` | the `LICENSE` of `@elevenlabs/client`, byte for byte | `@elevenlabs/client` 1.26.0 | MIT, Copyright (c) 2025 ElevenLabs |
| `LICENSE-libsamplerate-js.md` | the `LICENSE.md` of `@alexanderolsen/libsamplerate-js`, byte for byte | 2.1.2 | MIT and BSD 2-clause in one file: the package publishes both texts together |

The resampler is the file the SDK asks jsDelivr for when a session gives no `libsampleratePath`; a device whose audio
sample rate differs from the agent's needs it, and the CDN it would reach is exactly what the policy blocks.

Each copy travels with the license text of its package, byte for byte from the installed package: the resampler bundles
libsamplerate, whose 2-clause BSD notice is the second half of `LICENSE-libsamplerate-js.md`, and the two processors are
MIT through `LICENSE-elevenlabs-client.md`. `THIRD_PARTY_NOTICES.md`, at the root of the repository, lists every copy
with its name, version, license and origin.

`npm run worklets:voice` refreshes the three copies and the two license files from the installed packages, and
`tests/voice-worklets.test.tsx` and `tests/third-party-notices.test.ts` fail when a copy is not the file of the
installed package.

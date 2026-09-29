# Third-party notices

Cited is Apache-2.0 (see `LICENSE`) and its own copyright line is in `NOTICE`. This file lists every file this
repository serves or ships that is a verbatim copy of a package, with its name, the version installed, its license and
its origin, and it says where the license text of each one travels.

The rule comes from the change `elevenlabs-voice-agent` (requirement "What is copied from a package keeps its
notice"): a verbatim copy sits next to the license text of its package, byte for byte from the installed package, and
has a row here. `tests/third-party-notices.test.ts` reads the installed package and fails when a copy drifts from its
license or a served file has no row.

## The audio of the voice session, served from `public/voice/worklets/`

| File served | Package | Version | License | Origin inside the package |
| --- | --- | --- | --- | --- |
| `public/voice/worklets/raw-audio-processor.js` | `@elevenlabs/client`, through `@elevenlabs/react` | 1.26.0 (React SDK 1.16.0) | MIT, Copyright (c) 2025 ElevenLabs | `worklets/rawAudioProcessor.js`, public and semver-stable entrypoint `@elevenlabs/client/worklets/*` |
| `public/voice/worklets/audio-concat-processor.js` | `@elevenlabs/client` | 1.26.0 | MIT, Copyright (c) 2025 ElevenLabs | `worklets/audioConcatProcessor.js`, public entrypoint `@elevenlabs/client/worklets/*` |
| `public/voice/worklets/libsamplerate.worklet.js` | `@alexanderolsen/libsamplerate-js` | 2.1.2 | MIT, Copyright (c) 2021 Alexander Olsen, and BSD 2-Clause for the libsamplerate it bundles, Copyright (c) 2012-2016 Erik de Castro Lopo | `dist/libsamplerate.worklet.js` |
| `public/voice/worklets/LICENSE-elevenlabs-client.md` | `@elevenlabs/client` | 1.26.0 | MIT, Copyright (c) 2025 ElevenLabs | `LICENSE`, copied byte for byte; it is the license text of the two processors above |
| `public/voice/worklets/LICENSE-libsamplerate-js.md` | `@alexanderolsen/libsamplerate-js` | 2.1.2 | MIT, Copyright (c) 2021 Alexander Olsen, and BSD 2-Clause, Copyright (c) 2012-2016 Erik de Castro Lopo | `LICENSE.md`, copied byte for byte; the package publishes both texts in this one file |

The two processors are the ones ElevenLabs publishes for self-hosting the audio under a strict policy; the package
README documents the route with `workletPaths`, and its `LICENSE` is the MIT text copied next to them.

The resampler is the WebAssembly port of libsamplerate: the package publishes the MIT text of the wrapper and the
2-clause BSD notice of the C library it bundles in its single `LICENSE.md`, and it ships no separate file for the BSD
notice, so what travels here is that whole file (2,497 bytes, SHA-256
`69f1609423518937e0c70baade7a15e4eaaaee7109a8b0e793733b0f89ec6f72`). The `LICENSE` of `@elevenlabs/client` is
1,067 bytes, SHA-256 `0bfed2a2aa8d106bdb144f55416e193450fbc1e1b3257e3852bc64418069de5a`. The official sources of the
two licenses of the resampler:

- [`@alexanderolsen/libsamplerate-js`](https://github.com/aolsenjazz/libsamplerate-js) (MIT, Copyright (c) 2021
  Alexander Olsen); the license text of version 2.1.2 lives in the installed package and in its `LICENSE.md` of the
  repository.
- [libsamplerate](https://github.com/libsndfile/libsamplerate), the "Secret Rabbit Code" of Erik de Castro Lopo
  (2-clause BSD, Copyright (c) 2012-2016), also at <https://mega-nerd.com/SRC/>. The 2-clause BSD text is the second
  half of the `LICENSE.md` copied above.

`npm run worklets:voice` refreshes the three copies and the two license files from the installed packages, byte for
byte.

## The font, served from `public/fonts/outfit/`

| File served | Font and version | License | Origin |
| --- | --- | --- | --- |
| `public/fonts/outfit/outfit-latin.woff2` | Outfit, version 15 (v15), The Outfit Project Authors | SIL Open Font License 1.1 | `https://fonts.gstatic.com/s/outfit/v15/QGYvz_MVcBeNP4NJtEtq.woff2` |
| `public/fonts/outfit/outfit-latin-ext.woff2` | Outfit v15, The Outfit Project Authors | SIL Open Font License 1.1 | `https://fonts.gstatic.com/s/outfit/v15/QGYvz_MVcBeNP4NJuktqQ4E.woff2` |
| `public/fonts/outfit/OFL.txt` | Outfit v15, The Outfit Project Authors | SIL Open Font License 1.1 | `https://raw.githubusercontent.com/google/fonts/main/ofl/outfit/OFL.txt`, copied byte for byte; the family lives in the official `google/fonts` repository as `ofl/outfit/` |

The license text travels next to the two files, byte for byte from the official repository of Google Fonts; its
whitespace is the one the authors published. The family, the two subsets and the SHA-256 of each file are recorded in
`docs/design-system.md`, and `tests/design-system.test.ts` checks them.

## Code that is not a verbatim copy of a package

Some third-party code arrived adapted instead of copied, and it carries its license and its origin in the header of its
own file:

- `components/ui/orb.tsx` is the Orb of ElevenLabs UI (`elevenlabs/ui`,
  `apps/www/registry/elevenlabs-ui/ui/orb.tsx`), MIT, Copyright (c) 2025 Eleven Labs Inc., with the short list of
  changes its header declares.
- `components/voice/VoicePanel.tsx`, `components/voice/voice-orb.tsx`, `components/voice/voice-state.ts` and
  `components/voice/sources.ts` are ports of `components/voice/` of Construye (MIT, read only), each one with its
  origin in a header comment.

They have no row in the tables above because they are not byte-for-byte copies of an installed package: their license
and origin travel in the file itself, which is where a reader of that file finds them.

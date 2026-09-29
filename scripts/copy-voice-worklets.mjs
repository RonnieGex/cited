/**
 * Copies the audio worklets of the voice session into `public/voice/worklets/`, the static folder this origin serves
 * (`npm run worklets:voice`), with the license text of each package next to its copies.
 *
 * The copy is versioned on purpose: the page must have the audio of a device that needs a sample-rate conversion
 * without a build step and without a request to a CDN, which is what the policy of the site refuses. The two
 * processors are the ones `@elevenlabs/client` publishes under its stable `worklets/*` entrypoint (MIT, Copyright (c)
 * 2025 ElevenLabs), and the resampler is the `@alexanderolsen/libsamplerate-js` worklet the SDK asks jsDelivr for when
 * the session gives no path (MIT, Copyright (c) 2021 Alexander Olsen, plus the BSD 2-clause of the libsamplerate it
 * bundles). Their origin, version and licence are in `public/voice/worklets/README.md` and in
 * `THIRD_PARTY_NOTICES.md`; the license texts travel byte for byte from the installed packages, as the requirement
 * "What is copied from a package keeps its notice" asks.
 *
 * `tests/voice-worklets.test.tsx` and `tests/third-party-notices.test.ts` compare the copies with the installed
 * packages, so a stale copy fails the suite.
 */

import { createRequire } from "node:module";
import { copyFileSync, mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const target = join(root, "public", "voice", "worklets");

const sdk = dirname(dirname(require.resolve("@elevenlabs/client/worklets/rawAudioProcessor.js")));
const sampler = dirname(dirname(require.resolve("@alexanderolsen/libsamplerate-js/dist/libsamplerate.worklet.js")));

const copies = [
  {
    from: require.resolve("@elevenlabs/client/worklets/rawAudioProcessor.js"),
    to: "raw-audio-processor.js",
  },
  {
    from: require.resolve("@elevenlabs/client/worklets/audioConcatProcessor.js"),
    to: "audio-concat-processor.js",
  },
  {
    from: require.resolve("@alexanderolsen/libsamplerate-js/dist/libsamplerate.worklet.js"),
    to: "libsamplerate.worklet.js",
  },
  {
    from: join(sdk, "LICENSE"),
    to: "LICENSE-elevenlabs-client.md",
  },
  {
    from: join(sampler, "LICENSE.md"),
    to: "LICENSE-libsamplerate-js.md",
  },
];

mkdirSync(target, { recursive: true });

for (const copy of copies) {
  const destination = join(target, copy.to);

  copyFileSync(copy.from, destination);
  console.log(`${copy.to}: ${statSync(destination).size} bytes`);
}

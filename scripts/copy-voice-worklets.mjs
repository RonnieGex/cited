/**
 * Copies the audio worklets of the voice session into `public/voice/worklets/`, the static folder this origin serves
 * (`npm run worklets:voice`).
 *
 * The copy is versioned on purpose: the page must have the audio of a device that needs a sample-rate conversion
 * without a build step and without a request to a CDN, which is what the policy of the site refuses. The two
 * processors are the ones `@elevenlabs/client` publishes under its stable `worklets/*` entrypoint, and the resampler is
 * the `@alexanderolsen/libsamplerate-js` worklet the SDK asks jsDelivr for when the session gives no path. Both
 * packages are MIT and their origin, version and licence are in `public/voice/worklets/README.md`.
 *
 * `tests/voice-worklets.test.tsx` compares the copies with the installed packages, so a stale copy fails the suite.
 */

import { createRequire } from "node:module";
import { copyFileSync, mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const target = join(root, "public", "voice", "worklets");

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
];

mkdirSync(target, { recursive: true });

for (const copy of copies) {
  const destination = join(target, copy.to);

  copyFileSync(copy.from, destination);
  console.log(`${copy.to}: ${statSync(destination).size} bytes`);
}

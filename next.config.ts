import type { NextConfig } from "next";

// `npm run build:e2e` sets `KATALIS_VOICE_FAKE_SDK=1`, and this alias is what keeps every browser test away from the
// real agent: `@elevenlabs/react` resolves to `tests/fakes/elevenlabs-react.tsx`, which talks to nobody. A production
// build never resolves that file, and `scripts/verify-no-test-sdk.mjs` fails a build that carries its markers.
const fakeSdk = process.env.KATALIS_VOICE_FAKE_SDK === "1";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // `pdf-parse` is pdfjs and needs its own files at run time (the worker it loads to read a page). Bundled into the
  // server of a production build, it looks for `pdf.worker.mjs` inside `.next` and every PDF of the panel fails with
  // "Setting up fake worker failed". The package stays where npm installed it, which is where its worker is.
  serverExternalPackages: ["pdf-parse"],
  ...(fakeSdk
    ? {
        turbopack: {
          resolveAlias: {
            "@elevenlabs/react": "./tests/fakes/elevenlabs-react.tsx",
          },
        },
      }
    : {}),
};

export default nextConfig;

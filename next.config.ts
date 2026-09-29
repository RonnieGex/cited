import type { NextConfig } from "next";

// `npm run build:e2e` sets `KATALIS_VOICE_FAKE_SDK=1`, and this alias is what keeps every browser test away from the
// real agent: `@elevenlabs/react` resolves to `tests/fakes/elevenlabs-react.tsx`, which talks to nobody. A production
// build never resolves that file, and `scripts/verify-no-test-sdk.mjs` fails a build that carries its markers.
const fakeSdk = process.env.KATALIS_VOICE_FAKE_SDK === "1";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
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

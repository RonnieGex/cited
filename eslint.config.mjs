import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
    // The worklets of the voice session are copies of the installed packages, kept byte for byte by
    // `npm run worklets:voice` and compared with them by `tests/voice-worklets.test.tsx`: they are not ours to fix.
    "public/voice/worklets/**",
  ]),
]);

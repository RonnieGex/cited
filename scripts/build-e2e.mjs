// Builds the application the end-to-end suite drives: the same `next build` with `KATALIS_VOICE_FAKE_SDK=1`, which is
// what `next.config.ts` reads to resolve `@elevenlabs/react` to `tests/fakes/elevenlabs-react.tsx`. The guard runs
// right after the build, so the suite can never start against a build that would talk to the real agent.
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const next = resolve(root, "node_modules", "next", "dist", "bin", "next");

function run(command, args, env) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", env });

  return result.status ?? 1;
}

const build = run(process.execPath, [next, "build"], {
  ...process.env,
  KATALIS_VOICE_FAKE_SDK: "1",
});

if (build !== 0) {
  process.exit(build);
}

process.exit(
  run(process.execPath, [resolve(root, "scripts", "verify-no-test-sdk.mjs"), "--expect-test-sdk"], {
    ...process.env,
    KATALIS_VOICE_FAKE_SDK: "1",
  }),
);

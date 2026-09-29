// Fails a build whose browser output carries the deterministic test SDK of `tests/fakes/elevenlabs-react.tsx`, and
// fails a build of `npm run build:e2e` whose browser output does not carry it (or that carries the real package
// instead). `--expect-test-sdk` — or `KATALIS_VOICE_FAKE_SDK=1` — flips the expectation to the end-to-end build.
//
// The scope of a check is what the browser downloads (`.next/static`): the server output of this project legitimately
// names `api.elevenlabs.io`, because that is the API its routes call. The marker of the test SDK is looked for in the
// whole output, because a leak anywhere is a leak.
import { lstatSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const FAKE_MARKERS = ["__katalisVoiceFake", "failNextStart", "failEveryStart"];
const REAL_MARKER = "api.elevenlabs.io";
// The header of the provider: the browser of this project never sends it and no bundle may carry it.
const FORBIDDEN_MARKERS = ["xi-api-key"];
const ROOT = ".next";
const CLIENT_ROOT = join(".next", "static");
const SKIP_DIRECTORIES = new Set([".git"]);

const expectFake =
  process.argv.includes("--expect-test-sdk") || process.env.KATALIS_VOICE_FAKE_SDK === "1";

function* walk(root) {
  const stack = [root];

  while (stack.length > 0) {
    const current = stack.pop();
    let entries;

    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const path = join(current, entry.name);

      if (entry.isSymbolicLink()) {
        continue;
      }

      if (entry.isDirectory()) {
        if (!SKIP_DIRECTORIES.has(entry.name)) {
          stack.push(path);
        }

        continue;
      }

      if (entry.isFile()) {
        yield path;
      }
    }
  }
}

function exists(path) {
  try {
    lstatSync(path);

    return true;
  } catch {
    return false;
  }
}

function markersIn(path, markers) {
  let buffer;

  try {
    if (lstatSync(path).size > 512 * 1024 * 1024) {
      return [];
    }

    buffer = readFileSync(path);
  } catch {
    return [];
  }

  return markers.filter((marker) => buffer.includes(Buffer.from(marker, "utf8")));
}

function scan(root, markers) {
  const found = new Map();

  if (!exists(root)) {
    return found;
  }

  for (const file of walk(root)) {
    const hits = markersIn(file, markers);

    if (hits.length > 0) {
      found.set(file, hits);
    }
  }

  return found;
}

const fakeHits = scan(ROOT, FAKE_MARKERS);
const clientFake = scan(CLIENT_ROOT, FAKE_MARKERS);
const clientReal = scan(CLIENT_ROOT, [REAL_MARKER]);
const clientForbidden = scan(CLIENT_ROOT, FORBIDDEN_MARKERS);
const scanned = [ROOT, CLIENT_ROOT].filter(exists);

console.log(
  `verify-no-test-sdk: mode=${expectFake ? "test-build" : "production"} roots=${scanned.join(", ") || "none"}`,
);

if (exists(ROOT) === false) {
  console.error(`FAIL: ${ROOT} does not exist, so there is no build output to check.`);
  process.exit(1);
}

function list(found) {
  for (const [file, hits] of found) {
    console.error(`  ${file}: ${hits.join(", ")}`);
  }
}

if (clientForbidden.size > 0) {
  console.error("FAIL: the browser output carries the header of the provider.");
  list(clientForbidden);
  process.exit(1);
}

if (expectFake) {
  if (clientFake.size === 0) {
    console.error(
      "FAIL: the test build has no marker of the test SDK; the end-to-end suite would drive the real package.",
    );
    process.exit(1);
  }

  if (clientReal.size > 0) {
    console.error(`FAIL: the test build carries the real package (${REAL_MARKER}) in ${clientReal.size} file(s).`);
    list(clientReal);
    process.exit(1);
  }

  console.log(`OK: the test SDK is in the browser output (${clientFake.size} file(s)) and the real package is not.`);
  process.exit(0);
}

if (fakeHits.size > 0) {
  console.error("FAIL: the test SDK reached the output of the production build.");
  list(fakeHits);
  process.exit(1);
}

if (clientReal.size === 0) {
  console.error(
    `FAIL: the production build carries neither the test SDK nor the real package (${REAL_MARKER}).`,
  );
  process.exit(1);
}

console.log(`OK: no marker of the test SDK in the output; the real package is in ${clientReal.size} file(s).`);

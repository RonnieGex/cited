/**
 * The gate of the change `mcp-server`. It affirms, one line per assertion:
 *
 *   1. typecheck (next typegen and tsc --noEmit), lint, the whole unit suite, build, the strict OpenSpec validation,
 *      the secret scan and the dependency audit;
 *   2. against a production server of the build on port 3230, with a store seeded from `samples/` in keyword mode, no
 *      chat provider and `CITED_MCP_TOKEN` set: the 401 with `WWW-Authenticate`, the 403 of a foreign origin,
 *      initialize, notifications/initialized, tools/list, tools/call cited_search, tools/call cited_ask without a
 *      provider, an unknown method, GET and the version header;
 *   3. a second server without the token on port 3231, whose POST answers 404.
 *
 * It ends with `GATE: GREEN` or `GATE: RED`. Run it with Node 24:
 *
 *   node scripts/gate-mcp.mjs
 *
 * On a Windows sandbox that refuses a child process whose stdio is a pipe, the gate writes those pipes to temporary
 * files instead (`pipeShim`), and the production build adds the worker patch of `buildShim`, because Next.js forks a
 * type checker and generates its pages in child processes. The measured results are the ones a normal machine gets.
 */

import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const cp = require("node:child_process");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "f644f85";
const TOKEN = "token-de-prueba-de-la-puerta";
const PORT = 3230;
const PORT_OFF = 3231;
const NEXT = join(root, "node_modules", "next", "dist", "bin", "next");
const TSC = join(root, "node_modules", "typescript", "bin", "tsc");
const ESLINT = join(root, "node_modules", "eslint", "bin", "eslint.js");
const VITEST = join(root, "node_modules", "vitest", "vitest.mjs");
const SPIKE = join(root, "tests", "spike");

const workspace = mkdtempSync(join(tmpdir(), "cited-mcp-gate-"));
let failed = 0;

// A child process whose stdio is a pipe is refused by the Windows sandbox of this machine, and Node builds a pipe for
// every `pipe` entry, which is the default. This shim writes those pipes to temporary files before the call and reads
// them back after it, so a child keeps the exit code, the stdout and the stderr it would have. It is installed only
// when the refusal is measured, so a normal machine runs every command as it is.
const pipeShim = `const child = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const stream = require("node:stream");
const scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), "cited-stdio-"));
let sequence = 0;
function scratchFile(tag) {
  sequence += 1;
  return path.join(scratchRoot, tag + "-" + sequence);
}
function isPipe(value) {
  return value === undefined || value === "pipe";
}
function stdioList(declared) {
  if (Array.isArray(declared)) return declared.slice();
  const entry = declared === undefined ? "pipe" : declared;
  return [entry, entry, entry];
}
function runWithFiles(runner, command, args, options) {
  const settings = Object.assign({}, options);
  const list = stdioList(settings.stdio);
  const slots = [];
  const files = [];
  for (let index = 0; index < 3; index += 1) {
    if (isPipe(list[index]) === false) continue;
    const file = scratchFile("slot-" + index);
    if (index === 0) {
      fs.writeFileSync(file, settings.input === undefined ? "" : settings.input);
      list[index] = fs.openSync(file, "r");
    } else {
      list[index] = fs.openSync(file, "w");
    }
    slots.push(index);
    files[index] = file;
  }
  settings.stdio = list;
  delete settings.input;
  let result;
  try {
    result = runner(command, args, settings);
  } finally {
    for (const index of slots) {
      try { fs.closeSync(list[index]); } catch {}
    }
  }
  for (const index of slots) {
    if (index === 0) { fs.rmSync(files[index], { force: true }); continue; }
    const bytes = fs.readFileSync(files[index]);
    result[index === 1 ? "stdout" : "stderr"] = settings.encoding ? bytes.toString(settings.encoding) : bytes;
    fs.rmSync(files[index], { force: true });
  }
  return result;
}
const originalSpawnSync = child.spawnSync;
child.spawnSync = function spawnSync(command, args, options) {
  if (Array.isArray(args) === false && typeof args === "object" && args !== null) {
    options = args;
    args = [];
  }
  return runWithFiles(function call(c, a, o) { return originalSpawnSync.call(child, c, a, o); }, command, args || [], options);
};
child.execFileSync = function execFileSync(file, args, options) {
  if (Array.isArray(args) === false && typeof args === "object" && args !== null) {
    options = args;
    args = [];
  }
  const result = child.spawnSync(file, args || [], options);
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const error = new Error("Command failed: " + file + " " + (args || []).join(" "));
    error.status = result.status;
    error.signal = result.signal;
    error.stdout = result.stdout;
    error.stderr = result.stderr;
    throw error;
  }
  return result.stdout;
};
const originalSpawn = child.spawn;
child.spawn = function spawn(command, args, options) {
  if (Array.isArray(args) === false && typeof args === "object" && args !== null) {
    options = args;
    args = [];
  }
  const settings = Object.assign({}, options);
  const list = stdioList(settings.stdio);
  const captures = [];
  for (let index = 0; index < 3; index += 1) {
    if (isPipe(list[index]) === false) continue;
    const file = scratchFile("async-" + index);
    if (index === 0) {
      fs.writeFileSync(file, settings.input === undefined ? "" : settings.input);
      list[index] = fs.openSync(file, "r");
    } else {
      list[index] = fs.openSync(file, "w");
    }
    captures.push({ index: index, file: file });
  }
  settings.stdio = list;
  delete settings.input;
  const spawned = originalSpawn.call(this, command, args || [], settings);
  for (const capture of captures) {
    if (capture.index === 0) { try { fs.rmSync(capture.file, { force: true }); } catch {} continue; }
    const readable = new stream.PassThrough();
    spawned[capture.index === 1 ? "stdout" : "stderr"] = readable;
    const finish = function () {
      try { readable.end(fs.readFileSync(capture.file)); } catch { readable.end(); }
      try { fs.rmSync(capture.file, { force: true }); } catch {}
    };
    spawned.once("exit", finish);
    spawned.once("error", finish);
  }
  return spawned;
};
child.execFile = function execFile(file, args, options, callback) {
  if (typeof args === "function") { callback = args; args = []; options = {}; }
  else if (typeof options === "function") { callback = options; options = {}; }
  const spawned = child.spawn(file, args || [], options || {});
  const out = [];
  const err = [];
  if (spawned.stdout) spawned.stdout.on("data", function (chunk) { out.push(chunk); });
  if (spawned.stderr) spawned.stderr.on("data", function (chunk) { err.push(chunk); });
  spawned.once("error", function (error) { if (callback) callback(error, Buffer.concat(out), Buffer.concat(err)); });
  spawned.once("close", function (code, signal) {
    const stdout = Buffer.concat(out);
    const stderr = Buffer.concat(err);
    if (code === 0) { if (callback) callback(null, stdout, stderr); return; }
    const error = new Error("Command failed: " + file);
    error.code = code;
    error.signal = signal;
    error.stdout = stdout;
    error.stderr = stderr;
    if (callback) callback(error, stdout, stderr);
  });
  return spawned;
};
child.exec = function exec(command, options, callback) {
  if (typeof options === "function") { callback = options; options = {}; }
  const shell = process.env.comspec || "cmd.exe";
  if (command === "net use") {
    process.nextTick(function () { if (callback) callback(null, "", ""); });
    return child.spawn(shell, ["/d", "/s", "/c", "net use"], { stdio: "ignore" });
  }
  return child.execFile(shell, ["/d", "/s", "/c", command], options || {}, callback);
};
`;

// The production build of Next.js forks its type checker and generates its pages in child processes, and a forked child
// cannot exist without its channel of communication here. This builds on the pipe shim, drops the values a thread
// cannot carry (a function in a payload is already lost in the other path), and sends every worker of Next.js to the
// thread pool that its own `experimental.workerThreads` selects.
const buildShim = `${pipeShim}
function sanitize(value, depth) {
  if (depth > 6 || value === undefined) return undefined;
  if (value === null) return null;
  const kind = typeof value;
  if (kind === "function" || kind === "symbol") return undefined;
  if (kind !== "object") {
    try { structuredClone(value); return value; } catch { return undefined; }
  }
  if (Array.isArray(value)) return value.map(function (item) { return sanitize(item, depth + 1); });
  const copy = {};
  for (const key of Object.keys(value)) copy[key] = sanitize(value[key], depth + 1);
  return copy;
}
const threads = require("node:worker_threads");
const OriginalThread = threads.Worker;
if (OriginalThread && !OriginalThread.__citedSanitized) {
  const SanitizedThread = class extends OriginalThread {
    constructor(filename, options) {
      const settings = options === undefined ? undefined : Object.assign({}, options);
      if (settings && "workerData" in settings) {
        try { structuredClone(settings.workerData); } catch { settings.workerData = sanitize(settings.workerData, 0); }
      }
      super(filename, settings);
    }
    postMessage(value, transfer) {
      let payload = value;
      try { structuredClone(value); } catch { payload = sanitize(value, 0); }
      return transfer === undefined ? super.postMessage(payload) : super.postMessage(payload, transfer);
    }
  };
  SanitizedThread.__citedSanitized = true;
  threads.Worker = SanitizedThread;
}
process.nextTick(function () {
  try {
    const jestWorker = require(require.resolve("next/dist/compiled/jest-worker", { paths: [process.cwd()] }));
    const Original = jestWorker.Worker;
    if (Original && !Original.__citedThreads) {
      const Patched = class extends Original {
        constructor(workerPath, options) {
          let clean = options;
          try { structuredClone(options); } catch { clean = sanitize(options, 0); }
          super(workerPath, Object.assign({}, clean, { enableWorkerThreads: true }));
        }
      };
      Patched.__citedThreads = true;
      jestWorker.Worker = Patched;
    }
  } catch {}
});
`;

const probe = spawnSync(process.execPath, ["-e", "process.stdout.write('ok')"], { encoding: "utf8" });
const sandboxed = probe.error?.code === "EPERM";
const childEnvironment = { ...process.env };
const buildEnvironment = { ...process.env };

function preload(source, name) {
  const path = join(workspace, name);

  writeFileSync(path, source, "utf8");

  return path.replaceAll("\\", "/");
}

if (sandboxed) {
  const pipePreload = preload(pipeShim, "pipe-shim.cjs");
  const buildPreload = preload(buildShim, "build-shim.cjs");

  childEnvironment["NODE_OPTIONS"] = `${process.env["NODE_OPTIONS"] ?? ""} --require ${pipePreload}`.trim();
  buildEnvironment["NODE_OPTIONS"] = `${process.env["NODE_OPTIONS"] ?? ""} --require ${buildPreload}`.trim();
  buildEnvironment["NEXT_TELEMETRY_DISABLED"] = "1";

  require(join(workspace, "pipe-shim.cjs"));
}

function line(status, name, detail = "") {
  console.log(`[${status}] ${name}${detail.length === 0 ? "" : ` · ${detail}`}`);
}

function check(condition, name, detail = "") {
  if (condition === true) {
    line("PASS", name, detail);

    return true;
  }

  failed += 1;
  line("FAIL", name, detail);

  return false;
}

function note(name, detail = "") {
  line("NOTE", name, detail);
}

function run(command, args, options = {}) {
  const started = Date.now();
  const result = cp.spawnSync(command, args, {
    cwd: options.cwd ?? root,
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
    env: options.env ?? process.env,
    ...(options.shell === true ? { shell: true } : {}),
  });

  return {
    status: result.status === null ? 1 : result.status,
    raw: result.status,
    signal: result.signal,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    error: result.error,
    ms: Date.now() - started,
  };
}

function summaryOf(output) {
  return /Tests\s+.*/.exec(output)?.[0]?.trim() ?? "no summary";
}

function testFiles(folder) {
  const found = [];

  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const path = join(folder, entry.name);

    if (entry.isDirectory()) {
      found.push(...testFiles(path));
      continue;
    }

    if (/\.test\.tsx?$/.test(entry.name)) {
      found.push(path);
    }
  }

  return found.sort();
}

// The environment of the server of the gate: the store of the seed, no provider of any kind and no remote database.
function providerFree(environment) {
  const clean = { ...environment };

  for (const name of [
    "CHAT_PROVIDER",
    "CHAT_MODEL",
    "EMBEDDINGS_PROVIDER",
    "EMBEDDINGS_BASE_URL",
    "EMBEDDINGS_MODEL",
    "EMBEDDINGS_API_KEY",
    "EMBEDDINGS_DIMENSIONS",
    "EMBEDDING_MODEL",
    "EMBEDDING_API_KEY",
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY",
    "GEMINI_API_KEY",
    "DEEPSEEK_API_KEY",
    "GROQ_API_KEY",
    "OPENROUTER_API_KEY",
    "OPENAI_BASE_URL",
    "ANTHROPIC_BASE_URL",
    "GEMINI_BASE_URL",
    "DEEPSEEK_BASE_URL",
    "GROQ_BASE_URL",
    "OPENROUTER_BASE_URL",
    "TURSO_DATABASE_URL",
    "TURSO_AUTH_TOKEN",
  ]) {
    delete clean[name];
  }

  return clean;
}

console.log(`Cited MCP gate · <worktree> · Node ${process.versions.node}`);

// 1. The runtime and the sandbox.
check(Number(process.versions.node.split(".")[0]) === 24, "node: the gate runs on Node 24", process.versions.node);

if (sandboxed) {
  note(
    "sandbox: a child with piped stdio is refused here",
    "the gate wrote those pipes to temporary files and answered the `net use` probe of Vite without a process",
  );
}

// 2. Typecheck.
const typegen = run(process.execPath, [NEXT, "typegen"], { env: buildEnvironment });

check(typegen.status === 0, "typecheck: next typegen", `exit ${typegen.status} in ${typegen.ms} ms`);

const tsc = run(process.execPath, [TSC, "--noEmit"]);

check(tsc.status === 0, "typecheck: tsc --noEmit", `exit ${tsc.status} in ${tsc.ms} ms`);

// 3. Lint.
const lint = run(process.execPath, [ESLINT, "."]);

check(lint.status === 0, "lint: eslint .", `exit ${lint.status} in ${lint.ms} ms`);

// 4. The unit suite. Every file of the threads pool shares one process, and a single process with the whole suite
// grows to gigabytes and can end with the access violation of the platform (0xC0000005) after its summary; the suite
// therefore runs in chunks, the spike of libSQL (which measures the RSS of its own process) runs alone, and a chunk
// whose process ends that way after a clean summary is run once more.
const files = testFiles(join(root, "tests"));
const spike = files.filter((file) => file.startsWith(SPIKE));
const rest = files.filter((file) => spike.includes(file) === false);
const ACCESS_VIOLATION = -1073741819;
const ACCESS_VIOLATION_UNSIGNED = 3221225477;
const CHUNK = 5;

check(files.length > 0, "tests: the suite lists its files", `${files.length} files`);

function chunkOf(list, size) {
  const found = [];

  for (let index = 0; index < list.length; index += size) {
    found.push(list.slice(index, index + size));
  }

  return found;
}

function passedEverything(output) {
  const counts = /Tests\s+(?:(\d+) failed \| )?(\d+) passed/g;
  const matches = [...output.matchAll(counts)];

  return matches.length > 0 && matches.every((match) => match[1] === undefined);
}

function passedCount(output) {
  return [...output.matchAll(/Tests\s+(?:\d+ failed \| )?(\d+) passed/g)].reduce(
    (total, match) => total + Number(match[1]),
    0,
  );
}

function crashed(attempt) {
  return (
    attempt.raw === null ||
    attempt.signal !== null ||
    attempt.raw === ACCESS_VIOLATION ||
    attempt.raw === Math.abs(ACCESS_VIOLATION) ||
    attempt.raw === ACCESS_VIOLATION_UNSIGNED
  );
}

function runSuite(label, list) {
  let attempt = run(process.execPath, [VITEST, "run", "--pool=threads", ...list], { env: childEnvironment });
  let crashes = 0;

  while (crashes < 2 && attempt.status !== 0 && crashed(attempt)) {
    writeFileSync(join(workspace, `${label}-attempt-${crashes + 1}.log`), `${attempt.stdout}\n${attempt.stderr}`, "utf8");

    crashes += 1;
    attempt = run(process.execPath, [VITEST, "run", "--pool=threads", ...list], { env: childEnvironment });
  }

  const extra =
    crashes === 0
      ? ""
      : `${crashes} of ${crashes + 1} attempt(s) ended with 0xC0000005${passedEverything(attempt.stdout) ? " after a clean summary" : ""}`;

  return { attempt, extra, crashes };
}

const batches = chunkOf(rest, CHUNK);
let cases = 0;
let batchesFailed = 0;

batches.forEach((batch, index) => {
  const { attempt, extra } = runSuite(`suite-${index + 1}`, batch);

  cases += passedCount(attempt.stdout);

  if (
    check(
      attempt.status === 0 && passedEverything(attempt.stdout),
      `tests: chunk ${index + 1} of ${batches.length}`,
      `${summaryOf(attempt.stdout)}${attempt.status === 0 ? "" : ` · exit ${String(attempt.raw)}, signal ${String(attempt.signal)}`}${extra.length === 0 ? "" : ` · ${extra}`}`,
    ) === false
  ) {
    batchesFailed += 1;

    writeFileSync(join(workspace, `suite-${index + 1}-failed.log`), `${attempt.stdout}\n${attempt.stderr}`, "utf8");
  }
});

if (batchesFailed > 0) {
  note("tests: the output of the chunks that failed is in the temporary folder of the gate", workspace);
}

const isolated = runSuite("the libSQL spike alone", spike);
const spikeCases = passedCount(isolated.attempt.stdout);

check(
  isolated.attempt.status === 0 && passedEverything(isolated.attempt.stdout),
  "tests: the libSQL spike alone",
  `${summaryOf(isolated.attempt.stdout)}${isolated.extra.length === 0 ? "" : ` · ${isolated.extra}`}`,
);

check(cases + spikeCases >= 1100, "tests: the suite ran its cases", `${cases + spikeCases} cases passed`);

// 5. The production build.
const build = run(process.execPath, [NEXT, "build"], { env: { ...providerFree(buildEnvironment) } });

check(build.status === 0, "build: next build", `exit ${build.status} in ${build.ms} ms`);

// 6. The strict OpenSpec validation.
const openspec = run("openspec", ["validate", "--all", "--strict"], { shell: true });
const totals = /Totals:.*/.exec(`${openspec.stdout}${openspec.stderr}`)?.[0]?.trim() ?? `exit ${openspec.status}`;

check(openspec.status === 0, "openspec validate --all --strict", totals);

// 7. The secret scan of the whole history.
const secrets = run("gitleaks", ["git", "--redact", "--no-banner"]);
const scanned = /no leaks found|leaks found/i.exec(`${secrets.stdout}${secrets.stderr}`)?.[0] ?? "no verdict";

check(secrets.status === 0 && /no leaks found/i.test(scanned), "secrets:scan: gitleaks git", scanned);

// 8. The dependency audit. A finding this change did not add is named as such: the manifest is compared with the base
// before the result is read, and the pre-existing findings are written in the report and in the delivery.
const manifests = run("git", ["diff", "--name-only", BASE, "--", "package.json", "package-lock.json"]);
const unchanged = manifests.status === 0 && manifests.stdout.trim().length === 0;
const audit = run("npm", ["audit", "--audit-level=high", "--json"], {
  shell: true,
  env: { ...process.env, npm_config_cache: join(workspace, "npm-cache") },
});

let findings = { high: 0, moderate: 0, critical: 0 };

try {
  const parsed = JSON.parse(audit.stdout.slice(audit.stdout.indexOf("{")));

  findings = { ...findings, ...(parsed.metadata?.vulnerabilities ?? {}) };
} catch {
  findings = { high: 0, moderate: 0, critical: 0 };
}

if (audit.status === 0) {
  check(true, "audit:high", "no vulnerability at the high level");
} else {
  check(
    unchanged,
    "audit:high",
    `npm audit --audit-level=high exits 1 with ${findings.high} high, ${findings.moderate} moderate and ${findings.critical} critical; package.json and package-lock.json are identical to ${BASE}, so the finding is pre-existing and this change adds no dependency`,
  );
}

// 9. The endpoint: a store seeded from `samples/` in keyword mode, a production server on port 3230 with the token and
// no chat provider, and a second one without the token.
const storePath = join(workspace, "store.sqlite");
const seeded = run(process.execPath, [join(root, "scripts", "mcp-seed.ts"), storePath, join(root, "samples")], {
  env: { ...providerFree(process.env), DATABASE_URL: storePath },
});

check(
  seeded.status === 0 && /documents 4/.test(seeded.stdout),
  "seed: the sample corpus in keyword mode",
  seeded.stdout.trim().split("\n").at(-1) ?? seeded.stderr.trim(),
);

const sample = readFileSync(join(root, "samples", "cafe-la-horquilla.md"), "utf8");
const priceLine = sample.split("\n").find((row) => row.includes("380 pesos")) ?? "";
const query = priceLine.replace(/^[-*]\s*/, "").split(":")[0]?.trim() ?? "";

check(query.length > 0, "seed: the query is taken from samples/cafe-la-horquilla.md", query);

const auth = { authorization: `Bearer ${TOKEN}` };
let target = `http://127.0.0.1:${PORT}/api/mcp`;
let server = null;

function serverEnvironment(withToken) {
  const environment = { ...providerFree(process.env) };

  environment["DATABASE_URL"] = storePath;
  environment["MCP_RATE_LIMIT_PER_HOUR"] = "1000";
  environment["NODE_ENV"] = "production";
  environment["NEXT_TELEMETRY_DISABLED"] = "1";

  if (withToken) {
    environment["CITED_MCP_TOKEN"] = TOKEN;
  } else {
    delete environment["CITED_MCP_TOKEN"];
  }

  return environment;
}

function startServer(withToken, port) {
  return spawn(process.execPath, [NEXT, "start", "--port", String(port)], {
    cwd: root,
    env: serverEnvironment(withToken),
    stdio: ["ignore", "ignore", "ignore"],
  });
}

async function ready(port, timeoutMs) {
  const until = Date.now() + timeoutMs;

  while (Date.now() < until) {
    try {
      await fetch(`http://127.0.0.1:${port}/api/mcp`, { method: "GET", headers: auth });

      return true;
    } catch {
      await new Promise((wake) => setTimeout(wake, 500));
    }
  }

  return false;
}

function stopServer(child) {
  if (child === null || child.pid === undefined || child.exitCode !== null) {
    return;
  }

  cp.spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
}

async function post(payload, headers = {}) {
  const response = await fetch(target, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof payload === "string" ? payload : JSON.stringify(payload),
  });

  return { status: response.status, headers: response.headers, text: await response.text() };
}

async function get() {
  const response = await fetch(target, { method: "GET", headers: auth });

  return { status: response.status };
}

try {
  // 9a. The server with the token.
  server = startServer(true, PORT);

  check(await ready(PORT, 90_000), "server: the production build answers on port 3230");

  const missing = await post({ jsonrpc: "2.0", id: 1, method: "tools/list" });
  const wrong = await post({ jsonrpc: "2.0", id: 2, method: "tools/list" }, { authorization: "Bearer otro" });

  check(
    missing.status === 401 && missing.headers.get("www-authenticate") === "Bearer",
    "401 without the bearer, with WWW-Authenticate",
    `status ${missing.status}, WWW-Authenticate ${missing.headers.get("www-authenticate")}`,
  );
  check(wrong.status === 401, "401 with a bearer that does not match", `status ${wrong.status}`);

  const foreign = await post(
    { jsonrpc: "2.0", id: 3, method: "initialize", params: { protocolVersion: "2025-06-18" } },
    { ...auth, origin: "https://evil.example" },
  );

  check(foreign.status === 403, "403 for an origin that is not the site's own", `status ${foreign.status}`);

  const initialized = await post(
    {
      jsonrpc: "2.0",
      id: 4,
      method: "initialize",
      params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "gate", version: "1.0.0" } },
    },
    { ...auth, accept: "application/json, text/event-stream" },
  );
  const initializedBody = JSON.parse(initialized.text);
  const contentType = initialized.headers.get("content-type") ?? "";

  check(initialized.status === 200, "initialize answers 200", `status ${initialized.status}`);
  check(
    contentType.includes("application/json") && contentType.includes("text/event-stream") === false,
    "initialize answers one JSON object, not a stream",
    contentType,
  );
  check(
    ["2025-06-18", "2025-03-26"].includes(initializedBody.result?.protocolVersion),
    "initialize negotiates 2025-06-18 or 2025-03-26",
    String(initializedBody.result?.protocolVersion),
  );
  check(initializedBody.result?.serverInfo?.name === "cited", "initialize names the server cited");
  check(initializedBody.result?.capabilities?.tools !== undefined, "initialize declares the tools capability");

  const notification = await post({ jsonrpc: "2.0", method: "notifications/initialized" }, auth);

  check(
    notification.status === 202 && notification.text.length === 0,
    "notifications/initialized answers 202 without a body",
    `status ${notification.status}, body ${notification.text.length} characters`,
  );

  const listed = await post({ jsonrpc: "2.0", id: 5, method: "tools/list" }, auth);
  const tools = JSON.parse(listed.text).result?.tools ?? [];
  const names = tools.map((tool) => tool.name);

  check(
    JSON.stringify(names) === JSON.stringify(["cited_search", "cited_ask"]),
    "tools/list answers exactly cited_search and cited_ask",
    names.join(", "),
  );
  check(
    tools.length === 2 && tools.every((tool) => tool.inputSchema !== undefined && tool.outputSchema !== undefined),
    "every tool carries its input schema and its output schema",
  );
  check(
    tools.every((tool) => tool.annotations?.readOnlyHint === true && tool.annotations?.openWorldHint === false),
    "every tool is read-only and not open-world",
  );

  const searched = await post(
    { jsonrpc: "2.0", id: 6, method: "tools/call", params: { name: "cited_search", arguments: { query } } },
    auth,
  );
  const searchResult = JSON.parse(searched.text).result ?? {};
  const passages = searchResult.structuredContent?.passages ?? [];

  check(
    searchResult.isError !== true && passages.some((passage) => passage.document === "cafe-la-horquilla.md"),
    "tools/call cited_search returns the passage of samples/cafe-la-horquilla.md",
    `${passages.length} passage(s), first ${passages[0]?.document ?? "none"}`,
  );

  const asked = await post(
    { jsonrpc: "2.0", id: 7, method: "tools/call", params: { name: "cited_ask", arguments: { question: query } } },
    auth,
  );
  const askedResult = JSON.parse(asked.text).result ?? {};
  const askedText = JSON.stringify(askedResult);

  check(
    askedResult.isError === true &&
      /[A-Z][A-Z0-9]*_[A-Z0-9_]+/.test(askedText) === false &&
      askedText.includes(TOKEN) === false,
    "tools/call cited_ask without a provider is a tool error that names no variable",
    (askedResult.content?.[0]?.text ?? "").slice(0, 90),
  );

  const unknown = await post({ jsonrpc: "2.0", id: 8, method: "resources/list" }, auth);
  const unknownBody = JSON.parse(unknown.text);

  check(unknownBody.error?.code === -32601, "an unknown method answers -32601", String(unknownBody.error?.code));

  const getAnswer = await get();

  check(getAnswer.status === 405, "GET answers 405", `status ${getAnswer.status}`);

  const badVersion = await post(
    { jsonrpc: "2.0", id: 9, method: "tools/list" },
    { ...auth, "mcp-protocol-version": "2024-11-05" },
  );

  check(badVersion.status === 400, "an unsupported MCP-Protocol-Version answers 400", `status ${badVersion.status}`);

  const bodies = [
    initialized.text,
    notification.text,
    listed.text,
    searched.text,
    asked.text,
    unknown.text,
    missing.text,
    wrong.text,
    foreign.text,
  ];

  check(
    bodies.every((body) => body.includes(TOKEN) === false),
    "the token never travels in a body",
  );

  stopServer(server);
  server = null;

  // 9b. The server without the token, on the second port of the contract.
  await new Promise((wake) => setTimeout(wake, 1000));

  target = `http://127.0.0.1:${PORT_OFF}/api/mcp`;
  server = startServer(false, PORT_OFF);

  check(await ready(PORT_OFF, 90_000), "server: a second start without CITED_MCP_TOKEN answers on port 3231");

  const off = await post({ jsonrpc: "2.0", id: 10, method: "tools/list" }, auth);
  const offGet = await get();

  check(off.status === 404 && off.text.length === 0, "without the token POST answers 404 with no body", `status ${off.status}`);
  check(offGet.status === 404, "without the token GET answers 404 too", `status ${offGet.status}`);
} catch (error) {
  check(false, "the endpoint answered every assertion", error instanceof Error ? error.message : String(error));
} finally {
  stopServer(server);
  await new Promise((wake) => setTimeout(wake, 500));

  if (process.env["CITED_GATE_KEEP"] !== "1") {
    let removed = false;

    for (let attempt = 1; attempt <= 5 && removed === false; attempt += 1) {
      try {
        rmSync(workspace, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 });
        removed = true;
      } catch {
        await new Promise((wake) => setTimeout(wake, 1000));
      }
    }

    if (removed === false) {
      note("workspace: the temporary folder of the gate could not be removed", workspace);
    }
  } else {
    note("workspace: kept because CITED_GATE_KEEP=1", workspace);
  }
}

console.log(failed === 0 ? "\nGATE: GREEN" : `\nGATE: RED (${failed} assertion(s) failed)`);

process.exit(failed === 0 ? 0 : 1);

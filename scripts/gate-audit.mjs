// The gate of the change `audit-exceptions`: it affirms the type check, the lint, the unit suite, the build, the
// strict OpenSpec validation, the secret scan, the guard of `npm run audit:high`, the production audit, the contract
// of the fix and the guard against every red fixture. One line per statement and `GATE: GREEN` or `GATE: RED`.
//
//     node scripts/gate-audit.mjs
//     node scripts/gate-audit.mjs --shim <file>   (a sandbox of Windows that forbids a pipe in the stdio of a child)
import { spawnSync } from "node:child_process";
import { closeSync, existsSync, fstatSync, mkdtempSync, openSync, readFileSync, readSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURES = join(ROOT, "tests", "fixtures", "audit");
const DAY = "2026-10-09";
const CRASHES = new Set([3221225477, 3221226505, -1073741819, -1073740791]);
const statements = [];

function parse(argv) {
  const options = { shim: null };

  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--shim") {
      options.shim = argv[index + 1] ?? null;
      index += 1;
    } else {
      throw new Error(`unknown argument: ${argv[index]}`);
    }
  }

  return options;
}

function say(state, message) {
  console.log(`${state.padEnd(5)} ${message}`);

  statements.push({ state, message });
}

// Reads what a child process wrote through `descriptor`, from the start, through the same descriptor that was opened:
// the path is never opened twice, so the file cannot change between a check and the read (CodeQL js/file-system-race).
function readDescriptor(descriptor) {
  const size = fstatSync(descriptor).size;
  const buffer = Buffer.alloc(size);
  let offset = 0;

  while (offset < size) {
    const read = readSync(descriptor, buffer, offset, size - offset, offset);

    if (read === 0) {
      break;
    }

    offset += read;
  }

  return buffer.subarray(0, offset).toString("utf8");
}

function captured(command, args) {
  const directory = mkdtempSync(join(tmpdir(), "gate-audit-"));
  const file = join(directory, "output.txt");
  const descriptor = openSync(file, "w+");
  let ran;
  let output;

  try {
    ran = spawnSync(command, args, { cwd: ROOT, env: process.env, stdio: ["ignore", descriptor, descriptor] });
    output = readDescriptor(descriptor);
  } finally {
    closeSync(descriptor);
  }

  rmSync(directory, { recursive: true, force: true });

  return { status: ran.status, output, error: ran.error };
}

function inherited(command, args, env = process.env) {
  const ran = spawnSync(command, args, { cwd: ROOT, env, stdio: "inherit" });

  return { status: ran.status, error: ran.error };
}

function verdictOf(ran) {
  if (ran.error !== undefined && ran.error !== null) {
    return `could not run (${ran.error.code ?? ran.error.message})`;
  }

  return `exit ${ran.status}`;
}

// `npm` is a `.cmd` on Windows, and Node refuses to start it without a shell. The command line of the npm that runs
// this script is spawned with the running node, the same way `scripts/audit-high.mjs` does it.
function npmCommandLine() {
  const fromTheScript = process.env.npm_execpath;
  const candidates = [
    typeof fromTheScript === "string" && fromTheScript.endsWith(".js") ? fromTheScript : null,
    join(dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js"),
    join(dirname(process.execPath), "..", "lib", "node_modules", "npm", "bin", "npm-cli.js"),
  ];

  for (const candidate of candidates) {
    if (candidate !== null && existsSync(candidate)) {
      return resolve(candidate);
    }
  }

  throw new Error("the npm command line was not found next to the running node");
}

function check(name, ran) {
  say(ran.status === 0 ? "PASS" : "FAIL", `${name}: ${verdictOf(ran)}`);

  return ran.status === 0;
}

function checkNpm(name, args) {
  return check(name, inherited(process.execPath, [npmCommandLine(), ...args]));
}

// The build of Next.js spawns `tsc` and its workers with a pipe, which the sandbox of this session denies. The
// preload of the shim replaces the pipe with a file and turns the fork of a worker into a worker thread, so the
// build runs with the same command and the same tree.
function checkTheBuild() {
  if (options.shim === null) {
    return checkNpm("build", ["run", "build"]);
  }

  const ran = inherited(process.execPath, [npmCommandLine(), "run", "build"], {
    ...process.env,
    NODE_OPTIONS: `--require=${options.shim}`,
  });

  if (ran.status !== 0) {
    say("FAIL", `build with the sandbox preload: ${verdictOf(ran)}`);

    return false;
  }

  say("PASS", "build with the sandbox preload: exit 0");

  return true;
}

function vitest(reportFile, extra, preload) {
  const args = [
    ...(preload === null ? [] : ["--require", preload]),
    join("node_modules", "vitest", "vitest.mjs"),
    "run",
    "--reporter=json",
    `--outputFile=${reportFile}`,
    ...extra,
  ];
  const ran = inherited(process.execPath, args);
  let report = null;

  // Read without checking first: a missing or partial report is the same null, and there is no window between a check
  // and the read for the file to change (CodeQL js/file-system-race).
  try {
    report = JSON.parse(readFileSync(reportFile, "utf8"));
  } catch {
    report = null;
  }

  return { status: ran.status, report };
}

function countsOf(report, files) {
  return `${report.numPassedTests ?? 0} of ${report.numTotalTests ?? 0} tests in ${files} files`;
}

function testFilesUnder(directory) {
  const found = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolute = join(directory, entry.name);

    if (entry.isDirectory()) {
      found.push(...testFilesUnder(absolute));
    } else if (/\.test\.tsx?$/.test(entry.name)) {
      found.push(relative(ROOT, absolute).replaceAll("\\", "/"));
    }
  }

  return found.sort();
}

function unitTests() {
  const directory = mkdtempSync(join(tmpdir(), "gate-vitest-"));
  const plain = vitest(join(directory, "plain.json"), [], null);

  if (plain.status === 0 && plain.report?.success === true) {
    rmSync(directory, { recursive: true, force: true });
    say("PASS", `unit suite: ${countsOf(plain.report, plain.report.numTotalTestSuites ?? 0)}`);

    return true;
  }

  if (options.shim === null) {
    rmSync(directory, { recursive: true, force: true });
    say("FAIL", `unit suite: ${verdictOf(plain)}`);

    return false;
  }

  // The sandbox of this session forbids a pipe in the stdio of a child, so Vitest cannot use its pool of processes:
  // it runs with the pool of worker threads and the preload. A process that carries too many files sometimes dies at
  // its close with the status 0xC0000005 of a Node teardown, so a group that dies runs again in halves, which is the
  // same tree with the same isolation. `tests/spike/libsql-capabilities.test.ts` measures the memory of its own
  // process and it runs alone, because a process that already ran other files cannot stay under the ceiling it
  // asserts.
  say("WARN", "unit suite: the sandbox forbids the pipe of a child, so the suite runs with the threads pool and the preload");

  const shim = options.shim;
  const pooled = ["--pool=threads", `--execArgv=--require=${shim}`];
  const alone = "tests/spike/libsql-capabilities.test.ts";
  const files = testFilesUnder(join(ROOT, "tests")).filter((file) => file !== alone);
  const groups = [];

  for (let index = 0; index < files.length; index += 16) {
    groups.push(files.slice(index, index + 16));
  }

  const runGroup = (group, name) => {
    const ran = vitest(join(directory, `${name}.json`), [...pooled, ...group], shim);
    const good = ran.status === 0 && ran.report?.success === true;

    if (good) {
      say("PASS", `unit suite, ${name} (${group.length} files): ${countsOf(ran.report, group.length)}`);

      return { ok: true, passed: ran.report.numPassedTests ?? 0, total: ran.report.numTotalTests ?? 0 };
    }

    if (group.length > 1 && (ran.report === null || CRASHES.has(Number(ran.status)))) {
      say("WARN", `unit suite, ${name} died at its close (${verdictOf(ran)}); the same files run again in halves`);

      const half = Math.ceil(group.length / 2);
      const first = runGroup(group.slice(0, half), `${name}-a`);
      const second = runGroup(group.slice(half), `${name}-b`);

      return {
        ok: first.ok && second.ok,
        passed: first.passed + second.passed,
        total: first.total + second.total,
      };
    }

    say("FAIL", `unit suite, ${name} (${group.length} files): ${verdictOf(ran)}`);

    return { ok: false, passed: 0, total: 0 };
  };

  let ok = true;
  let passed = 0;
  let total = 0;

  groups.forEach((group, index) => {
    const ran = runGroup(group, `group ${index + 1} of ${groups.length}`);

    ok = ok && ran.ok;
    passed += ran.passed;
    total += ran.total;
  });

  const spike = vitest(join(directory, "spike.json"), [...pooled, alone], shim);
  const spikeOk = spike.status === 0 && spike.report?.success === true;

  ok = ok && spikeOk;

  if (spikeOk) {
    passed += spike.report.numPassedTests ?? 0;
    total += spike.report.numTotalTests ?? 0;
  }

  say(
    spikeOk ? "PASS" : "FAIL",
    `unit suite, the spike alone (${alone}): ${spikeOk ? countsOf(spike.report, 1) : verdictOf(spike)}`,
  );

  rmSync(directory, { recursive: true, force: true });

  if (ok) {
    say("PASS", `unit suite in this sandbox: ${passed} of ${total} tests of ${files.length + 1} files`);
  }

  return ok;
}

function contractOfTheFix() {
  const manifest = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  const lock = JSON.parse(readFileSync(join(ROOT, "package-lock.json"), "utf8"));
  const installed = JSON.parse(readFileSync(join(ROOT, "node_modules", "source-map-js", "package.json"), "utf8"));
  const locked = lock.packages?.["node_modules/source-map-js"]?.version ?? null;
  const overridden = manifest.overrides?.["source-map-js"] ?? null;
  const problems = [];

  if (installed.version !== "1.2.2" || locked !== "1.2.2" || overridden !== "1.2.2") {
    problems.push(`source-map-js is ${installed.version} installed, ${String(locked)} in the lock and ${String(overridden)} in the overrides`);
  }

  if (manifest.dependencies?.next !== "16.4.0") {
    problems.push(`next is ${String(manifest.dependencies?.next)}`);
  }

  if (manifest.devDependencies?.["eslint-config-next"] !== "16.4.0") {
    problems.push(`eslint-config-next is ${String(manifest.devDependencies?.["eslint-config-next"])}`);
  }

  if (manifest.scripts?.["audit:high"] !== "node scripts/audit-high.mjs") {
    problems.push(`the script audit:high is ${String(manifest.scripts?.["audit:high"])}`);
  }

  const pipeline = readFileSync(join(ROOT, ".github", "workflows", "ci.yml"), "utf8");

  if (pipeline.includes("npm run audit:high") === false) {
    problems.push("the job Dependency audit of .github/workflows/ci.yml does not call npm run audit:high");
  }

  say(
    problems.length === 0 ? "PASS" : "FAIL",
    `the fix of the contract: source-map-js 1.2.2, next 16.4.0 and the pipeline calling the guard${problems.length === 0 ? "" : `: ${problems.join("; ")}`}`,
  );

  return problems.length === 0;
}

function guardOfFixtures() {
  const command = (audit, productionAudit, exceptions) => [
    join("scripts", "audit-high.mjs"),
    "--audit-file",
    join(FIXTURES, audit),
    "--prod-audit-file",
    join(FIXTURES, productionAudit),
    "--prod-tree-file",
    join(FIXTURES, "production-tree.json"),
    "--exceptions-file",
    join(FIXTURES, exceptions),
    "--today",
    DAY,
  ];
  const happy = captured(process.execPath, command("tree-of-head.json", "production-clean.json", "exceptions-of-braces.json"));
  const happyOk = happy.status === 0 && happy.output.includes("AUDIT: PASS");

  say(happyOk ? "PASS" : "FAIL", `the guard with a tree of current exceptions: ${verdictOf(happy)}${happyOk ? "" : ` ${happy.output.trim()}`}`);

  const red = [
    {
      name: "the measured base (source-map-js with no entry)",
      audit: "tree-of-f644f85.json",
      productionAudit: "production-clean.json",
      exceptions: "exceptions-of-braces.json",
      names: "GHSA-68fv-2mgg-jv7q",
    },
    {
      name: "a new advisory",
      audit: "tree-with-a-new-advisory.json",
      productionAudit: "production-clean.json",
      exceptions: "exceptions-of-braces.json",
      names: "GHSA-aaaa-bbbb-cccc",
    },
    {
      name: "a finding of the production tree",
      audit: "tree-of-head.json",
      productionAudit: "production-of-f644f85.json",
      exceptions: "exceptions-of-braces.json",
      names: "GHSA-68fv-2mgg-jv7q",
    },
    {
      name: "an expired entry",
      audit: "tree-of-head.json",
      productionAudit: "production-clean.json",
      exceptions: "exceptions-expired.json",
      names: "2026-10-08",
    },
    {
      name: "an entry of 45 days",
      audit: "tree-of-head.json",
      productionAudit: "production-clean.json",
      exceptions: "exceptions-that-ask-45-days.json",
      names: "45 days",
    },
    {
      name: "an entry of a package of the production tree",
      audit: "tree-without-high.json",
      productionAudit: "production-clean.json",
      exceptions: "exceptions-of-a-production-package.json",
      names: "postcss",
    },
    {
      name: "an entry without its evidence",
      audit: "tree-of-head.json",
      productionAudit: "production-clean.json",
      exceptions: "exceptions-without-evidence.json",
      names: "no evidence",
    },
    {
      name: "a malformed entry",
      audit: "tree-without-high.json",
      productionAudit: "production-clean.json",
      exceptions: "exceptions-malformed.json",
      names: "no GHSA identifier",
    },
    {
      name: "a payload that is not an audit",
      audit: "not-an-audit-payload.json",
      productionAudit: "production-clean.json",
      exceptions: "exceptions-of-braces.json",
      names: "not a payload of npm audit",
    },
  ];

  let ok = happyOk;

  for (const fixture of red) {
    const ran = captured(process.execPath, command(fixture.audit, fixture.productionAudit, fixture.exceptions));
    const failed = ran.status === 1 && ran.output.includes("AUDIT: FAIL") && ran.output.includes(fixture.names);

    ok = ok && failed;

    say(failed ? "PASS" : "FAIL", `the guard fails with ${fixture.name}: ${verdictOf(ran)}${failed ? "" : ` ${ran.output.trim()}`}`);
  }

  return ok;
}

let options;

try {
  options = parse(process.argv.slice(2));
} catch (error) {
  console.log(`FAIL  ${error.message}`);
  console.log("GATE: RED");
  process.exit(1);
}

console.log(`gate-audit · node ${process.version} · ${process.platform}`);

const checks = [
  checkNpm("typecheck", ["run", "typecheck"]),
  checkNpm("lint", ["run", "lint"]),
  unitTests(),
  checkTheBuild(),
  checkNpm("openspec validate --all --strict", ["run", "openspec:validate"]),
  checkNpm("secrets:scan", ["run", "secrets:scan"]),
  checkNpm("npm run audit:high", ["run", "audit:high"]),
  checkNpm("npm audit --omit=dev --audit-level=high", ["audit", "--omit=dev", "--audit-level=high"]),
  contractOfTheFix(),
  guardOfFixtures(),
];

const failed = checks.filter((one) => one === false).length;

console.log(failed === 0 ? "GATE: GREEN" : `GATE: RED (${failed} statements failed)`);

process.exit(failed === 0 ? 0 : 1);

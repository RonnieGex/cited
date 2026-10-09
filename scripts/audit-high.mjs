// The requirement "Dependency audit with expiring exceptions" of
// `openspec/changes/audit-exceptions/specs/supply-chain-security/spec.md`: the production tree audits clean with no
// exception possible, the whole tree audits clean except the advisories listed in `security/audit-exceptions.json`,
// every entry carries its evidence and expires within 30 days, and an audit that cannot run fails.
import { spawnSync } from "node:child_process";
import { closeSync, existsSync, fstatSync, mkdtempSync, openSync, readFileSync, readSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const DEFAULT_EXCEPTIONS = join(ROOT, "security", "audit-exceptions.json");
const LEVELS = new Set(["high", "critical"]);
const IDENTIFIER = /^GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAXIMUM_DAYS = 30;
const DAY = 24 * 60 * 60 * 1000;

function dayOf(text) {
  return Math.floor(Date.parse(`${text}T00:00:00Z`) / DAY);
}

function isARealDate(text) {
  return typeof text === "string" && DATE.test(text) && new Date(`${text}T00:00:00Z`).toISOString().slice(0, 10) === text;
}

function daysBetween(from, to) {
  return dayOf(to) - dayOf(from);
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

// The pair (identifier, package) of every advisory of the high level or above that the payload reports. A `via` entry
// that is a string names a package that depends on the vulnerable one, and its own entry carries the advisory.
export function advisoriesOf(payload, label) {
  const vulnerabilities = payload?.vulnerabilities;

  if (typeof vulnerabilities !== "object" || vulnerabilities === null) {
    throw new Error(`${label} is not a payload of npm audit: it carries no vulnerabilities`);
  }

  const found = new Map();

  for (const [name, entry] of Object.entries(vulnerabilities)) {
    const via = Array.isArray(entry?.via) ? entry.via : [];

    for (const item of via) {
      if (typeof item !== "object" || item === null) {
        continue;
      }

      const identifier = typeof item.url === "string" ? item.url.split("/").pop() : null;
      const severity = String(item.severity ?? entry?.severity ?? "").toLowerCase();

      if (typeof identifier !== "string" || LEVELS.has(severity) === false) {
        continue;
      }

      found.set(`${identifier} ${name}`, { identifier, package: name, severity, title: String(item.title ?? "") });
    }
  }

  return [...found.values()];
}

export function productionPackagesOf(tree, label = "the production tree") {
  const dependencies = tree?.dependencies;
  const problems = Array.isArray(tree?.problems) ? tree.problems.filter((problem) => typeof problem === "string") : [];

  if (dependencies !== undefined && (typeof dependencies !== "object" || dependencies === null)) {
    throw new Error(`${label} is not a tree of npm ls: its dependencies are not an object`);
  }

  if (dependencies === undefined && problems.length > 0) {
    throw new Error(`${label} could not be listed: ${problems.join("; ")}`);
  }

  const names = new Set();

  const visit = (node) => {
    const children = node?.dependencies;

    if (typeof children !== "object" || children === null) {
      return;
    }

    for (const [name, child] of Object.entries(children)) {
      names.add(name);
      visit(child);
    }
  };

  visit(tree);

  return names;
}

function readEntries(exceptions) {
  const list = exceptions?.exceptions;

  if (Array.isArray(list) === false) {
    throw new Error("security/audit-exceptions.json carries no exceptions list");
  }

  return list;
}

function checkEntry(entry, position, day, production) {
  const problems = [];

  if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
    return [`entry ${position} is not an object`];
  }

  const identifier = entry.id;
  const name = entry.package;
  const { reason, noFixEvidence, expires } = entry;
  const named = `entry ${position} (${typeof identifier === "string" ? identifier : "no identifier"})`;

  if (typeof identifier !== "string" || IDENTIFIER.test(identifier) === false) {
    problems.push(`${named} has no GHSA identifier`);
  }

  if (typeof name !== "string" || name.trim().length === 0) {
    problems.push(`${named} names no package`);
  } else if (production.has(name)) {
    problems.push(`${named} excepts ${name}, a package of the production tree, where no exception is allowed`);
  }

  if (typeof reason !== "string" || reason.trim().length === 0) {
    problems.push(`${named} carries no reason`);
  }

  if (typeof noFixEvidence !== "string" || noFixEvidence.trim().length === 0) {
    problems.push(`${named} carries no evidence that no fixed version is published`);
  }

  if (isARealDate(expires) === false) {
    problems.push(`${named} carries no real date of expiry`);
  } else if (dayOf(expires) < dayOf(day)) {
    problems.push(`${named} expired on ${expires}`);
  } else if (daysBetween(day, expires) > MAXIMUM_DAYS) {
    problems.push(`${named} asks for ${daysBetween(day, expires)} days and the maximum is ${MAXIMUM_DAYS}`);
  }

  return problems;
}

export function evaluate({ audit, productionAudit, productionTree, exceptions, day }) {
  const problems = [];
  const productionProblems = [];
  const entryProblems = [];
  const coverageProblems = [];
  const lines = [];

  if (isARealDate(day) === false) {
    problems.push(`the day of the run is not a real date: ${String(day)}`);
  }

  const advisories = advisoriesOf(audit, "the payload of npm audit");
  const inProduction = advisoriesOf(productionAudit, "the payload of npm audit --omit=dev");

  if (inProduction.length === 0) {
    lines.push("PASS  production audit: no finding of the high level or above in the production tree");
  } else {
    for (const advisory of inProduction) {
      productionProblems.push(
        `the production tree carries ${advisory.severity} ${advisory.identifier} in ${advisory.package}, and no exception covers the production tree`,
      );
    }
  }

  const entries = readEntries(exceptions);
  const production = productionPackagesOf(productionTree);

  entries.forEach((entry, position) => {
    entryProblems.push(...checkEntry(entry, position, day, production));
  });

  const covered = new Set(
    entries
      .filter((entry) => typeof entry === "object" && entry !== null)
      .map((entry) => `${entry.id} ${entry.package}`),
  );

  for (const advisory of advisories) {
    if (covered.has(`${advisory.identifier} ${advisory.package}`) === false) {
      coverageProblems.push(
        `the ${advisory.severity} advisory ${advisory.identifier} of ${advisory.package} is not in security/audit-exceptions.json`,
      );
    }
  }

  const expiries = entries
    .map((entry) => (typeof entry === "object" && entry !== null && isARealDate(entry.expires) ? entry.expires : null))
    .filter((value) => value !== null)
    .sort();

  const inForce = advisories.length === 0 ? 0 : covered.size;

  lines.push(
    `${coverageProblems.length === 0 && entryProblems.length === 0 ? "PASS" : "FAIL"}  full audit: ${advisories.length} advisories of the high level or above, ${entries.length} entries, ${inForce} in force`,
  );

  problems.push(...productionProblems, ...entryProblems, ...coverageProblems);

  for (const problem of problems) {
    lines.push(`FAIL  ${problem}`);
  }

  return {
    ok: problems.length === 0,
    lines,
    problems,
    entries: entries.length,
    nearestExpiry: expiries[0] ?? null,
  };
}

export function parseArguments(argv) {
  const options = {
    auditFile: null,
    productionAuditFile: null,
    productionTreeFile: null,
    exceptionsFile: DEFAULT_EXCEPTIONS,
    day: today(),
  };
  const names = new Map([
    ["--audit-file", "auditFile"],
    ["--prod-audit-file", "productionAuditFile"],
    ["--prod-tree-file", "productionTreeFile"],
    ["--exceptions-file", "exceptionsFile"],
    ["--today", "day"],
  ]);

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const [flag, inline] = argument.includes("=") ? [argument.slice(0, argument.indexOf("=")), argument.slice(argument.indexOf("=") + 1)] : [argument, null];
    const key = names.get(flag);

    if (key === undefined) {
      throw new Error(`unknown argument: ${argument}`);
    }

    const value = inline ?? argv[index + 1];

    if (typeof value !== "string" || value.length === 0) {
      throw new Error(`${flag} needs a value`);
    }

    options[key] = value;

    if (inline === null) {
      index += 1;
    }
  }

  return options;
}

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

function npmPayload(args, label) {
  const directory = mkdtempSync(join(tmpdir(), "audit-high-"));
  const payloadFile = join(directory, "payload.json");
  const descriptor = openSync(payloadFile, "w+");
  let text;

  try {
    spawnSync(process.execPath, [npmCommandLine(), ...args], {
      cwd: ROOT,
      stdio: ["ignore", descriptor, "inherit"],
    });
    text = readDescriptor(descriptor);
  } finally {
    closeSync(descriptor);
  }

  rmSync(directory, { recursive: true, force: true });

  if (text.trim().length === 0) {
    throw new Error(`${label} wrote nothing; npm audit could not run`);
  }

  return JSON.parse(text);
}

function readJson(path, label) {
  const text = readFileSync(path, "utf8");

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
}

export function inputsFrom(options) {
  return {
    audit: options.auditFile === null ? npmPayload(["audit", "--json"], "npm audit") : readJson(options.auditFile, options.auditFile),
    productionAudit:
      options.productionAuditFile === null
        ? npmPayload(["audit", "--omit=dev", "--json"], "npm audit --omit=dev")
        : readJson(options.productionAuditFile, options.productionAuditFile),
    productionTree:
      options.productionTreeFile === null
        ? npmPayload(["ls", "--omit=dev", "--all", "--json"], "npm ls --omit=dev --all")
        : readJson(options.productionTreeFile, options.productionTreeFile),
    exceptions: readJson(options.exceptionsFile, options.exceptionsFile),
    day: options.day,
  };
}

export function main(argv, log = console.log) {
  let verdict;

  try {
    const options = parseArguments(argv);
    const inputs = inputsFrom(options);

    verdict = evaluate(inputs);
  } catch (error) {
    log(`FAIL  ${error.message}`);

    verdict = { ok: false, lines: [], problems: [error.message], entries: 0, nearestExpiry: null };
  }

  for (const line of verdict.lines) {
    log(line);
  }

  if (verdict.ok) {
    log(`AUDIT: PASS (${verdict.entries} entries in force, the nearest expiry ${verdict.nearestExpiry})`);
  } else {
    log(`AUDIT: FAIL (${verdict.problems.length} problems)`);
  }

  return verdict.ok ? 0 : 1;
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv.slice(2));
}

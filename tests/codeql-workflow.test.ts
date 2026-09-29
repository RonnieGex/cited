import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repositoryRoot = resolve(import.meta.dirname, "..");

type YamlValue = string | YamlValue[] | YamlMapping;
type YamlMapping = { [key: string]: YamlValue };
type Line = { indent: number; text: string };
type Cursor = { index: number };

const workflowPath = resolve(repositoryRoot, ".github/workflows/codeql.yml");

function indentation(line: string): number {
  return line.length - line.trimStart().length;
}

function unquote(text: string): string {
  const quoted =
    text.length >= 2 &&
    ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'")));

  return quoted ? text.slice(1, -1) : text;
}

function entryIndex(text: string): number {
  const separator = text.indexOf(": ");

  if (separator !== -1) {
    return separator;
  }

  return text.endsWith(":") ? text.length - 1 : -1;
}

function flowItems(inner: string): string[] {
  const items: string[] = [];
  let current = "";
  let quote = "";

  for (const character of inner) {
    if (quote !== "") {
      if (character === quote) {
        quote = "";
      }
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === ",") {
      items.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  items.push(current);

  return items.map((item) => unquote(item.trim())).filter((item) => item.length > 0);
}

function parseScalar(text: string): YamlValue {
  return text.startsWith("[") && text.endsWith("]") ? flowItems(text.slice(1, -1)) : unquote(text);
}

function isSequenceLine(line: Line | undefined): boolean {
  return line !== undefined && (line.text === "-" || line.text.startsWith("- "));
}

function parseChild(lines: Line[], cursor: Cursor, indent: number): YamlValue {
  const line = lines[cursor.index];

  return line === undefined || line.indent <= indent ? "" : parseBlock(lines, cursor, line.indent);
}

function parseMapping(lines: Line[], cursor: Cursor, indent: number): YamlMapping {
  const mapping: YamlMapping = {};

  while (cursor.index < lines.length) {
    const line = lines[cursor.index];

    if (line === undefined || line.indent < indent) {
      break;
    }

    if (line.indent > indent || isSequenceLine(line)) {
      throw new Error(`the workflow reader found an unexpected line: ${line.text}`);
    }

    const separator = entryIndex(line.text);

    if (separator === -1) {
      throw new Error(`the workflow reader found no key in the line: ${line.text}`);
    }

    const key = unquote(line.text.slice(0, separator));
    const value = line.text.slice(separator + 1).trim();

    cursor.index += 1;
    mapping[key] = value.length > 0 ? parseScalar(value) : parseChild(lines, cursor, indent);
  }

  return mapping;
}

function parseSequence(lines: Line[], cursor: Cursor, indent: number): YamlValue[] {
  const items: YamlValue[] = [];

  while (cursor.index < lines.length) {
    const line = lines[cursor.index];

    if (line === undefined || line.indent !== indent || !isSequenceLine(line)) {
      break;
    }

    const rest = line.text.slice(1).trimStart();
    const itemIndent = indent + line.text.length - rest.length;

    if (rest.length === 0) {
      cursor.index += 1;
      items.push(parseChild(lines, cursor, indent));
      continue;
    }

    if (entryIndex(rest) === -1) {
      cursor.index += 1;
      items.push(parseScalar(rest));
      continue;
    }

    lines[cursor.index] = { indent: itemIndent, text: rest };
    items.push(parseBlock(lines, cursor, itemIndent));
  }

  return items;
}

function parseBlock(lines: Line[], cursor: Cursor, indent: number): YamlValue {
  const line = lines[cursor.index];

  if (line === undefined) {
    throw new Error("the workflow reader reached the end of the file");
  }

  return isSequenceLine(line) ? parseSequence(lines, cursor, indent) : parseMapping(lines, cursor, indent);
}

function parseWorkflow(source: string): YamlMapping {
  const lines = source
    .split("\n")
    .map((raw) => raw.replace(/\s+$/, ""))
    .filter((raw) => raw.trim().length > 0 && !raw.trimStart().startsWith("#"))
    .map((raw) => ({ indent: indentation(raw), text: raw.trim() }));
  const cursor: Cursor = { index: 0 };
  const workflow = parseMapping(lines, cursor, 0);

  if (cursor.index !== lines.length) {
    throw new Error("the workflow reader left lines unread");
  }

  return workflow;
}

function mappingOf(value: YamlValue | undefined): YamlMapping {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("the workflow reader expected a mapping");
  }

  return value;
}

function sequenceOf(value: YamlValue | undefined): YamlValue[] {
  if (!Array.isArray(value)) {
    throw new Error("the workflow reader expected a sequence");
  }

  return value;
}

function stepOf(steps: YamlMapping[], action: string): YamlMapping {
  const step = steps.find(
    (candidate) => typeof candidate.uses === "string" && candidate.uses.startsWith(action),
  );

  if (step === undefined) {
    throw new Error(`the workflow has no step that uses ${action}`);
  }

  return step;
}

const workflow = parseWorkflow(readFileSync(workflowPath, "utf8"));
const analyze = mappingOf(mappingOf(workflow.jobs).analyze);
const steps = sequenceOf(analyze.steps).map(mappingOf);

describe("the CodeQL workflow", () => {
  it("skips the analysis while the repository is private", () => {
    expect(analyze.if).toBe("${{ !github.event.repository.private }}");
  });

  it("keeps the languages, the queries and the permissions", () => {
    expect(workflow.permissions).toEqual({ contents: "read" });
    expect(analyze.permissions).toEqual({
      actions: "read",
      contents: "read",
      "security-events": "write",
    });
    expect(mappingOf(stepOf(steps, "github/codeql-action/init").with)).toEqual({
      languages: "javascript-typescript",
      queries: "security-extended",
    });
  });

  it("keeps the triggers of the analysis", () => {
    expect(workflow.on).toEqual({
      push: { branches: ["main"] },
      pull_request: { branches: ["main"] },
      schedule: [{ cron: "17 6 * * 1" }],
    });
  });

  it("keeps the analysis step that uploads the results", () => {
    expect(stepOf(steps, "github/codeql-action/analyze").uses).toBeDefined();
  });
});

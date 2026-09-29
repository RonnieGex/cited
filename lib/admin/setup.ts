import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { AdminEnvironment } from "./session.ts";

export type SetupVariable = {
  name: string;
  configured: boolean;
};

export type SetupGroup = {
  title: string;
  detail: string;
  variables: SetupVariable[];
};

const declaration = /^([A-Z0-9_]+)=/;

function titleOf(block: string[]): { title: string; detail: string } {
  const first = (block[0] ?? "").replace(/^#\s?/, "").trim();
  const stop = first.indexOf(".");
  const title = stop === -1 ? first : first.slice(0, stop).trim();
  const rest = [
    stop === -1 ? "" : first.slice(stop + 1).trim(),
    ...block.slice(1).map((line) => line.replace(/^#\s?/, "").trim()),
  ].filter((line) => line.length > 0);

  return { title, detail: rest.join(" ") };
}

export function setupGroups(example: string, environment: AdminEnvironment): SetupGroup[] {
  const groups: SetupGroup[] = [];
  let adjacent: string[] = [];
  let settled: string[] = [];
  let current = { title: "", detail: "" };

  for (const line of example.split("\n")) {
    const trimmed = line.trim();

    if (trimmed.startsWith("#")) {
      adjacent.push(trimmed);
      continue;
    }

    if (trimmed.length === 0) {
      if (adjacent.length > 0) {
        settled = adjacent;
        adjacent = [];
      }

      continue;
    }

    const declared = declaration.exec(trimmed);

    if (declared === null) {
      continue;
    }

    const name = declared[1] ?? "";
    const block = adjacent.length > 0 ? adjacent : settled;

    if (block.length > 0) {
      current = titleOf(block);
    }

    adjacent = [];
    settled = [];

    const configured = (environment[name]?.trim() ?? "").length > 0;
    const last = groups.at(-1);

    if (last !== undefined && last.title === current.title) {
      last.variables.push({ name, configured });
    } else {
      groups.push({
        title: current.title,
        detail: current.detail,
        variables: [{ name, configured }],
      });
    }
  }

  return groups;
}

export function exampleText(): string {
  return readFileSync(resolve(process.cwd(), ".env.example"), "utf8");
}

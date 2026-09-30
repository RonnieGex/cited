import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { AdminEnvironment } from "./session.ts";

export type SetupVariable = {
  name: string;
  configured: boolean;
};

export type SetupGroup = {
  /**
   * A stable key for the group: the slug of the title in the template (`.env.example`). The panel takes the words of a group
   * in the language of the owner from a table keyed by it (`lib/i18n/setup-groups.ts`), so the words shown never depend on the
   * English text of the template.
   */
  id: string;
  title: string;
  detail: string;
  /** The group the panel cannot start without: the one comment of the template that opens with "Required". */
  required: boolean;
  variables: SetupVariable[];
};

const declaration = /^([A-Z0-9_]+)=/;

/** The slug of a title: lower case, letters and digits, one hyphen between the words. */
export function groupId(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleOf(block: string[]): { title: string; detail: string; required: boolean } {
  const first = (block[0] ?? "").replace(/^#\s?/, "").trim();
  const stop = first.indexOf(".");
  const title = stop === -1 ? first : first.slice(0, stop).trim();
  const rest = [
    stop === -1 ? "" : first.slice(stop + 1).trim(),
    ...block.slice(1).map((line) => line.replace(/^#\s?/, "").trim()),
  ].filter((line) => line.length > 0);

  return { title, detail: rest.join(" "), required: first.startsWith("Required") };
}

export function setupGroups(example: string, environment: AdminEnvironment): SetupGroup[] {
  const groups: SetupGroup[] = [];
  let adjacent: string[] = [];
  let settled: string[] = [];
  let current = { title: "", detail: "", required: false };

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
        id: groupId(current.title),
        title: current.title,
        detail: current.detail,
        required: current.required,
        variables: [{ name, configured }],
      });
    }
  }

  return groups;
}

export function exampleText(): string {
  return readFileSync(resolve(process.cwd(), ".env.example"), "utf8");
}

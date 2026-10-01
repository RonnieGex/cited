// Decision 19 of `openspec/changes/passage-display-polish/design.md`: the golden fixture of the chunker. The fixture
// (`tests/fixtures/chunker-golden.json`) holds the passages that the chunker of `86b250f` returns for every Markdown
// and text file of `docs/` and `samples/`; `scripts/chunk-golden.mts` wrote it with the command of the report of the
// step 12. This test chunks the same files on the branch and requires every passage to be identical once the line
// break of a list join is read as a space, and it names the file and the position of the first difference.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { chunkText } from "@/lib/ingest";

const root = process.cwd();
const fixturePath = join(root, "tests", "fixtures", "chunker-golden.json");

type Passage = { heading: string | null; text: string };
type Golden = { label: string; files: Array<{ path: string; passages: Passage[] }> };
type Difference = { file: string; position: number; expected: string; actual: string };

function golden(): Golden {
  return JSON.parse(readFileSync(fixturePath, "utf8")) as Golden;
}

function textFiles(dir: string, found: string[] = []): string[] {
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name);

    if (statSync(path).isDirectory()) {
      textFiles(path, found);
    } else if (/\.(md|txt)$/i.test(name)) {
      found.push(relative(root, path).split(sep).join("/"));
    }
  }

  return found;
}

function cut(text: string): string {
  return text.length <= 160 ? text : `${text.slice(0, 160)}…`;
}

/** The first file and position whose passages differ from the fixture, with the `\n` of a list join read as a space. */
function firstDifference(): Difference | null {
  for (const file of golden().files) {
    const actual = chunkText(readFileSync(join(root, file.path), "utf8")).map((passage) => ({
      heading: passage.heading,
      text: passage.text.replace(/\n/g, " "),
    }));

    if (actual.length !== file.passages.length) {
      return {
        file: file.path,
        position: Math.min(actual.length, file.passages.length),
        expected: `${file.passages.length} passages`,
        actual: `${actual.length} passages`,
      };
    }

    for (let position = 0; position < file.passages.length; position += 1) {
      const expected = file.passages[position];
      const passage = actual[position];

      if (
        expected === undefined ||
        passage === undefined ||
        passage.heading !== expected.heading ||
        passage.text !== expected.text
      ) {
        return {
          file: file.path,
          position,
          expected: expected === undefined ? "missing" : `${expected.heading ?? "-"} | ${cut(expected.text)}`,
          actual: passage === undefined ? "missing" : `${passage.heading ?? "-"} | ${cut(passage.text)}`,
        };
      }
    }
  }

  return null;
}

describe("the chunker of the change cuts as the chunker of 86b250f", () => {
  it("keeps every passage of every Markdown and text file of docs/ and samples/", () => {
    const difference = firstDifference();

    expect(
      difference,
      difference === null
        ? ""
        : `the first difference is ${difference.file}, passage ${difference.position}: ${difference.actual}`,
    ).toBeNull();
  });

  it("names every Markdown and text file of docs/ and samples/ in the fixture", () => {
    const files = [...textFiles(join(root, "docs")), ...textFiles(join(root, "samples"))].sort();

    expect(golden().files.map((file) => file.path)).toEqual(files);
  });
});

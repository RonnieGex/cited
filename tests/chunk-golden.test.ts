// Decision 19 of `openspec/changes/passage-display-polish/design.md`: the golden fixture of the chunker, over the
// frozen corpus of decision 23. The fixture (`tests/fixtures/chunker-golden.json`) holds the passages that the
// chunker of `86b250f` returns for the frozen copies of `tests/fixtures/chunk-golden/inputs/`, written once by
// `scripts/chunk-golden.mts` with the command of the report of the step 13. This test chunks the same copies on the
// branch and requires every passage to be identical once the line break of a list join is read as a space, and it
// names the file and the first passage whose text differs, position by position, even when the number of passages
// differs (decision 24). It reads no live file of `docs/`, of `samples/` or of the archive, so editing a document
// never breaks it.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { chunkText } from "@/lib/ingest";

const root = process.cwd();
const fixturePath = join(root, "tests", "fixtures", "chunker-golden.json");
const inputs = join(root, "tests", "fixtures", "chunk-golden", "inputs");

type Passage = { heading: string | null; text: string };
type Golden = { label: string; files: Array<{ path: string; passages: Passage[] }> };
type Difference = { file: string; position: number; expected: string; actual: string };

function golden(): Golden {
  return JSON.parse(readFileSync(fixturePath, "utf8")) as Golden;
}

/** The frozen files of decision 23, named by their path under the inputs directory of the corpus. */
function frozenFiles(dir: string, found: string[] = []): string[] {
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name);

    if (statSync(path).isDirectory()) {
      frozenFiles(path, found);
    } else if (/\.(md|txt)$/i.test(name)) {
      found.push(relative(inputs, path).split(sep).join("/"));
    }
  }

  return found;
}

function cut(text: string): string {
  return text.length <= 160 ? text : `${text.slice(0, 160)}…`;
}

function readable(passage: Passage): string {
  return `${passage.heading ?? "-"} | ${cut(passage.text)}`;
}

/** The first file and passage whose text differs from the fixture, with the `\n` of a list join read as a space. */
function firstDifference(): Difference | null {
  for (const file of golden().files) {
    const actual = chunkText(readFileSync(join(inputs, file.path), "utf8")).map((passage) => ({
      heading: passage.heading,
      text: passage.text.replace(/\n/g, " "),
    }));
    const positions = Math.min(actual.length, file.passages.length);

    for (let position = 0; position < positions; position += 1) {
      const expected = file.passages[position];
      const found = actual[position];

      if (
        expected === undefined ||
        found === undefined ||
        found.heading !== expected.heading ||
        found.text !== expected.text
      ) {
        return {
          file: file.path,
          position,
          expected: expected === undefined ? "missing" : readable(expected),
          actual: found === undefined ? "missing" : readable(found),
        };
      }
    }

    if (actual.length !== file.passages.length) {
      return {
        file: file.path,
        position: positions,
        expected: `${file.passages.length} passages`,
        actual: `${actual.length} passages`,
      };
    }
  }

  return null;
}

describe("the chunker of the change cuts as the chunker of 86b250f", () => {
  it("keeps every passage of the frozen corpus of decision 23", () => {
    const difference = firstDifference();

    expect(
      difference,
      difference === null
        ? ""
        : `the first difference is ${difference.file}, passage ${difference.position}: ${difference.actual}`,
    ).toBeNull();
  });

  it("names every file of the frozen corpus in the fixture", () => {
    expect(golden().files.map((file) => file.path)).toEqual(frozenFiles(inputs).sort());
  });
});

// Decision 19 of `openspec/changes/passage-display-polish/design.md`: the golden fixture of the chunker. This script
// writes the passages that one build of `lib/ingest/chunk.ts` returns for every Markdown and text file of `docs/` and
// `samples/`, so the fixture of the unit test can be written from the chunker of `86b250f`:
//
//   git show 86b250f:lib/ingest/chunk.ts > <scratch>/chunk-86b250f.ts
//   npx -y -p node@24 node scripts/chunk-golden.mts <scratch>/chunk-86b250f.ts tests/fixtures/chunker-golden.json
//
// The unit test of the change (`tests/chunk-golden.test.ts`) chunks the same files and requires the same passages, once
// the line break of a list join is read as a space. The label is what the fixture says about the build it came from; it
// never carries a path of this machine.

import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

type Passage = { heading: string | null; text: string };
type Chunker = { chunkText: (source: string) => Passage[] };

const root = fileURLToPath(new URL("..", import.meta.url));
const [implementation, output, label = "lib/ingest/chunk.ts"] = process.argv.slice(2);

if (implementation === undefined || output === undefined) {
  console.error("usage: node scripts/chunk-golden.mts <chunk.ts> <output.json> [label]");
  process.exit(2);
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

const chunker = (await import(pathToFileURL(resolve(implementation)).href)) as Chunker;
const files = [...textFiles(join(root, "docs")), ...textFiles(join(root, "samples"))].sort();
const fixture = {
  label,
  files: files.map((path) => ({
    path,
    passages: chunker.chunkText(readFileSync(join(root, path), "utf8")).map(({ heading, text }) => ({ heading, text })),
  })),
};
const passages = fixture.files.reduce((total, file) => total + file.passages.length, 0);

writeFileSync(resolve(output), `${JSON.stringify(fixture, null, 2)}\n`);
console.log(`${files.length} files, ${passages} passages`);

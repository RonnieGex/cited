import { readFileSync } from "node:fs";
import { join } from "node:path";

// Decision 4 of `openspec/changes/guided-setup-and-knowledge/design.md`: "Try it with a sample business" ingests a
// sample corpus and fills an empty business name with Café La Horquilla, both undoable by removing the documents it
// added.
//
// The bytes are read once, when this module is loaded on the server, and never on the client or at the edge: the route
// of `/api/admin/samples` is the only importer and it runs with `runtime = "nodejs"`. The list is the corpus of
// `samples/` of the repository, so what the owner sees in the panel is what the repository publishes and what the E2E
// of the public page ingests.

export type SampleDocument = {
  name: string;
  bytes: Uint8Array;
};

export const SAMPLE_NAME = "Café La Horquilla";

const SAMPLE_FILES = ["cafe-la-horquilla.md", "bike-workshop-policies.md", "notas-del-negocio.txt"];

function read(name: string): SampleDocument {
  return { name, bytes: readFileSync(join(process.cwd(), "samples", name)) };
}

export const SAMPLE_DOCUMENTS: SampleDocument[] = SAMPLE_FILES.map(read);

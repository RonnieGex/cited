import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { closeSharedStores, sharedStore } from "@/lib/store/instance";
import { openStore, type Store } from "@/lib/store/index";
import { storeTables } from "@/lib/store/tables";
import { setupChecklist, type SetupStep } from "@/lib/admin/setup-checklist";
import { readSetupFlags, writeSetupFlag, SETUP_FLAGS } from "@/lib/admin/setup-flags";
import { sealSecret } from "@/lib/secrets";
import { embeddingsSignature } from "@/lib/settings/providers";
import { readablePrimary } from "@/lib/theme/primary";

// Decision 2 of `openspec/changes/guided-setup-and-knowledge/design.md`: the state of a step is derived from the real
// configuration and only two things are stored, the flag of "This answer is right" and the flag of "Publish". These
// cases fix what each state means before any page is built.

const roots: string[] = [];
const opened: Store[] = [];

afterEach(async () => {
  await closeSharedStores();

  for (const store of opened) {
    store.close();
  }

  opened.length = 0;

  // The temporary folder of a case holds the store of the case: the store is closed above, so the folder usually goes
  // with it, and a folder Windows still holds for a moment is left to the system rather than turned into a failure of
  // a case that passed.
  for (const root of roots) {
    try {
      rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    } catch {
      // Left where it is: it is a folder of the temporary directory of the machine.
    }
  }

  roots.length = 0;
});

async function tempStore(): Promise<Store> {
  const root = mkdtempSync(join(tmpdir(), "cited-checklist-"));

  roots.push(root);

  const store = await openStore(join(root, "store.sqlite"));

  opened.push(store);

  return store;
}

async function withPassages(store: Store): Promise<void> {
  await store.replaceDocument(
    { name: "cafe.md", sha256: "a".repeat(64), type: "md", pages: null },
    [
      { position: 1, heading: "Horario", text: "Abrimos de martes a domingo.", embedding: [] },
      { position: 2, heading: "Precios", text: "Espresso: 35 pesos.", embedding: [] },
    ],
  );
}

// The key of the encryption of the cases: the provider of the panel is stored sealed with it, and a case that resolves
// the store with another one holds a key that can no longer be read (decision 20).
const encryptionKey = { ENCRYPTION_KEY: Buffer.alloc(32, 21).toString("base64") };
const otherEncryptionKey = { ENCRYPTION_KEY: Buffer.alloc(32, 22).toString("base64") };

function sealedKey(environment: Record<string, string>): string {
  const sealed = sealSecret("sk-de-la-suite-0000000000001234", environment);

  if (sealed.ok === false) {
    throw new Error("the key of the case did not seal the key of the provider");
  }

  return sealed.value;
}

async function withChatProvider(
  store: Store,
  testedAt: string | null,
  environment: Record<string, string> = encryptionKey,
): Promise<void> {
  await store.saveProviderSetting({
    kind: "chat",
    provider: "deepseek",
    model: "deepseek-chat",
    keyCiphertext: sealedKey(environment),
    keyLast4: "1234",
    baseUrl: null,
    mode: null,
    testedAt,
    testLatencyMs: testedAt === null ? null : 420,
  });
}

// A row of the panel that names a provider the catalogue does not know: a store imported from another installation, a
// row edited by hand or a name the catalogue dropped. Its key is readable and its test may have passed, which is the
// shape of the Major M-8 of `katalis-dev/tasks/revision-community-13c.md`.
async function withUnknownChatProvider(store: Store, testedAt: string | null): Promise<void> {
  await store.saveProviderSetting({
    kind: "chat",
    provider: "unknown-provider",
    model: "modelo-de-prueba",
    keyCiphertext: sealedKey(encryptionKey),
    keyLast4: "1234",
    baseUrl: null,
    mode: null,
    testedAt,
    testLatencyMs: testedAt === null ? null : 420,
  });
}

async function pressTryIt(store: Store): Promise<void> {
  await writeSetupFlag(store, "try_verified", true);
}

async function publish(store: Store): Promise<void> {
  await writeSetupFlag(store, "published", true);
}

function stateOf(steps: SetupStep[], id: SetupStep["id"]): SetupStep["state"] {
  const found = steps.find((step) => step.id === id);

  if (found === undefined) {
    throw new Error(`the checklist has no step ${id}`);
  }

  return found.state;
}

describe("the derived state of the four steps", () => {
  it("starts every step to do and the lane open, on a first visit", async () => {
    const store = await tempStore();
    const checklist = await setupChecklist(store);

    expect(checklist.steps.map((step) => step.id)).toEqual(["ai", "information", "try", "publish"]);
    expect(checklist.steps.map((step) => step.state)).toEqual(["todo", "todo", "todo", "todo"]);
    expect(checklist.started).toBe(false);
    expect(checklist.done).toBe(false);
    expect(checklist.skipped).toBe(false);
  });

  it("opens the lane once the owner started it", async () => {
    const store = await tempStore();

    await writeSetupFlag(store, "started", true);

    expect((await setupChecklist(store)).started).toBe(true);
  });

  it("verifies the first step only with a chat provider that answered its test", async () => {
    const store = await tempStore();

    expect(stateOf((await setupChecklist(store)).steps, "ai")).toBe("todo");

    await withChatProvider(store, null);

    expect(stateOf((await setupChecklist(store, encryptionKey)).steps, "ai")).toBe("progress");

    await withChatProvider(store, "2026-09-30T12:00:00.000Z");

    expect(stateOf((await setupChecklist(store, encryptionKey)).steps, "ai")).toBe("verified");
  });

  // Decision 20 of the second amendment: one rule for step 1, whatever the source. The key of a provider saved in the
  // panel is opened on every read; when it can no longer be read the application cannot use the provider, so the step
  // is not green even though its test passed (the Major M-7 of `revision-community-13b.md`).
  it("does not verify a panel provider whose saved key can no longer be read", async () => {
    const store = await tempStore();

    await withChatProvider(store, "2026-09-30T12:00:00.000Z", otherEncryptionKey);

    const checklist = await setupChecklist(store, encryptionKey);

    expect(stateOf(checklist.steps, "ai")).not.toBe("verified");
    expect(stateOf(checklist.steps, "ai")).toBe("attention");
  });

  it("asks for attention for a panel provider whose key cannot be read, even with no test of its own", async () => {
    const store = await tempStore();

    await withChatProvider(store, null, otherEncryptionKey);

    expect(stateOf((await setupChecklist(store, encryptionKey)).steps, "ai")).not.toBe("verified");
    expect(stateOf((await setupChecklist(store, encryptionKey)).steps, "ai")).toBe("attention");
  });

  // Decision 23 of the third amendment: a row of the panel that names a provider the catalogue does not know is not a
  // provider. It asks for attention whatever its key and its stored test say, because the answers path refuses that
  // resolution: the panel never presents a test double as a connected provider (the Major M-8 of
  // `katalis-dev/tasks/revision-community-13c.md`).
  it("asks for attention when the panel names a provider Cited does not know", async () => {
    const store = await tempStore();

    await withUnknownChatProvider(store, "2026-09-30T12:00:00.000Z");

    expect(stateOf((await setupChecklist(store, encryptionKey)).steps, "ai")).not.toBe("verified");
    expect(stateOf((await setupChecklist(store, encryptionKey)).steps, "ai")).toBe("attention");
  });

  it("keeps asking for attention for an unknown panel provider with no test of its own", async () => {
    const store = await tempStore();

    await withUnknownChatProvider(store, null);

    expect(stateOf((await setupChecklist(store, encryptionKey)).steps, "ai")).not.toBe("verified");
    expect(stateOf((await setupChecklist(store, encryptionKey)).steps, "ai")).toBe("attention");
  });

  // The same check guards the provider the server environment names: an unknown value is a problem the step shows, not
  // an exception that leaves the page without an answer.
  it("asks for attention when the server names a provider Cited does not know", async () => {
    const store = await tempStore();
    const checklist = await setupChecklist(store, { CHAT_PROVIDER: "chatgpt" });

    expect(stateOf(checklist.steps, "ai")).not.toBe("verified");
    expect(stateOf(checklist.steps, "ai")).toBe("attention");
  });

  it("verifies the first step when the server sets the provider", async () => {
    const store = await tempStore();
    const checklist = await setupChecklist(store, {
      CHAT_PROVIDER: "fake",
      ADMIN_PASSWORD: "x",
      ADMIN_SESSION_SECRET: "y",
    });

    expect(stateOf(checklist.steps, "ai")).toBe("verified");
  });

  // Decision 14 of the amendment: green means usable. A provider the server names is not verified because of where it
  // came from, but because it can answer: `chatProblem()` reads the key and the provider and this is the same judgement
  // the public page makes when it says the assistant is not ready.
  it("does not verify the first step with a server provider whose key is missing", async () => {
    const store = await tempStore();
    const checklist = await setupChecklist(store, { CHAT_PROVIDER: "openai", OPENAI_API_KEY: "" });

    expect(stateOf(checklist.steps, "ai")).not.toBe("verified");
    expect(stateOf(checklist.steps, "ai")).toBe("attention");
  });

  it("verifies the first step with a server provider that carries its key", async () => {
    const store = await tempStore();
    const checklist = await setupChecklist(store, {
      CHAT_PROVIDER: "openai",
      OPENAI_API_KEY: "sk-de-la-suite-000000000000",
    });

    expect(stateOf(checklist.steps, "ai")).toBe("verified");
  });

  it("keeps the words of the step that needs attention free of the name of a variable", async () => {
    const store = await tempStore();
    const checklist = await setupChecklist(store, { CHAT_PROVIDER: "openai", OPENAI_API_KEY: "" });
    const step = checklist.steps.find((one) => one.id === "ai");

    expect(stateOf(checklist.steps, "ai")).toBe("attention");

    for (const name of ["OPENAI_API_KEY", "CHAT_PROVIDER", "OPENAI_BASE_URL", "CHAT_MODEL"]) {
      expect(JSON.stringify(step)).not.toContain(name);
    }
  });

  it("verifies the second step with one document that has passages", async () => {
    const store = await tempStore();

    expect(stateOf((await setupChecklist(store)).steps, "information")).toBe("todo");

    await withPassages(store);

    expect(stateOf((await setupChecklist(store)).steps, "information")).toBe("verified");
  });

  it("verifies the third step with the flag of a right answer and no other way", async () => {
    const store = await tempStore();

    expect(stateOf((await setupChecklist(store)).steps, "try")).toBe("todo");

    await withPassages(store);

    // The documents are there and nobody has said an answer is right: the step is on its way, which is what the owner
    // reads as "In progress".
    expect(stateOf((await setupChecklist(store)).steps, "try")).toBe("progress");

    await pressTryIt(store);

    expect(stateOf((await setupChecklist(store)).steps, "try")).toBe("verified");
  });

  it("asks for attention on the third step when an answer was marked wrong", async () => {
    const store = await tempStore();

    await withPassages(store);
    await writeSetupFlag(store, "try_attention", true);

    expect(stateOf((await setupChecklist(store)).steps, "try")).toBe("attention");
  });

  it("keeps the third step to do when it was marked right and then wrong", async () => {
    const store = await tempStore();

    await withPassages(store);
    await pressTryIt(store);
    await writeSetupFlag(store, "try_attention", true);

    expect(stateOf((await setupChecklist(store)).steps, "try")).toBe("attention");
  });

  it("verifies the fourth step only with a name and the flag of Publish", async () => {
    const store = await tempStore();

    expect(stateOf((await setupChecklist(store)).steps, "publish")).toBe("todo");

    await store.saveBusiness({
      name: "Café La Horquilla",
      primaryColor: null,
      tone: "",
      language: "en",
      forbiddenTopics: "",
      welcomeEn: "",
      welcomeEs: "",
    });

    expect(stateOf((await setupChecklist(store)).steps, "publish")).toBe("progress");

    await publish(store);

    expect(stateOf((await setupChecklist(store)).steps, "publish")).toBe("verified");
  });

  it("keeps the fourth step to do when the business has a row and no name", async () => {
    const store = await tempStore();

    await store.saveBusinessLogo("image/png", Uint8Array.from([0x89, 0x50, 0x4e, 0x47]));

    expect(stateOf((await setupChecklist(store)).steps, "publish")).toBe("todo");
  });

  it("reads the color of the business for the page that paints it, without moving any step", async () => {
    const store = await tempStore();

    await store.saveBusiness({
      name: "Café La Horquilla",
      primaryColor: "#777777",
      tone: "",
      language: "en",
      forbiddenTopics: "",
      welcomeEn: "",
      welcomeEs: "",
    });

    // `#777777` is 4.478:1 against the paper and 4.003:1 against the ink: neither reaches AA, so the public page falls
    // back to lime and the panel has to say it before the owner shares the link.
    expect(readablePrimary("#777777")).toBe("#ddf469");
    expect(stateOf((await setupChecklist(store)).steps, "publish")).toBe("progress");

    await publish(store);

    expect(stateOf((await setupChecklist(store)).steps, "publish")).toBe("verified");
  });

  it("does not verify the fourth step with the flag alone", async () => {
    const store = await tempStore();

    await publish(store);

    expect(stateOf((await setupChecklist(store)).steps, "publish")).toBe("todo");
  });

  it("is done with the four steps verified, and only then", async () => {
    const store = await tempStore();

    await withChatProvider(store, "2026-09-30T12:00:00.000Z");
    await withPassages(store);
    await pressTryIt(store);
    await store.saveBusiness({
      name: "Café La Horquilla",
      primaryColor: null,
      tone: "",
      language: "en",
      forbiddenTopics: "",
      welcomeEn: "",
      welcomeEs: "",
    });
    await publish(store);

    const checklist = await setupChecklist(store, encryptionKey);

    expect(checklist.steps.every((step) => step.state === "verified")).toBe(true);
    expect(checklist.done).toBe(true);
    expect(checklist.skipped).toBe(false);
  });

  it("skips the lane and comes back from Home", async () => {
    const store = await tempStore();

    await writeSetupFlag(store, "skipped", true);

    expect((await setupChecklist(store)).skipped).toBe(true);

    await writeSetupFlag(store, "skipped", false);

    expect((await setupChecklist(store)).skipped).toBe(false);
  });
});

describe("the words of a step", () => {
  it("names each step in both languages and never a variable of the environment", async () => {
    const store = await tempStore();
    const checklist = await setupChecklist(store);
    const environment = [
      "CHAT_PROVIDER",
      "EMBEDDINGS_PROVIDER",
      "DATABASE_URL",
      "ADMIN_PASSWORD",
      "ENCRYPTION_KEY",
      "ALLOWED_ORIGINS",
    ];

    for (const step of checklist.steps) {
      expect(step.title.en.length).toBeGreaterThan(0);
      expect(step.title.es.length).toBeGreaterThan(0);
      expect(step.detail.en.length).toBeGreaterThan(0);
      expect(step.detail.es.length).toBeGreaterThan(0);

      for (const name of environment) {
        expect(`${step.title.en} ${step.title.es} ${step.detail.en} ${step.detail.es}`).not.toContain(name);
      }
    }
  });
});

describe("the flags of the setup", () => {
  it("are the two stored decisions of decision 2, and nothing else", () => {
    expect([...SETUP_FLAGS].sort()).toEqual(["published", "skipped", "started", "try_attention", "try_verified"]);
  });

  it("are read as off when the store holds no row", async () => {
    const store = await tempStore();

    expect(await readSetupFlags(store)).toEqual({
      started: false,
      try_verified: false,
      try_attention: false,
      published: false,
      skipped: false,
    });
  });

  it("keep what was written and go back to off", async () => {
    const store = await tempStore();

    await writeSetupFlag(store, "try_verified", true);

    expect((await readSetupFlags(store)).try_verified).toBe(true);

    await writeSetupFlag(store, "try_verified", false);

    expect((await readSetupFlags(store)).try_verified).toBe(false);
  });

  it("live in a table of the schema, so the state of a store shows them", async () => {
    const store = await tempStore();

    await writeSetupFlag(store, "published", true);

    expect(storeTables).toContain("setup_flags");
    expect(await store.readSetupFlag("published")).toBe(true);
  });
});

describe("the store the checklist reads", () => {
  it("counts a passage of a document of the sample business like any other", async () => {
    const store = await tempStore();

    await store.replaceDocument(
      { name: "cafe-la-horquilla.md", sha256: "b".repeat(64), type: "md", pages: null },
      [{ position: 1, heading: "Horario", text: "Abrimos de martes a domingo.", embedding: [] }],
    );

    expect(await store.countPassages()).toBe(1);
    expect(stateOf((await setupChecklist(store)).steps, "information")).toBe("verified");
  });

  it("shares the store of the environment when the page opens it that way", async () => {
    const root = mkdtempSync(join(tmpdir(), "cited-checklist-shared-"));
    const path = join(root, "store.sqlite");

    roots.push(root);
    writeFileSync(join(root, "keep.txt"), "the folder exists");

    const store = await sharedStore({ DATABASE_URL: path } as Record<string, string>);

    await writeSetupFlag(store, "started", true);

    expect((await readSetupFlags(await sharedStore({ DATABASE_URL: path } as Record<string, string>))).started).toBe(
      true,
    );
    expect(embeddingsSignature({ mode: "keyword" } as never)).toBe("keyword");
  });
});

import type { ChatEnvironment } from "../models/types.ts";
import { resolveChat } from "../settings/providers.ts";
import type { Store } from "../store/index.ts";
import { SETUP_STEP_ORDER, SETUP_STEP_WORDS, type SetupCopy, type SetupStepId } from "./setup-copy.ts";
import { readSetupFlags, type SetupFlags } from "./setup-flags.ts";

// Decision 2 of `openspec/changes/guided-setup-and-knowledge/design.md`: the state of each of the four steps is derived
// from the real configuration, not stored. Step 1 is verified when the chat provider answered its test (or the server
// set it), step 2 when a document has passages, step 3 when the owner pressed "This answer is right" and step 4 when
// the business has a name and the owner pressed "Publish". The only stored things are the flags of `setup-flags.ts`.
//
//   todo      nothing was done yet
//   progress  something is there and the step is not finished
//   verified  the step proved itself
//   attention something the owner did needs a look

export type SetupState = "todo" | "progress" | "verified" | "attention";

export type SetupStep = {
  id: SetupStepId;
  state: SetupState;
  title: SetupCopy;
  detail: SetupCopy;
};

export type SetupChecklist = {
  steps: SetupStep[];
  flags: SetupFlags;
  /** The owner pressed "Start": the lane is open. */
  started: boolean;
  /** "Skip for now" hides the lane until the owner reopens it from Home. */
  skipped: boolean;
  /** The four steps are verified. */
  done: boolean;
  /** The step the lane opens when the page has no other opinion: the first one that is not verified. */
  current: SetupStepId;
  /** Documents with passages. */
  documents: number;
};

function step(id: SetupStepId, state: SetupState): SetupStep {
  return { id, state, ...SETUP_STEP_WORDS[id] };
}

export async function setupChecklist(
  store: Store,
  environment: ChatEnvironment = process.env,
): Promise<SetupChecklist> {
  const flags = await readSetupFlags(store);
  const chat = await resolveChat({ environment, store });
  const chatRow = await store.readProviderSetting("chat");
  const passages = await store.countPassages();
  const documents = passages === 0 ? 0 : (await store.listDocuments()).length;
  // The business is read from the store this checklist was handed and not through the shared one of the environment:
  // the panel opens one store per request and the state of the steps describes that one.
  const business = await store.readBusiness();
  const named = (business?.name.trim() ?? "").length > 0;

  // The test of the provider is stored with the row (`tested_at`): a key that saved and answered is verified, a row
  // without a test is in progress, and a server that sets the provider is verified because it was proven where it was
  // installed.
  const chatVerified =
    chat.source === "server" ? chat.provider !== null : chatRow?.testedAt !== null && chatRow?.testedAt !== undefined;
  const chatStarted = chat.source === "server" || (chatRow !== null && chatRow.provider.trim().length > 0);

  const ai: SetupState = chatVerified ? "verified" : chatStarted ? "progress" : "todo";

  const information: SetupState = passages > 0 ? "verified" : "todo";

  // A wrong answer is looked at before a right one: a step marked right and then wrong asks for attention, because the
  // owner said the second answer was not what they needed.
  const tryStep: SetupState = flags.try_attention
    ? "attention"
    : flags.try_verified
      ? "verified"
      : passages > 0
        ? "progress"
        : "todo";

  // Decision 7: the fourth step is verified when the business has a name and the owner pressed "Publish". A color that
  // does not reach AA is adjusted by the public page and the page of Publish says so (decision 2 keeps the derived
  // state of a step to what the step did), so it never moves the state of this one.
  const publish: SetupState = flags.published && named ? "verified" : named ? "progress" : "todo";

  const steps = [
    step("ai", ai),
    step("information", information),
    step("try", tryStep),
    step("publish", publish),
  ];
  const done = steps.every((one) => one.state === "verified");
  const current = SETUP_STEP_ORDER.find((id) => steps.find((one) => one.id === id)?.state !== "verified") ?? "ai";

  return { steps, flags, started: flags.started || done, skipped: flags.skipped, done, current, documents };
}

export function stepState(checklist: SetupChecklist, id: SetupStepId): SetupState {
  return checklist.steps.find((one) => one.id === id)?.state ?? "todo";
}

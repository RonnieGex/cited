## Decisions

1. **Source of truth for the look and the words**: `PRODUCT.md` and the approved brief
   `katalis-dev/tasks/diseno-cited/brief-experiencia.md` (restrained color, lime only for "verified" and citations,
   light theme, Stripe-like steps that open in place, Notion-like documents, no modals, no environment variable names
   outside "For the installer", English first and Spanish complete). Read the references `onboard.md`,
   `interaction-design.md` and `ux-writing.md` of the `impeccable` skill before building.
2. **Step state is derived, not stored**, except one flag: step 1 is verified when the resolver returns a chat provider
   whose last test passed (or one set by the server); step 2 when at least one document has passages; step 3 when the
   owner pressed "This answer is right" (a row in `setup_flags`); step 4 when the business has a name and the owner
   pressed "Publish" (another flag). "Skip for now" hides the setup until the owner reopens it from Home.
3. **Uploads** accept several files at once (drag and drop plus a file button), processed one after another through
   the existing ingestion, each with its state in words (uploading, reading, splitting into passages, ready with N
   passages) and its failure reason with an action (type not supported, over the size limit, a PDF without text: "this
   looks like a scan; scanned PDFs are not supported yet", no text found, the AI or meaning search not connected).
4. **Sample business**: "Try it with a sample business" ingests `samples/` and fills an empty business name with Café La
   Horquilla, both undoable (remove the sample documents).
5. **Document page** `/admin/information/[id]`: the file name, type, when it was added, its passages grouped under their
   headings in reading order, and "Remove" with undo for a few seconds.
6. **Try it**: the ask box and the answer with its citation marks on the left; on the right the document of the chosen
   citation with that passage highlighted and scrolled into view; up to four suggested questions built from the
   headings of the documents (no model call to suggest them); a refusal says "The documents don't say" and suggests
   adding a document about it.
7. **Publish**: the business form beside a live preview (an `/embed` iframe of the public page that refreshes on save);
   the public link with copy and open; the widget snippet with its allowed sites; "Publish" sets the flag.
8. **Public page**: with no chat provider, "This assistant is not ready yet" and "Are you the owner? Set it up" linking
   `/admin`; always, under the ask box, "Answers are written by AI from this business's documents and can be wrong. Do
   not share personal data." and a "Privacy" link to `/privacy`, a page that names the providers the business uses and
   where they process data (from the provider catalogue), in both languages.
9. **Before code**, read the Next.js guides in `node_modules/next/dist/docs/` for layouts, route groups and file
   uploads of this version, as `AGENTS.md` requires.
10. **Step 1 refines the page of `provider-keys-in-panel`** (seen by Fable in its captures): the provider is chosen from
    one list of selectable rows (a radio group), each row carrying its one-line description, where it processes data,
    whether it offers meaning search and its "Get a key" link; the drop-down and the separate information list go away,
    so nothing appears twice. The key field opens under the chosen row. When `HOSTED_OFFER_URL` is set, "Prefer not to
    manage keys? Katalis runs it for you" sits under the list. The same component serves the step and the page "AI and
    keys".

## Amendment before the build (Fable, 2026-09-29, after `voice-owner-words` and `brand-identity-ui`)

11. **The base is the identity.** The branch starts from `main` once `brand-identity-ui` is merged: the workspace look,
    the numbered ink navigation, the citation mark, the highlighter, the kit components and `DESIGN.md` are the
    material of every new page; nothing here restyles them. The navigation takes the sections of the workspace in this
    order, each numbered with its citation mark: Home, Information, Try it, Conversations, Look and publish, AI and keys,
    Settings. The old landing page "Setup" (the list of variables that `brand-identity-ui` decision 30 left to this
    change) becomes the guided setup; the names of the variables live only on "For the installer", under Settings.
12. **What `main` already has is reused, not rebuilt.** The public page already answers "not ready" when no chat
    provider is connected (from `provider-keys-in-panel`): 3.5 keeps it and adds only the AI disclosure, the privacy
    link and `/privacy`. The page "AI and keys" is step 1 (decision 10 refines it). The voice agent screen, with its
    codes of `voice-owner-words`, moves under "Look and publish" as the third way to publish, after the page and the
    widget: "Talk to the documents", with the Orb of ElevenLabs UI as it already is.
13. **Thursday is the measure.** Franc shows "from zero to an answer" live on 2026-10-01 at 9:00. The E2E of 7.1 times it
    with the fake providers, and the delivery says the real time with DeepSeek as the chat provider (one manual run,
    recorded with its seconds per step, no key in the report).

## Amendment after the review of Codex (Fable, 2026-09-30, `katalis-dev/tasks/revision-community-13.md`)

14. **Green means usable.** Step 1 is verified only when the resolved chat provider can answer: set in the panel, its
    last test passed; set by the server, `chatProblem()` returns nothing (the key is present and the provider known).
    A server provider without its key shows the step as "needs attention" in the owner's words, with the link to "For
    the installer", the same judgement the public page makes when it says "not ready".
15. **A file is what its bytes say.** The size limit is checked from `file.size` before the file is read into memory.
    The type is decided by the content, not the extension: PDF and DOCX by their signatures; `.txt` and `.md` only when
    the bytes decode as UTF-8 with no NUL byte and no known binary signature (PNG, JPEG, GIF, ZIP, PDF); anything else
    is "type not supported" with the list of accepted types. A name with `..`, a slash or a control character is
    reduced to its base name before it is stored or shown.
16. **Undo leaves nothing of the sample.** Undoing the sample business removes its documents and, when the business name
    is still the one the sample set (Café La Horquilla), clears it back to empty; a name the owner typed after the
    sample is kept.
17. **The ports of the browser suite.** The fixed set is 3100 and 3210 to 3217 (the two servers this change adds use
    3216 and 3217); `playwright.config.ts` says so in one comment, and `docs/testing.md` or the README section on tests
    lists them.
18. **The real run of decision 13 is Fable's.** The key of DeepSeek never reaches an implementer: Fable runs the flow
    once on a local build with the key only in the environment of the server process, and records the seconds per step
    in the delivery. The implementer's part is that the flow is measurable, which the E2E of 7.1 already is.
19. **Evidence names its commit.** Every report of the amendment says the commit it validates, and the delivery keeps
    one current table of results; earlier numbers stay only as history under a dated heading.

## Second amendment after the review of Codex (Fable, 2026-09-30, `katalis-dev/tasks/revision-community-13b.md`)

20. **One rule for step 1, whatever the source.** Step 1 is verified only when `chatProblem()` returns nothing for the
    resolved provider; for a provider set in the panel its last test must also have passed. A key that can no longer
    be read (`keyState: "unreadable"`) shows the step as "needs attention", in the owner's words ("The saved key can no
    longer be read. Connect your AI again."), with the button that reopens step 1. This replaces the reading of
    decision 14 that kept "last test passed" as enough for the panel.
21. **A ZIP is not a DOCX.** A file starting with `PK\x03\x04` is a DOCX only when its archive holds `word/document.xml`;
    any other ZIP is "type not supported" with the list of accepted types, like every other rejected type.
22. **The browser suite leaves the tree clean.** The E2E writes its captures to an ignored folder (`test-results/` or
    `.data/`), never over a tracked image; the README and doc images are only re-rendered by their own scripts. A
    backslash in a file name stays a separator (decision 15): Windows paths are the risk that matters, and the name
    shown keeps its base name.

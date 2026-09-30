## Decisions

1. **Source of truth for the look and the words**: `PRODUCT.md` and the approved brief
   `katalis-dev/tasks/diseno-cited/brief-experiencia.md` (restrained color, lime only for "verified" and citations,
   light theme, Stripe-like steps that open in place, Notion-like documents, no modals, no environment variable names
   outside "For the installer", English first and Spanish complete). Read `C:\Users\Franc\.claude\skills\impeccable\reference\onboard.md`,
   `interaction-design.md` and `ux-writing.md` before building.
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

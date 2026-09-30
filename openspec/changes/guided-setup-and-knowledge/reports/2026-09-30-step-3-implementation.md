# Step 3: the implementation (tasks 3.1 to 3.5)

Date: 2026-09-30 (UTC). Branch `feature/guided-setup-and-knowledge`. Node of the round:

    $ npx -y -p node@24 node -v
    v24.21.0

The round that opened this change was cut in the middle, so this step finishes what it left and writes down what was
decided on the way. Every decision of `design.md` (1 to 13) has its place here.

## 3.1 The welcome, the guided setup and the workspace navigation (decisions 1, 2 and 11)

- **The welcome and the lane**: `app/admin/page.tsx` renders the four steps on the server and hands them to
  `components/setup/SetupSteps.tsx`, which is a client component with one piece of state: the step the owner is
  reading, kept in `?step=`. A first visit (no flag `started`) shows one sentence of value, "4 steps, about 5
  minutes" and the start button; "Skip for now" writes the `skipped` flag and the page says the setup is hidden and
  offers the way back, which is what decision 2 promises.
- **The state is derived, never stored** (`lib/admin/setup-checklist.ts`, `lib/admin/setup-flags.ts`): step 1 is
  verified when the chat provider answered its test (or the server set it), step 2 with a document that has passages,
  step 3 with the flag of a right answer, step 4 with a name and the flag of Publish. The only table this change adds
  is `setup_flags` in `lib/store/index.ts`.
- **The navigation** (`components/admin/AdminNav.tsx`): Home, Information, Try it, Conversations, Look and publish,
  AI and keys, Settings, each numbered with its citation mark. "For the installer" is a quiet link at the foot of the
  column and the only place of the panel where a variable of the environment is named, which is now the page
  `app/admin/settings/page.tsx` (the groups, their words and the two tests of the old page "Setup", which decision 30
  of `brand-identity-ui` left to this change).
- **Home** (`app/admin/home/page.tsx`): what is missing, each step a door back into the lane with that step open, the
  lane offered again when it was skipped, and the latest questions. The page did not exist in the cut round and the
  navigation already pointed at it.
- **Two addresses keep working**: `/admin/business` redirects to `/admin/publish` and `/admin/documents` to
  `/admin/information`, so a link somebody saved lands where the thing is.
- **No eyebrow above the h1**: the new pages do not repeat the name of the product, which is the rule the round
  `brand-identity-ui` fixed and its test reads.

## 3.2 Information (decisions 3, 4 and 5)

- **Uploads** (`components/setup/InfoPanel.tsx`): several files at once by drag and drop or by the file control, one
  request per file, and every file says what is happening to it and how it ended. The route
  (`app/api/admin/documents/route.ts`) answers one raw result per file — the name, whether it was read, its passages
  and the sentence of the ingestion — and the panel classifies that sentence with
  `lib/admin/upload-result.ts` and prints the words of the owner: a scan, too large, not a type we read, no text, the
  search not connected, or a plain failure, each with what to do. Nothing of the server is printed as it is.
- **The words moved to the dictionary**: `upload-result.ts` no longer keeps its own copy of the six sentences; it
  picks the pair of `lib/i18n/admin.ts` for the reason it classified, so the panel and the library say the same thing.
  The Spanish sentence of a file with no text is "Este archivo viene sin texto", which is the one the test asks for.
- **Several files at once, one failure alone**: a file that cannot be read is one result with `state: "failed"` and the
  request still answers 200, which is what lets the files after it be read (the scenario "A scanned PDF").
- **The sample business** (`lib/admin/samples.ts`, `app/api/admin/samples/route.ts`): the three documents of
  `samples/` in one press, the business name filled only when it is empty, and the names it added answered for the
  undo, which removes exactly those.
- **The document page** (`app/admin/information/[id]/page.tsx`, `components/setup/DocumentPanel.tsx`): the name, the
  type, when it was added, and the passages grouped under their headings in reading order
  (`lib/admin/document-sections.ts`). "Remove" opens a window of six seconds in which nothing has been deleted and
  offers "Keep it": the request leaves when the window closes, and the timer lives outside the component so walking to
  another page does not cancel the removal the owner asked for.

## 3.3 Try it (decision 6)

`components/setup/TryItPanel.tsx`, with `app/admin/try/page.tsx` as the page of the workspace: the question and the
answer with its citation marks on the left and the document of the chosen citation on the right, with that passage in
the highlighter and brought into view. **The first citation of an answer opens by itself**, so the owner reads the
passage without guessing which mark to press. Up to four suggested questions come from the headings of the documents
(`lib/admin/questions.ts`, no model call), and a refusal says the documents do not say it and what to add. "This answer
is right" writes the flag of the third step; "not right" asks for attention.

## 3.4 Publish with the live preview (decisions 7 and 12)

`components/setup/PublishPanel.tsx` and `app/admin/publish/page.tsx`: the business form — name, logo, color, tone,
language, forbidden topics and the two welcomes — beside the live preview, which is the real `/embed` and comes back
with the business that was just saved, without reloading the panel. The form is `components/admin/BusinessForm.tsx`,
which the page of the business already had and which now reports its save so the frame refreshes: one form for the
business, in one place. Beside it the public link with copy and open, and the widget code with its allowed sites. The
voice agent of `voice-owner-words` moved here as the third way to publish, with the Orb it already had, and its two
links now point at Settings and at Look and publish.

## 3.5 The public page and `/privacy` (decision 8)

- The public page already said "not ready" when no AI is connected; this change adds, under the ask box, the
  disclosure of AI and the link to privacy, in the language of the visitor.
- **`/embed` did not have the not-ready state** and now has it: the widget says the assistant is not ready and links
  the panel instead of offering a box that cannot answer, and it carries the same disclosure and the same link.
- **`/privacy`** (`app/privacy/page.tsx`) names the providers the business uses and where each one processes the data,
  from the catalogue, says what is kept and how to ask, in both languages, and it is public on purpose. The words moved
  from `lib/i18n/admin.ts` to `lib/i18n/public.ts`, which is the file of the public surface.

## What the cut round left and what this step changed

Kept as it was: the lane, `SetupLane`, the checklist and its flags, the samples, the questions, the document sections,
the two routes of the flags and of the try, and the words of the four steps. Finished or corrected here: the missing
dictionary keys (`question`, `questionColumn`, `loading`, `sources`, `citation()`, `errors`), the words of the uploads
in one place, the shape of the upload answer, `PanelPage` with the new sections, the pages Home, Settings, Information,
Try it, Publish and `/privacy`, the table `setup_flags` in the two tests that read the schema, the `lang` prop the lane
always needed, and the noise the cut round left in the staged tree (a `.bak` file that was never part of the change).

## Evidence

    $ npx -y -p node@24 node node_modules/vitest/vitest.mjs run tests/setup-checklist.test.ts \
        tests/setup-information.test.ts tests/setup-questions.test.ts tests/setup-routes.test.ts tests/setup-ui.test.tsx

     Test Files  5 passed (5)
          Tests  78 passed (78)

    $ npx -y -p node@24 node node_modules/typescript/bin/tsc --noEmit
    [exit=0] 0 errors

The suite changed the two cases of `tests/setup-ui.test.tsx` that were red for the reason this step fixed (the `lang`
of the lane, and three steps that say "To do" at once, which is what `getAllByText` reads), and it keeps the two known
cases of `tests/personal-paths.test.ts`, which are the absolute path of `design.md` (report of task 1.1).

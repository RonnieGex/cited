# Step 4: the review and update of the existing tests (task 4.1)

Date: 2026-09-30 (UTC). Branch `feature/guided-setup-and-knowledge`. Node of the round:

    $ npx -y -p node@24 node -v
    v24.21.0

The suite of the base was 78 of 79 files green with two known failures of `tests/personal-paths.test.ts` (the absolute
path inside the parenthetical of decision 1 of `design.md`, whose text this round may not edit). The change moved the
navigation, the name of three pages, the answer of an upload and the component that lists the providers, so the cases
of the rounds before it that read those things had to change with them. This report says which test changed and why.
Nothing of the behaviour those cases prove was removed: every one keeps its subject and reads the new shape.

## The navigation (decision 11)

- `tests/brand-panel.test.tsx`, "the numbered navigation of the panel": five sections in the order Setup, Business,
  Documents, Conversations, AI and keys → **seven** in the order Home, Information, Try it, Conversations, Look and
  publish, AI and keys, Settings, each with its citation mark. The current place moved from `/admin/documents` to
  `/admin/information`, and on `/admin` itself no section is current any more, because the guided setup is not one of
  the seven: the case now asserts exactly that.
- The same file's phone cases (the sideways scroll and the keyboard) changed their path and their `nth`, and the
  "stays at the start" case moved to `/admin/publish`. The measurements they prove did not change.
- `e2e/admin-brand.spec.ts`, the navigation at 1440 px and at 375 px: the same seven sections, and the path of the
  suite is `/admin/information`.

## The pages that moved

- The words of the old page "Setup" (the groups, the chips, the template of the two languages) live on "For the
  installer", which is `app/admin/settings/page.tsx` (decision 11). The cases that read them changed the page they
  render: `tests/design-md.test.ts`, `tests/brand-panel.test.tsx` ("paints the Setup chips", "the Setup page an owner
  can scan"), `tests/brand-round-14c-panel.test.tsx` (the Spanish template), `tests/admin-pages-variables.test.ts`,
  `tests/provider-panel-words.test.ts`, `tests/admin-unconfigured-words.test.tsx` and `e2e/admin.spec.ts`.
- "Business" is "Look and publish" (`/admin/publish`) and "Documents" is "Information" (`/admin/information`): the
  cases that walked them now walk the new pages, and the old addresses are redirects, which is why two cases that
  imported `app/admin/business/page` and `app/admin/documents/page` directly had to change their import: a redirect
  throws `NEXT_REDIRECT` when it is rendered.
- The link of the shell that cannot start says "For the installer" and points at `/admin/settings`, and the two links
  of the voice screen point at Settings and at Look and publish: `tests/admin-unconfigured-words.test.tsx`,
  `tests/voice-owner-words.test.ts` and `components/admin/VoiceAgent.tsx`.
- The guided setup lane is a client component, so the two files that render pages on the server without a router
  cannot render `/admin` any more. Their subject is that no page names a variable of the environment, and they keep it:
  they render the six pages that can be rendered there, and a new case reads the two files of the words of the setup
  (`lib/admin/setup-copy.ts` and `lib/admin/setup-checklist.ts`) and proves they name no variable either.
- Every page of the new round is in the list of titles of `tests/brand-round-14c-panel.test.tsx` and the list of pages
  of `e2e/admin-brand.spec.ts` (the signature of Katalis walks the panel), and the title of `/admin` is "Your setup"
  instead of the one of "For the installer".

## The answer of an upload (decision 3)

- `tests/admin-documents.test.ts`: the answer of `POST /api/admin/documents` is `results`, one per file, instead of
  `report`. A file that cannot be read is now one result with `state: "failed"` inside a 200, which is what lets the
  other files of the same upload be read; the case "refuses a type the ingestion does not accept" keeps its subject
  (nothing is ingested) and reads the new answer.
- The two cases that read the tables of the store (`tests/provider-settings.test.ts` and
  `tests/voice-store-state.test.ts`) now carry `setup_flags`, the one table this change adds.
- `tests/affiliate-links.test.ts` guards the hand-written list of the administrative routes of `e2e/affiliate.spec.ts`:
  the three new routes (`/api/admin/setup/flags`, `/api/admin/try/verify`, `/api/admin/samples`) are in that list, with
  their method and their body.

## The list of the providers (decision 10)

- `tests/provider-ui.test.tsx`: the provider is chosen from a list of selectable rows, so the cases that read the
  drop-down now check the radio of the provider, the row of the list carries its one honest line, and the link of a
  refused address points at `/admin/settings`. `e2e/providers.spec.ts` and `e2e/affiliate.spec.ts` connect a provider
  the same way.

## The cases of this change that changed

- `tests/setup-ui.test.tsx`: the lane takes the `lang` its siblings take, which the cut round had left out of its
  renders; `getAllByText` reads the three steps that say "To do" at once; the two InfoPanel renders no longer pass a
  `lang` the component does not use; and two new cases read the window of the undo of a document (decision 5).
- `tests/setup-information.test.ts`: the union of a result is narrowed by a helper, so the words of a failure can be
  read; `tests/setup-questions.test.ts`: the helper of the store takes a heading that may be null;
  `tests/setup-routes.test.ts`: `sessionToken()` is called with the secret and the moment it takes.

## The whole suite after the review

    $ npx -y -p node@24 node node_modules/vitest/vitest.mjs run

     Test Files  1 failed | 83 passed (84)
          Tests  2 failed | 971 passed (973)
       Duration  47.93s

The only red file is `tests/personal-paths.test.ts`, the two known cases of the base: the absolute path of the
parenthetical of decision 1 of `design.md` of this very change, recorded in the report of task 1.1 and in the delivery
as a broken case of the base that this round may not fix (the contract forbids editing the text of `design.md`).

## The checks of the code

    $ npx -y -p node@24 node node_modules/typescript/bin/tsc --noEmit
    [exit=0] 0 errors

    $ npx -y -p node@24 node node_modules/eslint/bin/eslint.js .
    [exit=0] 0 errors, 0 warnings

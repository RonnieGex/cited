## Why

With the keys in the panel (`provider-keys-in-panel`), the owner can connect their AI, but the panel still does not
guide them from nothing to a working answer, does not show what the system understood from each document, and gives
no place to try the assistant before publishing it. Franc's goal for Thursday is "from zero to an answer" in under five
minutes, live (2026-09-29), and the approved brief (`katalis-dev/tasks/diseno-cited/brief-experiencia.md`) describes
the four-step guided setup and a workspace where the business's information is at the center.

## What Changes

- **First visit**: `/admin` without a connected AI shows one sentence of value, "4 steps, about 5 minutes" and a start
  button.
- **Guided setup**: one page with four steps, each opening in place with its state (to do, in progress, verified with
  the lime mark, needs attention): 1 Connect your AI (the page of `provider-keys-in-panel`, embedded), 2 Add your
  information, 3 Try it, 4 Publish it. Skippable; progress kept; a finished owner does not see it again.
- **Your information**: drag several files, progress per file in words, clear reasons when one fails; "Try it with a
  sample business (Café La Horquilla)"; each document opens as a page with its sections and the passages as the system
  understood them.
- **Try it**: question and answer on the left, the cited passage highlighted inside its document on the right,
  suggested questions from the document headings, and "This answer is right" that verifies the step.
- **Publish it**: name, logo, color and welcome in English and Spanish with a live preview of the public page, the
  public link to copy and open, the widget code with its allowed sites.
- **Workspace** after the setup: side navigation (Home, Information, Try it, Conversations, Look and publish, AI and
  keys, Settings); Home shows what is missing and the latest conversations.
- **Public page honesty**: when the AI is not connected, "This assistant is not ready yet" with a link to the panel; on
  every public page, the AI disclosure and the privacy notice (a blocker of the legal review).

## Impact

- New: `app/admin/(setup)/`, `app/admin/information/`, `app/admin/try/`, `app/admin/publish/`, `components/setup/`,
  `components/knowledge/`, tests and E2E, `docs/owner-guide.md`.
- Changed: the panel layout and navigation, the business page (moves into "Look and publish"), the documents page
  (becomes "Information"), the public page and the widget (not-ready state, AI disclosure, privacy link), README.
- Specs: new capability `owner-setup`.

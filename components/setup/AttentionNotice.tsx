import Link from "next/link";
import { focusRing } from "@/components/ui";
import type { AdminStrings } from "@/lib/i18n/admin";

// Decision 14 of the amendment to `openspec/changes/guided-setup-and-knowledge/design.md`: a chat provider the server
// set that cannot answer (its key is missing, or the key saved in the panel cannot be read) shows the first step as
// "Needs attention" and says, in the words of the owner, that whoever installs Cited has to finish it. The link goes to
// the only screen of the panel that names the variables of the server (decision 11).
//
// Decision 20 of the second amendment: one rule for step 1, whatever the source. A provider saved in the panel whose
// key can no longer be read is a provider that cannot answer, so the step needs attention as well — and that provider
// is the owner's, not the installer's: the words say what happened and the button reopens step 1, which is where the
// key is connected again (the Major M-7 of `katalis-dev/tasks/revision-community-13b.md`).
//
// Decision 23 of the third amendment: a row of the panel that names a provider the catalogue does not know is the
// owner's too. It is not a key that stopped working but a provider Cited cannot use, so the words say that and the same
// button reopens step 1 (the Major M-8 of `katalis-dev/tasks/revision-community-13c.md`).
//
// Decision 24 of the fourth amendment: when the AI answers and the search is not chosen, the step asks for attention
// with the sentence of the decision and nothing else. The two doors that finish it — a meaning provider or search by
// words — live in the same step, under this notice, so this one has no action to send anywhere.
//
// It is a server component: the words come from the panel strings and the address is the page of the installer or the
// step of the AI.

export type AttentionSource = "server" | "panel" | "unknown" | "search";

export function AttentionNotice({ strings, source = "server" }: { strings: AdminStrings; source?: AttentionSource }) {
  const panel = source === "panel" || source === "unknown";
  const body =
    source === "server"
      ? strings.stepAttentionBody
      : source === "unknown"
        ? strings.stepUnknownProviderBody
        : source === "search"
          ? strings.stepSearchBody
          : strings.stepKeyBody;

  return (
    <div className="flex flex-col gap-1 border border-ink/20 p-4">
      <p className="max-w-[65ch] text-sm font-semibold text-ink" role="status">
        {body}
      </p>
      {panel ? (
        <p className="text-sm">
          <Link
            className={`inline-flex min-h-11 items-center rounded-none px-4 py-2 text-sm font-bold uppercase tracking-[0.05em] text-ink underline-offset-4 hover:underline ${focusRing}`}
            href="/admin?step=ai"
          >
            {strings.stepKeyAction}
          </Link>
        </p>
      ) : source === "server" ? (
        <p className="text-sm">
          <Link className={`font-semibold text-ink underline underline-offset-4 ${focusRing}`} href="/admin/settings">
            {strings.panelInstaller}
          </Link>
        </p>
      ) : null}
    </div>
  );
}

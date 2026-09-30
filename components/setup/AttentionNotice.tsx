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
// It is a server component: the words come from the panel strings and the address is the page of the installer or the
// step of the AI.

export type AttentionSource = "server" | "panel";

export function AttentionNotice({ strings, source = "server" }: { strings: AdminStrings; source?: AttentionSource }) {
  const panel = source === "panel";

  return (
    <div className="flex flex-col gap-1 border border-ink/20 p-4">
      <p className="max-w-[65ch] text-sm font-semibold text-ink" role="status">
        {panel ? strings.stepKeyBody : strings.stepAttentionBody}
      </p>
      <p className="text-sm">
        {panel ? (
          <Link
            className={`inline-flex min-h-11 items-center rounded-none px-4 py-2 text-sm font-bold uppercase tracking-[0.05em] text-ink underline-offset-4 hover:underline ${focusRing}`}
            href="/admin?step=ai"
          >
            {strings.stepKeyAction}
          </Link>
        ) : (
          <Link className={`font-semibold text-ink underline underline-offset-4 ${focusRing}`} href="/admin/settings">
            {strings.panelInstaller}
          </Link>
        )}
      </p>
    </div>
  );
}

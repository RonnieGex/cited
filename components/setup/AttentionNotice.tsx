import Link from "next/link";
import { focusRing } from "@/components/ui";
import type { AdminStrings } from "@/lib/i18n/admin";

// Decision 14 of the amendment to `openspec/changes/guided-setup-and-knowledge/design.md`: a chat provider the server
// set that cannot answer (its key is missing, or the key saved in the panel cannot be read) shows the first step as
// "Needs attention" and says, in the words of the owner, that whoever installs Cited has to finish it. The link goes to
// the only screen of the panel that names the variables of the server (decision 11).
//
// It is a server component: the words come from the panel strings and the address is the page of the installer.

export function AttentionNotice({ strings }: { strings: AdminStrings }) {
  return (
    <div className="flex flex-col gap-1 border border-ink/20 p-4">
      <p className="max-w-[65ch] text-sm font-semibold text-ink" role="status">
        {strings.stepAttentionBody}
      </p>
      <p className="text-sm">
        <Link className={`font-semibold text-ink underline underline-offset-4 ${focusRing}`} href="/admin/settings">
          {strings.panelInstaller}
        </Link>
      </p>
    </div>
  );
}

import type { ReactNode } from "react";
import { BuiltByKatalis } from "@/components/admin/BuiltByKatalis";
import { Wordmark } from "@/components/brand";
import { highlightLast } from "@/lib/brand/highlight";
import type { AdminStrings } from "@/lib/i18n/admin";

// Decision 8 of `openspec/changes/brand-identity-ui/design.md`: the shell of every page of the panel that has no session,
// the sign-in and the page that says the server is not ready. Two halves from 1024 px (ink with the wordmark, the tagline
// and the flame; paper with the content), stacked below it with the ink first.
//
// The highlighter of the tagline is `.hl-on-ink`: a solid lime block with ink text, because the marker of `.hl` alone (lime under
// the lower half of the line) would put the paper text of the ink ground over lime, which is 1.1:1.

export type AuthShellProps = {
  strings: AdminStrings;
  children: ReactNode;
};

export function AuthShell({ strings, children }: AuthShellProps) {
  const { lead, tail } = highlightLast(strings.tagline);

  return (
    <main data-admin="auth" className="grid min-h-screen bg-paper text-ink lg:grid-cols-2">
      <div className="flex flex-col justify-between gap-12 bg-ink px-6 py-10 text-paper lg:px-16 lg:py-16">
        <Wordmark size="md" tone="ink" />
        <p
          data-admin="tagline"
          className="max-w-[16ch] text-[32px] font-semibold leading-[1.15] tracking-[-0.02em] lg:text-[48px]"
        >
          {lead}
          {tail === "" ? null : (
            <span className="hl hl-on-ink hl-sweep">
              {tail}
            </span>
          )}
        </p>
        <BuiltByKatalis label={strings.builtBy} />
      </div>
      <div className="flex items-center justify-center bg-paper px-6 py-12 lg:px-16">
        <div className="w-full max-w-[420px]">{children}</div>
      </div>
    </main>
  );
}

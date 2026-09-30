import { SectionTitle } from "@/components/ui";
import type { ProviderView } from "@/lib/admin/provider-panel";
import type { AdminStrings } from "@/lib/i18n/admin";
import { signupLink, type ProviderEntry } from "@/lib/providers/catalog";
import type { Lang } from "@/lib/settings/business";
import { ProviderConnect } from "./ProviderConnect";
import { ProviderConnected } from "./ProviderConnected";

// Decision 10 of `openspec/changes/guided-setup-and-knowledge/design.md`: the list of `ProviderConnect` is the one the
// owner reads, so the separate information list of `ProviderState` goes away and nothing appears twice. What stays is
// the connected state, which is what the page "AI and keys" shows once a provider answered its test.

export type ProviderStateProps = {
  kind: "chat" | "embeddings";
  lang: Lang;
  strings: AdminStrings;
  entries: ProviderEntry[];
  view: ProviderView;
  offer: string;
  affiliate: boolean;
  encryptionReady: boolean;
  reindex: { documents: number; passages: number };
};

export function ProviderState({
  kind,
  lang,
  strings,
  entries,
  view,
  offer,
  affiliate,
  encryptionReady,
  reindex,
}: ProviderStateProps) {
  const title = kind === "chat" ? strings.answersSection : strings.meaningSection;
  const intro = kind === "chat" ? strings.answersIntro : strings.meaningIntro;
  const entry = entries.find((candidate) => candidate.id === view.provider) ?? null;
  const connected = view.source !== "none" && view.provider !== null;
  // The provider of the deterministic tests is not in the catalogue, because the owner never chooses it: it is what
  // whoever installs sets on the server for a first run, and the panel names it in words.
  const name =
    view.mode === "keyword"
      ? strings.keywordActive
      : (entry?.name ?? (view.provider === "fake" ? strings.testProvider : String(view.provider)));
  // The signup link of every row is resolved here, on the server, where the environment of the installation is:
  // `ProviderConnect` runs in the browser and cannot read the affiliate programme of a provider from there.
  const links = Object.fromEntries(
    entries.map((candidate) => [candidate.id, signupLink(candidate, { affiliateLinks: affiliate })]),
  );

  return (
    <section aria-label={title} className="flex flex-col gap-4">
      <SectionTitle level="h2">{title}</SectionTitle>
      <p className="max-w-[65ch] text-ink/80">{intro}</p>

      {connected ? (
        <ProviderConnected kind={kind} name={name} reindex={reindex} strings={strings} view={view} />
      ) : (
        <>
          <p className="text-sm font-semibold text-ink">{strings.notConnected}</p>
          <ProviderConnect
            encryptionReady={encryptionReady}
            entries={entries}
            initialProvider={view.provider}
            keyword={kind === "embeddings"}
            kind={kind}
            lang={lang}
            links={links}
            offer={offer}
            strings={strings}
          />
        </>
      )}
    </section>
  );
}

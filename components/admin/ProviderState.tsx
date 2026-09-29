import { Panel, SectionTitle } from "@/components/ui";
import type { ProviderView } from "@/lib/admin/provider-panel";
import type { AdminStrings } from "@/lib/i18n/admin";
import { signupLink, type ProviderEntry } from "@/lib/providers/catalog";
import type { Lang } from "@/lib/settings/business";
import { ProviderConnect } from "./ProviderConnect";
import { ProviderConnected } from "./ProviderConnected";

// Decision 8 of `openspec/changes/provider-keys-in-panel/design.md`: the section shows the connected provider or the
// honest list of providers, one line on cost and speed each, where each one processes the data, whether it offers
// meaning search and a link to get a key. "AI and keys" is built with the kit and with `PRODUCT.md`: no `CHIP` of
// `MISSING`, no jargon, and the hosted offer under the list.

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

const row = "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1";

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

  return (
    <section aria-label={title} className="flex flex-col gap-4">
      <SectionTitle level="h2">{title}</SectionTitle>
      <p className="max-w-[65ch] text-ink/80">{intro}</p>

      {connected ? (
        <ProviderConnected
          kind={kind}
          name={entry?.name ?? String(view.provider)}
          reindex={reindex}
          strings={strings}
          view={view}
        />
      ) : (
        <>
          <p className="text-sm font-semibold text-ink">{strings.notConnected}</p>
          <ProviderConnect
            encryptionReady={encryptionReady}
            entries={entries}
            initialProvider={view.provider}
            keyword={kind === "embeddings"}
            kind={kind}
            strings={strings}
          />
          <Panel className="flex flex-col gap-3">
            <ul aria-label={title} className="flex flex-col gap-3">
              {entries.map((candidate) => {
                const link = signupLink(candidate, { affiliateLinks: affiliate });

                return (
                  <li className={row} key={candidate.id}>
                    <div className="flex max-w-[52ch] flex-col gap-1">
                      <span className="font-semibold text-ink">{candidate.name}</span>
                      <span className="text-sm text-ink/80">{candidate.cost[lang]}</span>
                      <span className="text-sm text-ink/80">{candidate.processing[lang]}</span>
                      <span className="text-sm text-ink/80">
                        {candidate.embeddings ? strings.meansYes : strings.meansNo}
                      </span>
                    </div>
                    <span className="flex items-baseline gap-2">
                      <a
                        className="text-sm font-semibold text-ink underline underline-offset-4"
                        href={link.href}
                        rel="noreferrer noopener"
                        target="_blank"
                      >
                        {strings.getKey}
                      </a>
                      {link.paid ? (
                        <span className="text-sm text-ink/70">{strings.paidLink}</span>
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ul>
            {offer.length === 0 ? null : (
              <p className="border-t border-ink/10 pt-3 text-sm text-ink">
                <a
                  className="font-semibold underline underline-offset-4"
                  href={offer}
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  {strings.hostedOffer}
                </a>
              </p>
            )}
          </Panel>
        </>
      )}
    </section>
  );
}

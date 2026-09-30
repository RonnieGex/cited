import { cookies } from "next/headers";
import { ProviderState } from "@/components/admin/ProviderState";
import { SectionTitle } from "@/components/ui";
import { providerPanelState } from "@/lib/admin/provider-panel";
import { adminStrings } from "@/lib/i18n/admin";
import { LANG_COOKIE, resolveLang } from "@/lib/i18n/language";
import { affiliateLinks, chatCatalogue, embeddingsCatalogue, hostedOfferOf } from "@/lib/providers/catalog";
import { sharedStore } from "@/lib/store/instance";
import { panelMetadata } from "@/lib/admin/titles";

// Decision 8 of `openspec/changes/provider-keys-in-panel/design.md`: the page "AI and keys" (`/admin/ai`), with the
// two sections "Answers" and "Meaning search", built with the kit and with `PRODUCT.md`. It reads the state through
// the resolver and shows only what an owner may see again: the provider, the model, the last four characters, the last
// test and where the value comes from. No name of a variable of the environment appears on this page.

export const dynamic = "force-dynamic";

// Decision 24 of `openspec/changes/brand-identity-ui/design.md`: the title of this page, in the language of the panel.
export async function generateMetadata() {
  return panelMetadata("ai");
}

export default async function AdminAi() {
  const stored = await cookies();
  const lang = resolveLang(stored.get(LANG_COOKIE)?.value, "en");
  const strings = adminStrings(lang);
  const store = await sharedStore(process.env);
  const state = await providerPanelState(process.env, store);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <SectionTitle level="h1" eyebrow={strings.panelEyebrow}>
          {strings.aiTitle}
        </SectionTitle>
        <p className="max-w-[65ch] text-ink/80">{strings.aiIntro}</p>
      </div>

      <ProviderState
        affiliate={affiliateLinks(process.env)}
        encryptionReady={state.encryption}
        entries={chatCatalogue(process.env)}
        kind="chat"
        lang={lang}
        offer={hostedOfferOf(process.env)}
        reindex={state.reindex}
        strings={strings}
        view={state.chat}
      />

      <ProviderState
        affiliate={affiliateLinks(process.env)}
        encryptionReady={state.encryption}
        entries={embeddingsCatalogue(process.env)}
        kind="embeddings"
        lang={lang}
        offer={hostedOfferOf(process.env)}
        reindex={state.reindex}
        strings={strings}
        view={state.embeddings}
      />
    </div>
  );
}

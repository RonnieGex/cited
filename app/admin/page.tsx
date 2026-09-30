import { cookies, headers } from "next/headers";
import { ProviderState } from "@/components/admin/ProviderState";
import { AttentionNotice } from "@/components/setup/AttentionNotice";
import { InfoPanel } from "@/components/setup/InfoPanel";
import { SetupSteps } from "@/components/setup/SetupSteps";
import { TryItPanel } from "@/components/setup/TryItPanel";
import { PublishPanel } from "@/components/setup/PublishPanel";
import { documentSummaries } from "@/lib/admin/documents";
import { providerPanelState } from "@/lib/admin/provider-panel";
import { suggestedQuestions } from "@/lib/admin/questions";
import { setupChecklist, stepState } from "@/lib/admin/setup-checklist";
import { adminStrings } from "@/lib/i18n/admin";
import { LANG_COOKIE, resolveLang } from "@/lib/i18n/language";
import { affiliateLinks, chatCatalogue, embeddingsCatalogue, hostedOfferOf } from "@/lib/providers/catalog";
import { readBusiness } from "@/lib/settings/business";
import { sharedStore } from "@/lib/store/instance";
import { panelMetadata } from "@/lib/admin/titles";
import { allowedOrigins } from "@/lib/headers/csp";

// The guided setup (decisions 1 and 2): one page with the four steps, each opening in place with its state, and the
// content of every step rendered here on the server. A first visit shows the welcome; a finished owner sees the four
// steps verified and not the lane again.

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return panelMetadata("setup");
}

export default async function AdminSetup() {
  const stored = await cookies();
  const lang = resolveLang(stored.get(LANG_COOKIE)?.value, "en");
  const strings = adminStrings(lang);
  const store = await sharedStore(process.env);
  const checklist = await setupChecklist(store, process.env);
  const documents = await documentSummaries(store);
  const passages = await store.getPassages({ limit: 500 });
  const grouped = documents.map((document) => ({
    name: document.name,
    passages: passages.filter((passage) => passage.name === document.name),
  }));
  const provider = await providerPanelState(process.env, store);
  const business = await readBusiness();
  const suggestions = await suggestedQuestions(store, lang);
  const origin = await siteOrigin();
  return (
    <SetupSteps checklist={checklist} lang={lang} strings={strings}>
      {{
        ai: (
          <div className="flex flex-col gap-10">
            {/* Decision 14 of the amendment: a chat provider the server set that cannot answer shows the first step
                as needing attention, and this is the way to the only page that names the variables of the server. */}
            {stepState(checklist, "ai") === "attention" ? <AttentionNotice strings={strings} /> : null}
            {/* Decision 10: the page "AI and keys" is the first step, so the two sections of that page live here: the
                answers and the search. The second one is what lets a business whose provider has no meaning search
                keep going with search by words, which is the door the uploads of step 2 need. */}
            <ProviderState
              affiliate={affiliateLinks(process.env)}
              encryptionReady={provider.encryption}
              entries={chatCatalogue(process.env)}
              kind="chat"
              lang={lang}
              offer={hostedOfferOf(process.env)}
              reindex={provider.reindex}
              strings={strings}
              view={provider.chat}
            />
            <ProviderState
              affiliate={affiliateLinks(process.env)}
              encryptionReady={provider.encryption}
              entries={embeddingsCatalogue(process.env)}
              kind="embeddings"
              lang={lang}
              offer={hostedOfferOf(process.env)}
              reindex={provider.reindex}
              strings={strings}
              view={provider.embeddings}
            />
          </div>
        ),
        information: (
          <InfoPanel
            documents={documents}
            sampleLoaded={checklist.documents > 0}
            strings={strings}
          />
        ),
        try: (
          <TryItPanel
            documents={grouped}
            lang={lang}
            strings={strings}
            suggestions={suggestions}
          />
        ),
        publish: (
          <PublishPanel
            business={business}
            published={checklist.flags.published}
            site={origin}
            strings={strings}
            widgetSites={allowedOrigins(process.env["ALLOWED_ORIGINS"])}
          />
        ),
      }}
    </SetupSteps>
  );
}

// The origin of the installation, which is what the public link and the widget code carry. It is read from the request
// headers on the server, so no environment variable has to hold it and nothing is hard-coded.
async function siteOrigin(): Promise<string> {
  const found = await headers();
  const host = found.get("host") ?? "localhost:3000";
  const forwarded = found.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "";

  return `${forwarded.length > 0 ? forwarded : "http"}://${host}`;
}

import { cookies, headers } from "next/headers";
import { VoiceAgent } from "@/components/admin/VoiceAgent";
import { PublishPanel } from "@/components/setup/PublishPanel";
import { SectionTitle } from "@/components/ui";
import { setupChecklist } from "@/lib/admin/setup-checklist";
import { adminStrings } from "@/lib/i18n/admin";
import { LANG_COOKIE, resolveLang } from "@/lib/i18n/language";
import { allowedOrigins } from "@/lib/headers/csp";
import { readBusiness } from "@/lib/settings/business";
import { sharedStore } from "@/lib/store/instance";
import { panelMetadata } from "@/lib/admin/titles";

export const dynamic = "force-dynamic";

// Decision 7: "Look and publish" is the fourth step of the guided setup as a page of the workspace: the business form
// beside the live preview of the public page, the public link, the widget code with its allowed sites.
//
// Decision 12: the voice agent of `voice-owner-words` moves here as the third way to publish, after the page and the
// widget, with the Orb it already has.

export async function generateMetadata() {
  return panelMetadata("publish");
}

export default async function AdminPublish() {
  const stored = await cookies();
  const lang = resolveLang(stored.get(LANG_COOKIE)?.value, "en");
  const strings = adminStrings(lang);
  const store = await sharedStore(process.env);
  const checklist = await setupChecklist(store, process.env);
  const business = await readBusiness();
  const agent = await store.readVoiceAgent();
  const found = await headers();
  const host = found.get("host") ?? "localhost:3000";
  const forwarded = found.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "";
  const site = `${forwarded.length > 0 ? forwarded : "http"}://${host}`;

  return (
    <div className="flex flex-col gap-8">
      <SectionTitle level="h1">
        {strings.navPublish}
      </SectionTitle>
      <p className="max-w-[65ch] text-ink/80">{strings.businessIntro}</p>
      <PublishPanel
        business={business}
        published={checklist.flags.published}
        site={site}
        strings={strings}
        widgetSites={allowedOrigins(process.env["ALLOWED_ORIGINS"])}
      />
      <VoiceAgent
        lang={lang}
        status={{ agentId: agent?.agentId ?? null, updatedAt: agent?.updatedAt ?? null }}
      />
    </div>
  );
}

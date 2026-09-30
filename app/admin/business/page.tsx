import { cookies } from "next/headers";
import { BusinessForm } from "@/components/admin/BusinessForm";
import { VoiceAgent } from "@/components/admin/VoiceAgent";
import { SectionTitle } from "@/components/ui";
import { adminStrings } from "@/lib/i18n/admin";
import { LANG_COOKIE, resolveLang } from "@/lib/i18n/language";
import { readBusiness } from "@/lib/settings/business";
import { sharedStore } from "@/lib/store/instance";

export default async function AdminBusiness() {
  const stored = await cookies();
  const lang = resolveLang(stored.get(LANG_COOKIE)?.value, "en");
  const strings = adminStrings(lang);
  const agent = await (await sharedStore(process.env)).readVoiceAgent();

  return (
    <div className="flex flex-col gap-8">
      <SectionTitle level="h1">
        {strings.businessTitle}
      </SectionTitle>
      <p className="max-w-[65ch] text-ink/80">{strings.businessIntro}</p>
      <BusinessForm business={await readBusiness()} strings={strings} />
      <VoiceAgent
        lang={lang}
        status={{ agentId: agent?.agentId ?? null, updatedAt: agent?.updatedAt ?? null }}
      />
    </div>
  );
}

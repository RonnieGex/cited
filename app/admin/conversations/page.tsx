import { cookies } from "next/headers";
import { ConversationsPanel } from "@/components/admin/ConversationsPanel";
import { SectionTitle } from "@/components/ui";
import { conversationSummaries } from "@/lib/admin/conversations";
import { adminStrings } from "@/lib/i18n/admin";
import { LANG_COOKIE, resolveLang } from "@/lib/i18n/language";
import { sharedStore } from "@/lib/store/instance";

export default async function AdminConversations() {
  const stored = await cookies();
  const lang = resolveLang(stored.get(LANG_COOKIE)?.value, "en");
  const strings = adminStrings(lang);
  const store = await sharedStore(process.env);

  return (
    <div className="flex flex-col gap-8">
      <SectionTitle level="h1">
        {strings.conversationsTitle}
      </SectionTitle>
      <p className="max-w-[65ch] text-ink/80">{strings.conversationsIntro}</p>
      <ConversationsPanel
        conversations={await conversationSummaries(store)}
        lang={lang}
        strings={strings}
        timeZone={Intl.DateTimeFormat().resolvedOptions().timeZone}
      />
    </div>
  );
}

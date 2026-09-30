import { cookies } from "next/headers";
import { DocumentsPanel } from "@/components/admin/DocumentsPanel";
import { SectionTitle } from "@/components/ui";
import { documentSummaries } from "@/lib/admin/documents";
import { adminStrings } from "@/lib/i18n/admin";
import { LANG_COOKIE, resolveLang } from "@/lib/i18n/language";
import { sharedStore } from "@/lib/store/instance";
import { panelMetadata } from "@/lib/admin/titles";

// Decision 24 of `openspec/changes/brand-identity-ui/design.md`: the title of this page, in the language of the panel.
export async function generateMetadata() {
  return panelMetadata("documents");
}

export default async function AdminDocuments() {
  const stored = await cookies();
  const strings = adminStrings(resolveLang(stored.get(LANG_COOKIE)?.value, "en"));
  const store = await sharedStore(process.env);

  return (
    <div className="flex flex-col gap-8">
      <SectionTitle level="h1">
        {strings.documentsTitle}
      </SectionTitle>
      <p className="max-w-[65ch] text-ink/80">{strings.documentsIntro}</p>
      <DocumentsPanel documents={await documentSummaries(store)} strings={strings} />
    </div>
  );
}

import Link from "next/link";
import { cookies } from "next/headers";
import { InfoPanel } from "@/components/setup/InfoPanel";
import { SectionTitle } from "@/components/ui";
import { documentSummaries } from "@/lib/admin/documents";
import { adminStrings } from "@/lib/i18n/admin";
import { LANG_COOKIE, resolveLang } from "@/lib/i18n/language";
import { sharedStore } from "@/lib/store/instance";
import { panelMetadata } from "@/lib/admin/titles";

// Decision 11: "Information" is where the business's own documents live once the setup is done, and it is the same
// component the second step of the guided setup embeds, so the owner learns one screen and not two.

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return panelMetadata("information");
}

export default async function AdminInformation() {
  const stored = await cookies();
  const lang = resolveLang(stored.get(LANG_COOKIE)?.value, "en");
  const strings = adminStrings(lang);
  const store = await sharedStore(process.env);
  const documents = await documentSummaries(store);

  return (
    <div className="flex flex-col gap-8">
      <SectionTitle level="h1">
        {strings.navInformation}
      </SectionTitle>
      <p className="max-w-[65ch] text-ink/80">{strings.documentsIntro}</p>
      <InfoPanel documents={documents} sampleLoaded={documents.length > 0} strings={strings} />
      <p>
        <Link className="text-sm font-semibold text-ink underline underline-offset-4" href="/admin">
          {strings.setupReopen}
        </Link>
      </p>
    </div>
  );
}

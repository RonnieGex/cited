import Link from "next/link";
import { cookies } from "next/headers";
import { TryItPanel } from "@/components/setup/TryItPanel";
import { SectionTitle } from "@/components/ui";
import { documentSummaries } from "@/lib/admin/documents";
import { suggestedQuestions } from "@/lib/admin/questions";
import { adminStrings } from "@/lib/i18n/admin";
import { LANG_COOKIE, resolveLang } from "@/lib/i18n/language";
import { sharedStore } from "@/lib/store/instance";
import { panelMetadata } from "@/lib/admin/titles";

// Decision 11: "Try it" lives in the workspace as well as inside the third step of the guided setup, and it is the
// same component in both places.

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return panelMetadata("try");
}

export default async function AdminTry() {
  const stored = await cookies();
  const lang = resolveLang(stored.get(LANG_COOKIE)?.value, "en");
  const strings = adminStrings(lang);
  const store = await sharedStore(process.env);
  const documents = await documentSummaries(store);
  const passages = await store.getPassages({ limit: 500 });
  const grouped = documents.map((document) => ({
    name: document.name,
    passages: passages.filter((passage) => passage.name === document.name),
  }));

  return (
    <div className="flex flex-col gap-8">
      <SectionTitle level="h1">
        {strings.navTry}
      </SectionTitle>
      <TryItPanel
        documents={grouped}
        lang={lang}
        strings={strings}
        suggestions={await suggestedQuestions(store, lang)}
      />
      <p>
        <Link className="text-sm font-semibold text-ink underline underline-offset-4" href="/admin/information">
          {strings.setupReopen}
        </Link>
      </p>
    </div>
  );
}

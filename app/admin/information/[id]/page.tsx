import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { DocumentPanel } from "@/components/setup/DocumentPanel";
import { SectionTitle } from "@/components/ui";
import { documentSummaries } from "@/lib/admin/documents";
import { adminStrings } from "@/lib/i18n/admin";
import { LANG_COOKIE, resolveLang } from "@/lib/i18n/language";
import { sharedStore } from "@/lib/store/instance";
import { panelMetadata } from "@/lib/admin/titles";

// Decision 5 of `openspec/changes/guided-setup-and-knowledge/design.md`: `/admin/information/[id]` is a document as a
// page: its file name, its type, when it was added, and its passages grouped under their headings in reading order, as
// the store keeps them. The address may name the passage a citation opened (`?highlight=`): that one is painted with
// the highlighter, with its lead outside it (decision 11 of the amendment to `passage-display-polish`).

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return panelMetadata("document");
}

export default async function AdminDocument({ params, searchParams }: PageProps<"/admin/information/[id]">) {
  const { id } = await params;
  const query = await searchParams;
  const name = decodeURIComponent(id);
  const asked = typeof query.highlight === "string" ? Number.parseInt(query.highlight, 10) : Number.NaN;
  const highlight = Number.isNaN(asked) ? null : asked;
  const stored = await cookies();
  const lang = resolveLang(stored.get(LANG_COOKIE)?.value, "en");
  const strings = adminStrings(lang);
  const store = await sharedStore(process.env);
  const summary = (await documentSummaries(store)).find((document) => document.name === name);

  if (summary === undefined) {
    notFound();
  }

  const passages = await store.getPassages({ name, limit: 500 });

  return (
    <div className="flex flex-col gap-8">
      <SectionTitle level="h1">
        {strings.documentName}
      </SectionTitle>
      <DocumentPanel
        document={summary}
        highlight={highlight}
        lang={lang}
        passages={passages}
        strings={strings}
      />
    </div>
  );
}

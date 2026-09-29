import { cookies } from "next/headers";
import { TestButton } from "@/components/admin/TestButton";
import { Chip, Panel, SectionTitle } from "@/components/ui";
import { exampleText, setupGroups } from "@/lib/admin/setup";
import { adminStrings } from "@/lib/i18n/admin";
import { LANG_COOKIE, resolveLang } from "@/lib/i18n/language";

const row = "flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 py-2";

export default async function AdminSetup() {
  const stored = await cookies();
  const strings = adminStrings(resolveLang(stored.get(LANG_COOKIE)?.value, "en"));
  const groups = setupGroups(exampleText(), process.env);

  return (
    <div className="flex flex-col gap-8">
      <SectionTitle level="h1" eyebrow={strings.panelEyebrow}>
        {strings.setupTitle}
      </SectionTitle>
      <p className="max-w-[65ch] text-ink/80">{strings.setupIntro}</p>

      <div className="flex flex-wrap gap-4">
        <TestButton strings={strings} target="chat" />
        <TestButton strings={strings} target="embeddings" />
      </div>

      {groups.map((group) => (
        <Panel key={group.title} className="flex flex-col gap-3">
          <SectionTitle level="h2">{group.title}</SectionTitle>
          {group.detail.length === 0 ? null : (
            <p className="max-w-[65ch] text-sm text-ink/80">{group.detail}</p>
          )}
          <ul>
            {group.variables.map((variable) => (
              <li className={row} key={variable.name}>
                <span className="font-mono text-sm text-ink">{variable.name}</span>
                <Chip>{variable.configured ? strings.configured : strings.missing}</Chip>
              </li>
            ))}
          </ul>
        </Panel>
      ))}
    </div>
  );
}

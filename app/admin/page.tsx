import { cookies } from "next/headers";
import { TestButton } from "@/components/admin/TestButton";
import { Chip, Panel, SectionTitle, focusRing } from "@/components/ui";
import { exampleText, setupGroups, type SetupGroup } from "@/lib/admin/setup";
import { adminStrings, type AdminStrings } from "@/lib/i18n/admin";
import { LANG_COOKIE, resolveLang } from "@/lib/i18n/language";
import { panelMetadata } from "@/lib/admin/titles";

const row = "flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 py-2";

/**
 * The values of one group. A set value carries the kit chip; a missing one is plain ink-2 words in sentence case, so the two
 * never look alike and no capital badge shouts. Lime stays for a citation, a verified step and the current place.
 */
function Settings({ group, detail, strings }: { group: SetupGroup; detail: string; strings: AdminStrings }) {
  return (
    <>
      {detail.length === 0 ? null : <p className="max-w-[65ch] text-sm text-ink/80">{detail}</p>}
      <ul>
        {group.variables.map((variable) => (
          <li className={row} key={variable.name}>
            <span className="font-mono text-sm text-ink">{variable.name}</span>
            {variable.configured ? (
              <Chip>{strings.configured}</Chip>
            ) : (
              <span className="text-sm text-ink-2">{strings.missing}</span>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

// Decision 24 of `openspec/changes/brand-identity-ui/design.md`: the title of this page, in the language of the panel.
export async function generateMetadata() {
  return panelMetadata("setup");
}

export default async function AdminSetup() {
  const stored = await cookies();
  const strings = adminStrings(resolveLang(stored.get(LANG_COOKIE)?.value, "en"));
  const groups = setupGroups(exampleText(), process.env);

  return (
    <div className="flex flex-col gap-8">
      <SectionTitle level="h1">
        {strings.setupTitle}
      </SectionTitle>
      <p className="max-w-[65ch] text-ink/80">{strings.setupIntro}</p>

      <div className="flex flex-wrap gap-4">
        <TestButton strings={strings} target="chat" />
        <TestButton strings={strings} target="embeddings" />
      </div>

      {groups.map((group) => {
        // Decision 29: the words of a group come from the table of the language of the panel, keyed by the id of the group
        // in the template; the text of the template is only the fallback for a group that has no entry yet. The one group
        // that stays open is the one the template marks as required, not the one whose English title says so.
        const words = strings.setupGroups[group.id] ?? { title: group.title, detail: group.detail };

        return (
          <Panel className="flex flex-col gap-3" data-admin="setup-group" key={group.id}>
            <SectionTitle level="h2">{words.title}</SectionTitle>
            {group.required ? (
              <Settings group={group} detail={words.detail} strings={strings} />
            ) : (
              <details>
                {/* A list item, so the summary keeps the disclosure triangle; 44 px tall for a thumb. */}
                <summary className={`-mx-2 min-h-11 cursor-pointer px-2 py-3 text-sm font-semibold text-ink ${focusRing}`}>
                  {strings.setupCount
                    .replace("{set}", String(group.variables.filter((variable) => variable.configured).length))
                    .replace("{total}", String(group.variables.length))}
                </summary>
                <div className="flex flex-col gap-3 pt-2">
                  <Settings group={group} detail={words.detail} strings={strings} />
                </div>
              </details>
            )}
          </Panel>
        );
      })}
    </div>
  );
}

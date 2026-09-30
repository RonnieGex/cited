import { cookies } from "next/headers";
import { TestButton } from "@/components/admin/TestButton";
import { Chip, Panel, SectionTitle, focusRing } from "@/components/ui";
import { exampleText, setupGroups, type SetupGroup } from "@/lib/admin/setup";
import { adminStrings, type AdminStrings } from "@/lib/i18n/admin";
import { LANG_COOKIE, resolveLang } from "@/lib/i18n/language";

const row = "flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 py-2";

// The group of the template that the panel cannot start without: the one group that stays open (the others fold).
const REQUIRED = "Required";

/**
 * The values of one group. A set value carries the kit chip; a missing one is plain ink-2 words in sentence case, so the two
 * never look alike and no capital badge shouts. Lime stays for a citation, a verified step and the current place.
 */
function Settings({ group, strings }: { group: SetupGroup; strings: AdminStrings }) {
  return (
    <>
      {group.detail.length === 0 ? null : <p className="max-w-[65ch] text-sm text-ink/80">{group.detail}</p>}
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

      {groups.map((group) => (
        <Panel className="flex flex-col gap-3" data-admin="setup-group" key={group.title}>
          <SectionTitle level="h2">{group.title}</SectionTitle>
          {group.title === REQUIRED ? (
            <Settings group={group} strings={strings} />
          ) : (
            <details>
              {/* A list item, so the summary keeps the disclosure triangle; 44 px tall for a thumb. */}
              <summary className={`-mx-2 min-h-11 cursor-pointer px-2 py-3 text-sm font-semibold text-ink ${focusRing}`}>
                {strings.setupCount
                  .replace("{set}", String(group.variables.filter((variable) => variable.configured).length))
                  .replace("{total}", String(group.variables.length))}
              </summary>
              <div className="flex flex-col gap-3 pt-2">
                <Settings group={group} strings={strings} />
              </div>
            </details>
          )}
        </Panel>
      ))}
    </div>
  );
}

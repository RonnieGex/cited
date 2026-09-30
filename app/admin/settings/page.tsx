import { cookies } from "next/headers";
import { TestButton } from "@/components/admin/TestButton";
import { Chip, Panel, SectionTitle, focusRing } from "@/components/ui";
import { exampleText, setupGroups, type SetupGroup } from "@/lib/admin/setup";
import { adminStrings, type AdminStrings } from "@/lib/i18n/admin";
import { LANG_COOKIE, resolveLang } from "@/lib/i18n/language";
import { SETUP_GROUPS } from "@/lib/i18n/setup-groups";
import { panelMetadata } from "@/lib/admin/titles";

export const dynamic = "force-dynamic";

// Decision 11 of `openspec/changes/guided-setup-and-knowledge/design.md`: Settings is the last section of the
// workspace, and "For the installer" lives under it. This is the only page of the panel that names a variable of the
// environment, and it names it as the thing whoever installs has to fill in: the owner reads the rest of the panel in
// their own words. The variables themselves are read on the server, never inside `strings`, which every page of the
// panel hands to its client components.
//
// The groups, their words and the two tests come from the page "Setup" that this change replaces; what changed is where
// they live, which is what `brand-identity-ui` decision 30 left to this round.

const row = "flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 py-2";

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

export async function generateMetadata() {
  return panelMetadata("settings");
}

export default async function AdminSettings() {
  const stored = await cookies();
  const lang = resolveLang(stored.get(LANG_COOKIE)?.value, "en");
  const strings = adminStrings(lang);
  const groups = setupGroups(exampleText(), process.env);
  const table = SETUP_GROUPS[lang];

  return (
    <div className="flex flex-col gap-8">
      <SectionTitle level="h1">
        {strings.settingsTitle}
      </SectionTitle>
      <p className="max-w-[65ch] text-ink/80">{strings.setupIntro}</p>

      <div className="flex flex-wrap gap-4">
        <TestButton strings={strings} target="chat" />
        <TestButton strings={strings} target="embeddings" />
      </div>

      {groups.map((group) => {
        // Decision 29 of `openspec/changes/brand-identity-ui/design.md`: the words of a group come from the table of the
        // language of the panel, keyed by the id of the group; the text of the template is only the fallback for a group
        // that has no entry yet. The one group that stays open is the one the template marks as required.
        const words = table[group.id] ?? { title: group.title, detail: group.detail };

        return (
          <Panel className="flex flex-col gap-3" data-admin="setup-group" key={group.id}>
            <SectionTitle level="h2">{words.title}</SectionTitle>
            {group.required ? (
              <Settings group={group} detail={words.detail} strings={strings} />
            ) : (
              <details>
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

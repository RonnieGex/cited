"use client";

import { useState, useSyncExternalStore } from "react";
import { ConfirmedDelete } from "@/components/admin/ConfirmedDelete";
import { useOverflowing } from "@/components/admin/useOverflowing";
import { Panel, SectionTitle, focusRing } from "@/components/ui";
import type { ConversationSummary } from "@/lib/admin/conversations";
import { formatWhen, type AdminStrings } from "@/lib/i18n/admin";
import type { Lang } from "@/lib/settings/business";

export type ConversationsPanelProps = {
  strings: AdminStrings;
  conversations: ConversationSummary[];
  lang: Lang;
  /**
   * The zone of the server. The HTML and the hydration print the dates in it, so they match; right after, the browser
   * prints them again in the zone of the reader, the one the owner lives in.
   */
  timeZone: string;
};

type Answer = { status?: string; error?: string; conversations?: ConversationSummary[] };

// Nothing to subscribe to: the zone of the reader does not change while the page is open.
const still = () => () => {};

/** A stored ISO date in the zone of the reader, with the text of the server as the snapshot of the hydration. */
function When({ iso, lang, serverZone }: { iso: string; lang: Lang; serverZone: string }) {
  const text = useSyncExternalStore(
    still,
    () => formatWhen(iso, lang),
    () => formatWhen(iso, lang, serverZone),
  );

  // The hydration warning is not silenced here: the snapshot of the server is what hydrates, so a mismatch is a bug to be seen.
  return <time dateTime={iso}>{text}</time>;
}

const cell = "border-b border-ink/10 px-4 py-3 text-left text-sm text-ink";
const head = "border-b border-ink/20 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-2";

export function ConversationsPanel({ strings, conversations, lang, timeZone }: ConversationsPanelProps) {
  const [list, setList] = useState(conversations);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [scroller, scrolls] = useOverflowing<HTMLDivElement>();

  async function removeAll(): Promise<void> {
    setError(null);
    setMessage(null);

    const response = await fetch("/api/admin/conversations/delete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ confirm: true }),
    });
    const answer = (await response.json().catch(() => ({}))) as Answer;

    if (response.ok) {
      setList(answer.conversations ?? []);
      setMessage(strings.deletedAll);
    } else {
      setError(answer.error ?? strings.saveFailed);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* The panel scrolls sideways on a phone: a scrolling region has to be reachable by keyboard (axe:
          scrollable-region-focusable), and only while it scrolls: a box that does not is not a tab stop. */}
      <Panel
        aria-label={strings.conversationsTitle}
        className={`overflow-x-auto ${focusRing}`}
        ref={scroller}
        role="region"
        tabIndex={scrolls ? 0 : -1}
      >
        {/* The h1 of the page already says it: the box keeps its heading for the reader of the screen only. */}
        <SectionTitle className="sr-only" level="h2">
          {strings.conversationsTitle}
        </SectionTitle>
        {list.length === 0 ? (
          <p className="mt-4 text-sm text-ink/80">{strings.noConversations}</p>
        ) : (
          <table className="mt-4 w-full border-collapse">
            <caption className="sr-only">{strings.conversationsIntro}</caption>
            <thead>
              <tr>
                <th className={head} scope="col">
                  {strings.question}
                </th>
                <th className={head} scope="col">
                  {strings.status}
                </th>
                {/* Off a phone only: the When column that this change formatted must not start at the edge of the screen. */}
                <th className={`${head} max-sm:hidden`} scope="col">
                  {strings.citations}
                </th>
                <th className={head} scope="col">
                  {strings.when}
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((turn) => (
                <tr key={`${turn.sessionId}-${turn.turn}`}>
                  <td className={cell}>{turn.question}</td>
                  <td className={cell}>
                    {turn.status === "refused" ? strings.refused : strings.answered}
                  </td>
                  <td className={`${cell} max-sm:hidden`}>
                    {turn.citations.length === 0 ? "—" : turn.citations.join(", ")}
                  </td>
                  <td className={`${cell} whitespace-nowrap tabular-nums`}>
                    <When iso={turn.createdAt} lang={lang} serverZone={timeZone} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      {/* Decision 28: Delete all asks first, in place, and only the second press sends it. */}
      <ConfirmedDelete
        className="self-start"
        confirmLabel={strings.confirmDelete}
        keepLabel={strings.keep}
        label={strings.deleteAll}
        onConfirm={removeAll}
        sentence={strings.confirmDeleteAll}
        size="md"
      />

      {message === null ? null : (
        <p className="text-sm font-semibold text-ink" role="status">
          {message}
        </p>
      )}
      {error === null ? null : (
        <p className="text-sm font-semibold text-ink" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button, Panel, SectionTitle, focusRing } from "@/components/ui";
import type { ConversationSummary } from "@/lib/admin/conversations";
import type { AdminStrings } from "@/lib/i18n/admin";

export type ConversationsPanelProps = {
  strings: AdminStrings;
  conversations: ConversationSummary[];
};

type Answer = { status?: string; error?: string; conversations?: ConversationSummary[] };

const cell = "border-b border-ink/10 px-4 py-3 text-left text-sm text-ink";
const head = "border-b border-ink/20 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-2";

export function ConversationsPanel({ strings, conversations }: ConversationsPanelProps) {
  const [list, setList] = useState(conversations);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
      {/* The panel scrolls sideways on a phone: a scrolling region has to be reachable by keyboard (axe: scrollable-region-focusable). */}
      <Panel
        aria-label={strings.conversationsTitle}
        className={`overflow-x-auto ${focusRing}`}
        role="region"
        tabIndex={0}
      >
        <SectionTitle level="h2">{strings.conversationsTitle}</SectionTitle>
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
                <th className={head} scope="col">
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
                  <td className={cell}>
                    {turn.citations.length === 0 ? "—" : turn.citations.join(", ")}
                  </td>
                  <td className={`${cell} whitespace-nowrap tabular-nums`}>{turn.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <Button className="self-start" onClick={() => void removeAll()} variant="secondary">
        {strings.deleteAll}
      </Button>

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

"use client";

import { useState } from "react";
import { Button, Panel } from "@/components/ui";
import type { AdminStrings } from "@/lib/i18n/admin";
import type { ProviderView } from "@/lib/admin/provider-panel";

// The connected provider, as the panel shows it: the name, the model, the last four characters of the key and the last
// test with its latency (PRODUCT.md, "Secrets stay secret"). A value set by the server is read only and says why. The
// re-index warning lives here because it is the same card that offers the button.

export type ProviderConnectedProps = {
  kind: "chat" | "embeddings";
  strings: AdminStrings;
  view: ProviderView;
  name: string;
  reindex: { documents: number; passages: number };
};

function when(iso: string | null): string {
  if (iso === null) {
    return "";
  }

  const parsed = new Date(iso);

  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 16).replace("T", " ");
}

export function ProviderConnected({ kind, strings, view, name, reindex }: ProviderConnectedProps) {
  const [removed, setRemoved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [passages, setPassages] = useState(reindex.passages);
  const [message, setMessage] = useState<string | null>(null);

  async function remove(): Promise<void> {
    setBusy(true);

    await fetch("/api/admin/providers", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind }),
    });

    setRemoved(true);
    setBusy(false);
    window.location.reload();
  }

  async function reindexNow(): Promise<void> {
    setBusy(true);
    setMessage(null);

    const response = await fetch("/api/admin/providers/reindex", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    const answer = (await response.json().catch(() => ({}))) as { status?: string; passages?: number };

    if (response.ok && answer.status === "ok") {
      setPassages(0);
      setMessage(strings.reindexed.replace("{passages}", String(answer.passages ?? 0)));
    }

    setBusy(false);
  }

  const readOnly = view.source === "server";

  return (
    <Panel className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-lg font-semibold text-ink">{name}</p>
          {view.mode === "keyword" ? (
            <p className="text-ink/80">{strings.keywordActive}</p>
          ) : (
            <p className="text-ink/80">
              {strings.modelLabel}: {view.model}
            </p>
          )}
          {view.last4 === null ? null : <p className="font-mono text-ink">{`••••${view.last4}`}</p>}
          {view.last4 !== null && view.testedAt !== null && view.latencyMs !== null ? (
            <p className="text-sm text-ink/70">
              {strings.lastTest
                .replace("{when}", when(view.testedAt))
                .replace("{ms}", String(view.latencyMs))}
            </p>
          ) : null}
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/70">
          {readOnly ? strings.setByServer : strings.connected}
        </p>
      </div>

      {readOnly ? (
        <p className="max-w-[65ch] text-sm text-ink/80">{strings.serverExplanation}</p>
      ) : (
        <div>
          <Button disabled={busy || removed} onClick={() => void remove()} variant="secondary">
            {strings.removeKey}
          </Button>
        </div>
      )}

      {passages === 0 && message === null ? null : (
        <div className="flex flex-col gap-2 border-t border-ink/10 pt-3">
          {passages === 0 ? null : (
            <p className="text-sm font-semibold text-ink" role="status">
              {strings.reindexNeeded.replace("{passages}", String(passages))}
            </p>
          )}
          {passages === 0 ? null : (
            <p className="max-w-[65ch] text-sm text-ink/80">{strings.reindexBody}</p>
          )}
          {passages === 0 ? null : (
            <div>
              <Button disabled={busy} onClick={() => void reindexNow()} variant="secondary">
                {strings.reindexNow}
              </Button>
            </div>
          )}
          {message === null ? null : (
            <p className="text-sm text-ink" role="status">
              {message}
            </p>
          )}
        </div>
      )}
    </Panel>
  );
}

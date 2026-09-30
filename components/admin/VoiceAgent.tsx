"use client";

import { useState } from "react";
import { Marker } from "@/components/chat/Marker";
import { Button, Panel } from "@/components/ui";
import { voiceStrings } from "@/lib/i18n/voice";
import type { Lang } from "@/lib/settings/business";

// The one button of the voice screen (task 3.2): it asks `/api/admin/voice` for the agent of this business. The route
// holds the key of ElevenLabs and this component never sees it, and the second press updates the same agent because
// the route finds its ids in the store.

export type VoiceAgentStatus = {
  agentId: string | null;
  updatedAt: string | null;
};

type Outcome =
  | { kind: "idle" }
  | { kind: "created"; agentId: string }
  | { kind: "updated"; agentId: string }
  | { kind: "missing"; variables: string[] }
  | { kind: "failed"; message: string };

export function VoiceAgent({ lang, status }: { lang: Lang; status: VoiceAgentStatus }) {
  const words = voiceStrings(lang);
  const [agentId, setAgentId] = useState(status.agentId);
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>({ kind: "idle" });

  const create = async (): Promise<void> => {
    setBusy(true);
    setOutcome({ kind: "idle" });

    try {
      const response = await fetch("/api/admin/voice", {
        method: "POST",
        headers: { accept: "application/json" },
      });
      const payload = (await response.json()) as {
        status?: string;
        agentId?: string;
        created?: boolean;
        missing?: string[];
        error?: string;
      };

      if (response.status === 503 && payload.status === "unconfigured") {
        setOutcome({ kind: "missing", variables: payload.missing ?? [] });
      } else if (response.ok && typeof payload.agentId === "string") {
        setAgentId(payload.agentId);
        setOutcome({
          kind: payload.created === true ? "created" : "updated",
          agentId: payload.agentId,
        });
      } else {
        setOutcome({ kind: "failed", message: payload.error ?? "" });
      }
    } catch {
      setOutcome({ kind: "failed", message: "" });
    } finally {
      setBusy(false);
    }
  };

  const message =
    outcome.kind === "created"
      ? words.agentCreated
      : outcome.kind === "updated"
        ? words.agentUpdated
        : agentId === null
          ? words.agentCreate
          : `${words.agentId}: ${agentId}${status.updatedAt === null ? "" : ` (${status.updatedAt})`}`;

  return (
    <Panel data-testid="voice-agent" className="flex flex-col gap-4 bg-surface">
      <h2 className="text-xl font-bold tracking-[-0.02em] text-ink">{words.agentTitle}</h2>
      <p className="max-w-[65ch] text-sm text-ink/80">{words.agentIntro}</p>

      <p data-testid="voice-agent-status" aria-live="polite" className="text-sm text-ink/80">
        {message}
      </p>

      {outcome.kind === "missing" ? (
        <div className="flex items-start gap-3 text-sm text-ink">
          <Marker tone="coral" glyph="!" />
          <p data-testid="voice-agent-error">
            {words.agentMissing.replace("{variables}", outcome.variables.join(", "))}
          </p>
        </div>
      ) : null}

      {outcome.kind === "failed" ? (
        <div className="flex items-start gap-3 text-sm text-ink">
          <Marker tone="coral" glyph="!" />
          <p data-testid="voice-agent-error">{words.agentFailed}</p>
        </div>
      ) : null}

      <Button
        type="button"
        data-testid="voice-agent-create"
        variant="brand"
        className="self-start"
        disabled={busy}
        onClick={() => {
          void create();
        }}
      >
        {agentId === null ? words.agentCreate : words.agentUpdate}
      </Button>
    </Panel>
  );
}

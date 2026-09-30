"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Panel } from "@/components/ui";
import { adminStrings } from "@/lib/i18n/admin";
import { voiceStrings } from "@/lib/i18n/voice";
import { VOICE_NOT_CONFIGURED } from "@/lib/voice/config";
import type { Lang } from "@/lib/settings/business";

// The one button of the voice screen (task 3.2): it asks `/api/admin/voice` for the agent of this business. The route
// holds the key of ElevenLabs and this component never sees it, and the second press updates the same agent because
// the route finds its ids in the store.
//
// The route answers a reason code and never the name of a variable of the environment (`voice-owner-words`, design
// decision 3): `voice_not_configured` becomes the sentence of the owner with the link "For the installer", which is
// the only place where a variable is named, and `voice_provider_failed` becomes the sentence of the provider that did
// not answer. The raw `error` of a payload is never read here.

export type VoiceAgentStatus = {
  agentId: string | null;
  updatedAt: string | null;
};

type Outcome =
  | { kind: "idle" }
  | { kind: "created"; agentId: string }
  | { kind: "updated"; agentId: string }
  | { kind: "not-configured" }
  | { kind: "provider-failed" };

export function VoiceAgent({ lang, status }: { lang: Lang; status: VoiceAgentStatus }) {
  const words = voiceStrings(lang);
  const installer = adminStrings(lang).navSetup;
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
        reason?: string;
        agentId?: string;
        created?: boolean;
      };

      if (response.status === 503 && payload.reason === VOICE_NOT_CONFIGURED) {
        setOutcome({ kind: "not-configured" });
      } else if (response.ok && typeof payload.agentId === "string") {
        setAgentId(payload.agentId);
        setOutcome({
          kind: payload.created === true ? "created" : "updated",
          agentId: payload.agentId,
        });
      } else {
        // `voice_provider_failed` and every other failure that reaches this screen share the sentence: from here the
        // owner can only try again, and the diagnostic belongs to the log of the server and to "For the installer".
        setOutcome({ kind: "provider-failed" });
      }
    } catch {
      setOutcome({ kind: "provider-failed" });
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

      {outcome.kind === "not-configured" ? (
        <p data-testid="voice-agent-error" className="border-l-2 border-coral pl-4 text-sm text-ink">
          {words.voiceNotConfigured}{" "}
          <Link className="underline underline-offset-2" href="/admin">
            {installer}
          </Link>
        </p>
      ) : null}

      {outcome.kind === "provider-failed" ? (
        <p data-testid="voice-agent-error" className="border-l-2 border-coral pl-4 text-sm text-ink">
          {words.voiceProviderFailed}
        </p>
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

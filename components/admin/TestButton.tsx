"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import type { ProviderTarget } from "@/lib/admin/providers";
import type { AdminStrings } from "@/lib/i18n/admin";

export type TestButtonProps = {
  strings: AdminStrings;
  target: ProviderTarget;
};

type Outcome = "ok" | "error";

// Decision 29 of `openspec/changes/brand-identity-ui/design.md`: the result of a provider test is a sentence of the panel, in
// its language, with the name of the provider. What the server wrote (`the model answered NO_ANSWER`, the message of a provider,
// a status code) never reaches the page: it is a diagnostic, and it can name a key or an address.
export function TestButton({ strings, target }: TestButtonProps) {
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(): Promise<void> {
    setBusy(true);
    setOutcome(null);

    try {
      const response = await fetch("/api/admin/setup/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ target }),
      });
      const answer = (await response.json()) as { status?: unknown };

      setOutcome(response.ok && answer.status === "ok" ? "ok" : "error");
    } catch {
      setOutcome("error");
    } finally {
      setBusy(false);
    }
  }

  const provider = target === "chat" ? strings.providerChat : strings.providerEmbeddings;

  return (
    <div className="flex flex-col gap-2">
      <Button disabled={busy} onClick={run} variant="secondary">
        {target === "chat" ? strings.testChat : strings.testEmbeddings}
      </Button>
      {outcome === null ? null : (
        <p className="max-w-[65ch] text-sm text-ink" role={outcome === "ok" ? "status" : "alert"}>
          {(outcome === "ok" ? strings.testOk : strings.testFailed).replace("{provider}", provider)}
        </p>
      )}
    </div>
  );
}

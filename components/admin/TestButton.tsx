"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import type { ProviderTarget } from "@/lib/admin/providers";
import type { AdminStrings } from "@/lib/i18n/admin";

export type TestButtonProps = {
  strings: AdminStrings;
  target: ProviderTarget;
};

type Check = { status: "ok" | "error"; detail: string };

export function TestButton({ strings, target }: TestButtonProps) {
  const [check, setCheck] = useState<Check | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(): Promise<void> {
    setBusy(true);
    setCheck(null);

    try {
      const response = await fetch("/api/admin/setup/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ target }),
      });
      const answer = (await response.json()) as Check;

      setCheck(answer);
    } catch {
      setCheck({ status: "error", detail: strings.saveFailed });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button disabled={busy} onClick={run} variant="secondary">
        {target === "chat" ? strings.testChat : strings.testEmbeddings}
      </Button>
      {check === null ? null : (
        <p
          className="max-w-[65ch] text-sm text-ink"
          role={check.status === "ok" ? "status" : "alert"}
        >
          {check.detail}
        </p>
      )}
    </div>
  );
}

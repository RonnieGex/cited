"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Button, Panel, SectionTitle } from "@/components/ui";
import { SetupLane } from "@/components/setup/SetupLane";
import { SETUP_STEP_ORDER, type SetupStepId } from "@/lib/admin/setup-copy";
import type { SetupChecklist } from "@/lib/admin/setup-checklist";
import type { AdminStrings } from "@/lib/i18n/admin";
import type { Lang } from "@/lib/settings/business";

// Decision 2 of `openspec/changes/guided-setup-and-knowledge/design.md`: the lane is one page, the step the owner is
// reading lives in the address (`?step=information`), and "Skip for now" hides the setup until the owner opens it again
// from Home. The page renders the content of the four steps on the server and hands it to this component, so a step
// opens in place with no second request and nothing is a modal.
//
// Decision 1 of `PRODUCT.md`: a first visit shows one sentence of value, "4 steps, about 5 minutes" and a start button;
// nothing else.

export type SetupStepsProps = {
  checklist: SetupChecklist;
  lang: Lang;
  strings: AdminStrings;
  children: Partial<Record<SetupStepId, ReactNode>>;
};

function stepOf(value: string | null): SetupStepId | null {
  return SETUP_STEP_ORDER.find((id) => id === value) ?? null;
}

export function SetupSteps({ checklist, lang, strings, children }: SetupStepsProps) {
  const router = useRouter();
  const asked = stepOf(useSearchParams().get("step"));
  const [current, setCurrent] = useState<SetupStepId>(asked ?? checklist.current);
  const [busy, setBusy] = useState(false);

  async function flag(name: string, value: boolean): Promise<void> {
    setBusy(true);

    await fetch("/api/admin/setup/flags", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ flag: name, value }),
    });

    setBusy(false);
    router.refresh();
  }

  function open(id: SetupStepId): void {
    setCurrent(id);
    router.replace(`/admin?step=${id}`, { scroll: false });
  }

  if (checklist.done) {
    return (
      <div className="flex flex-col gap-8">
        <SectionTitle level="h1">
          {strings.setupDoneTitle}
        </SectionTitle>
        <p className="max-w-[65ch] text-ink/80">{strings.setupDoneBody}</p>
        <Panel className="flex flex-col gap-3">
          <p className="text-ink">{strings.published}</p>
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => router.push("/admin/publish")}>{strings.navPublish}</Button>
            <Button onClick={() => router.push("/admin/home")} variant="secondary">
              {strings.homeTitle}
            </Button>
          </div>
        </Panel>
      </div>
    );
  }

  if (checklist.skipped) {
    // Decision 2: "Skip for now" hides the setup until the owner opens it again from Home. This is the door back, and
    // it clears the flag so the lane is where it was.
    return (
      <div className="flex flex-col gap-8">
        <SectionTitle level="h1">
          {strings.setupSkippedNote}
        </SectionTitle>
        <div className="flex flex-wrap gap-4">
          <Button
            disabled={busy}
            onClick={() => {
              void flag("skipped", false);
            }}
          >
            {strings.setupOpen}
          </Button>
          <Button onClick={() => router.push("/admin/home")} variant="secondary">
            {strings.homeTitle}
          </Button>
        </div>
      </div>
    );
  }

  if (checklist.started === false) {
    return (
      <div className="flex flex-col gap-8">
        <SectionTitle level="h1">
          {strings.setupWelcomeTitle}
        </SectionTitle>
        <p className="max-w-[65ch] text-ink/80">{strings.setupWelcomeBody}</p>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-2">{strings.setupMinutes}</p>
        <div className="flex flex-wrap gap-4">
          <Button
            disabled={busy}
            onClick={() => {
              void flag("started", true);
            }}
          >
            {strings.setupStart}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <SectionTitle level="h1">
        {strings.setupStepsTitle}
      </SectionTitle>
      <SetupLane
        current={current}
        lang={lang}
        onCurrent={open}
        onSkip={() => {
          void flag("skipped", true);
        }}
        strings={strings}
        steps={checklist.steps}
      >
        {children}
      </SetupLane>
    </div>
  );
}

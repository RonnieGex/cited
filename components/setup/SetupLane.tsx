"use client";

import type { ReactNode } from "react";
import { CitationMark } from "@/components/brand";
import { Button, focusRing } from "@/components/ui";
import type { SetupStep, SetupState } from "@/lib/admin/setup-checklist";
import type { SetupStepId } from "@/lib/admin/setup-copy";
import type { AdminStrings } from "@/lib/i18n/admin";
import type { Lang } from "@/lib/settings/business";

// Decisions 1 and 2 of `openspec/changes/guided-setup-and-knowledge/design.md`: the guided setup is one page with four
// steps, each opening in place with its state, and lime marks a verified step and the current one and nothing else. No
// modal and no drawer: the step opens where its row is. The Stripe reference of `PRODUCT.md`: a list of steps that are
// tested and turn green.
//
// The state of every step is derived from the real configuration by `setupChecklist()` on the server; this component
// only paints it and asks the page to open another step. The page keeps the step in the address, so a reload comes back
// to the step the owner was reading.

export type SetupLaneProps = {
  steps: SetupStep[];
  current: SetupStepId;
  lang: Lang;
  strings: AdminStrings;
  onCurrent: (id: SetupStepId) => void;
  onSkip: () => void;
  children: Partial<Record<SetupStepId, ReactNode>>;
};

function stateWords(state: SetupState, strings: AdminStrings): string {
  if (state === "verified") {
    return strings.stepVerified;
  }

  if (state === "progress") {
    return strings.stepProgress;
  }

  if (state === "attention") {
    return strings.stepAttention;
  }

  return strings.stepTodo;
}

// A verified step is the lime mark; a step that needs attention is the ink mark, because lime never marks a failure;
// the other two are the quiet outline. The words beside the mark say the state: the color never carries it alone.
function markOf(state: SetupState, n: number): ReactNode {
  if (state === "verified") {
    return <CitationMark n={n} state="open" />;
  }

  return <CitationMark n={n} />;
}

export function SetupLane({ steps, current, lang, strings, onCurrent, onSkip, children }: SetupLaneProps) {
  return (
    <section aria-label={strings.setupStepsTitle} className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-[-0.02em] text-ink">{strings.setupStepsTitle}</h2>
        <p className="text-sm text-ink-2">
          {strings.setupCountOf
            .replace("{done}", String(steps.filter((step) => step.state === "verified").length))
            .replace("{total}", String(steps.length))}
        </p>
      </div>

      <ol className="flex flex-col">
        {steps.map((step, index) => {
          const open = step.id === current;
          const n = index + 1;
          const panelId = `setup-step-${step.id}`;

          return (
            <li key={step.id} data-setup-step={step.id} data-state={step.state} className="border-t border-rule">
              <div className="flex flex-col gap-1 py-4">
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => {
                    onCurrent(step.id);
                  }}
                  className={`flex w-full items-baseline gap-3 rounded-none text-left max-lg:min-h-11 ${focusRing}`}
                >
                  <span
                    className={
                      open
                        ? "flex items-baseline gap-3 text-ink"
                        : "flex items-baseline gap-3 text-ink transition-colors duration-[var(--dur-fast)] hover:text-ink"
                    }
                  >
                    {markOf(step.state, n)}
                    <span className="text-lg font-semibold">{step.title[lang]}</span>
                  </span>
                  <span className={`ml-auto shrink-0 text-sm ${step.state === "attention" ? "text-ink" : "text-ink-2"}`}>
                    {stateWords(step.state, strings)}
                  </span>
                </button>
                {open ? <p className="max-w-[65ch] pl-[calc(1.5em+0.75rem)] text-sm text-ink-2">{step.detail[lang]}</p> : null}
              </div>

              {open ? (
                <div id={panelId} className="flex flex-col gap-6 pb-8">
                  {children[step.id] ?? null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap items-center gap-4 border-t border-rule pt-6">
        <Button onClick={onSkip} variant="secondary" size="sm">
          {strings.setupSkip}
        </Button>
      </div>
    </section>
  );
}

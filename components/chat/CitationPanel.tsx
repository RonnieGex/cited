import { Highlight } from "@/components/brand";
import { Button, Panel } from "@/components/ui";
import type { Citation } from "@/lib/answer/types";

// Design decision 1 of `openspec/changes/public-page-and-widget/design.md`: a mark per `[n]` opens a panel with the
// excerpt, the document and the heading of the passage the answer came from. Decision 10 of
// `openspec/changes/brand-identity-ui/design.md`: the excerpt sits in the highlighter, which sweeps in once, and the note
// enters beside its answer.

export type CitationPanelProps = {
  citation: Citation;
  panelId: string;
  labels: { document: string; heading: string; close: string; citation: (n: number) => string };
  onClose: () => void;
};

export function CitationPanel({ citation, panelId, labels, onClose }: CitationPanelProps) {
  return (
    <Panel
      id={panelId}
      data-cited="citation"
      role="region"
      aria-label={labels.citation(citation.n)}
      className="note-in flex flex-col gap-4"
    >
      <p className="max-w-[65ch] text-[18px] leading-[1.6] text-ink">
        <Highlight sweep>{citation.excerpt}</Highlight>
      </p>
      <dl className="flex flex-col gap-1 text-sm">
        <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-2">
          {labels.document}
        </dt>
        <dd className="break-words text-ink">{citation.document}</dd>
        {citation.heading === null ? null : (
          <>
            <dt className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-2">
              {labels.heading}
            </dt>
            <dd className="break-words text-ink">{citation.heading}</dd>
          </>
        )}
      </dl>
      <div>
        <Button variant="secondary" size="sm" onClick={onClose}>
          {labels.close}
        </Button>
      </div>
    </Panel>
  );
}

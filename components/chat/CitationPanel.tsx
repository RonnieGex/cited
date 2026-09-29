import { Button, Panel } from "@/components/ui";
import type { Citation } from "@/lib/answer/types";

// Design decision 1 of `openspec/changes/public-page-and-widget/design.md`: a chip per `[n]` opens a panel with the
// excerpt, the document and the heading of the passage the answer came from.

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
      className="flex flex-col gap-4 bg-paper"
    >
      <p className="border-l-2 border-lime pl-4 text-ink/90">{citation.excerpt}</p>
      <dl className="flex flex-col gap-1 text-sm">
        <dt className="font-semibold uppercase tracking-[0.18em] text-ink/70">
          {labels.document}
        </dt>
        <dd className="text-ink">{citation.document}</dd>
        {citation.heading === null ? null : (
          <>
            <dt className="font-semibold uppercase tracking-[0.18em] text-ink/70">
              {labels.heading}
            </dt>
            <dd className="text-ink">{citation.heading}</dd>
          </>
        )}
      </dl>
      <div>
        <Button variant="secondary" onClick={onClose} className="px-4 py-2">
          {labels.close}
        </Button>
      </div>
    </Panel>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { Button, Input, Panel, SectionTitle, focusRing } from "@/components/ui";
import type { DocumentSummary } from "@/lib/admin/documents";
import type { AdminStrings } from "@/lib/i18n/admin";

export type DocumentsPanelProps = {
  strings: AdminStrings;
  documents: DocumentSummary[];
};

type Answer = { status?: string; error?: string; documents?: DocumentSummary[] };

// Tighter sides on a phone, so the name, its actions and the passages fit a 320 px screen without scrolling the box.
const cell = "border-b border-ink/10 px-4 py-3 text-left text-sm text-ink max-sm:px-2";
const head =
  "border-b border-ink/20 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-2 max-sm:px-2";

export function DocumentsPanel({ strings, documents }: DocumentsPanelProps) {
  const [list, setList] = useState(documents);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send(url: string, body: BodyInit, headers?: Record<string, string>): Promise<void> {
    setMessage(null);
    setError(null);

    const response = await fetch(url, { method: "POST", headers, body });
    const answer = (await response.json().catch(() => ({}))) as Answer;

    if (response.ok) {
      setList(answer.documents ?? list);
    } else {
      setError(answer.error ?? strings.saveFailed);
    }
  }

  async function upload(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (file === null) {
      setError(strings.chooseLogo);

      return;
    }

    const form = new FormData();

    form.set("document", file);

    await send("/api/admin/documents", form);
  }

  async function remove(name: string): Promise<void> {
    await send(
      "/api/admin/documents/delete",
      JSON.stringify({ name }),
      { "content-type": "application/json" },
    );
  }

  async function reingest(name: string): Promise<void> {
    await send(
      "/api/admin/documents/reingest",
      JSON.stringify({ name }),
      { "content-type": "application/json" },
    );
    setMessage(strings.reingested);
  }

  return (
    <div className="flex flex-col gap-8">
      <form className="flex max-w-[640px] flex-wrap items-end gap-4" onSubmit={upload}>
        <div className="flex min-w-[260px] flex-1 flex-col gap-2">
          <label className="text-sm font-semibold text-ink" htmlFor="document-file">
            {strings.uploadDocument}
          </label>
          <Input
            accept=".pdf,.docx,.md,.markdown,.mdx,.txt,.text,.csv,.log,.tsv"
            id="document-file"
            name="document"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            type="file"
          />
        </div>
        <Button type="submit">{strings.upload}</Button>
      </form>

      {message === null ? null : (
        <p className="text-sm font-semibold text-ink" role="status">
          {message}
        </p>
      )}
      {error === null ? null : (
        <p className="max-w-[65ch] text-sm font-semibold text-ink" role="alert">
          {error}
        </p>
      )}

      {/* A very long name can still make the box scroll on a phone: a scrolling region has to be reachable by keyboard (axe:
          scrollable-region-focusable), as in Conversations. */}
      <Panel
        aria-label={strings.documentsTitle}
        className={`overflow-x-auto ${focusRing}`}
        role="region"
        tabIndex={0}
      >
        {/* The h1 of the page already says it: the box keeps its heading for the reader of the screen only. */}
        <SectionTitle className="sr-only" level="h2">
          {strings.documentsTitle}
        </SectionTitle>
        {list.length === 0 ? (
          <p className="mt-4 text-sm text-ink/80">{strings.noDocuments}</p>
        ) : (
          <table className="mt-4 w-full border-collapse">
            <caption className="sr-only">{strings.documentsIntro}</caption>
            <thead>
              <tr>
                <th className={head} scope="col">
                  {strings.documentName}
                </th>
                <th className={head} scope="col">
                  {strings.passages}
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((document) => (
                <tr key={document.name}>
                  {/* The actions sit under the name of their document, so a phone never cuts them at the edge of the box. */}
                  <td className={`${cell} align-top`}>
                    <span className="block [overflow-wrap:anywhere]">{document.name}</span>
                    <div aria-label={strings.actions} className="mt-3 flex flex-wrap gap-3" role="group">
                      <Button
                        aria-label={`${strings.reingestDocument} ${document.name}`}
                        className="whitespace-nowrap"
                        onClick={() => void reingest(document.name)}
                        size="sm"
                        variant="secondary"
                      >
                        {strings.reingestDocument}
                      </Button>
                      <Button
                        aria-label={`${strings.deleteDocument} ${document.name}`}
                        className="whitespace-nowrap"
                        onClick={() => void remove(document.name)}
                        size="sm"
                        variant="secondary"
                      >
                        {strings.deleteDocument}
                      </Button>
                    </div>
                  </td>
                  <td className={`${cell} align-top tabular-nums`}>{document.passages}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}

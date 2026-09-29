"use client";

import { useState, type FormEvent } from "react";
import { Button, Input, Panel, SectionTitle } from "@/components/ui";
import type { DocumentSummary } from "@/lib/admin/documents";
import type { AdminStrings } from "@/lib/i18n/admin";

export type DocumentsPanelProps = {
  strings: AdminStrings;
  documents: DocumentSummary[];
};

type Answer = { status?: string; error?: string; documents?: DocumentSummary[] };

const cell = "border-b border-ink/10 px-4 py-3 text-left text-sm text-ink";

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

      <Panel className="overflow-x-auto">
        <SectionTitle level="h2">{strings.documentsTitle}</SectionTitle>
        {list.length === 0 ? (
          <p className="mt-4 text-sm text-ink/80">{strings.noDocuments}</p>
        ) : (
          <table className="mt-4 w-full border-collapse">
            <caption className="sr-only">{strings.documentsIntro}</caption>
            <thead>
              <tr>
                <th className={cell} scope="col">
                  {strings.documentName}
                </th>
                <th className={cell} scope="col">
                  {strings.passages}
                </th>
                <th className={cell} scope="col">
                  {strings.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((document) => (
                <tr key={document.name}>
                  <td className={cell}>{document.name}</td>
                  <td className={cell}>{document.passages}</td>
                  <td className={cell}>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        aria-label={`${strings.reingestDocument} ${document.name}`}
                        onClick={() => void reingest(document.name)}
                        variant="secondary"
                      >
                        {strings.reingestDocument}
                      </Button>
                      <Button
                        aria-label={`${strings.deleteDocument} ${document.name}`}
                        onClick={() => void remove(document.name)}
                        variant="secondary"
                      >
                        {strings.deleteDocument}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}

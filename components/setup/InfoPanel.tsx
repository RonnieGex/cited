"use client";

import Link from "next/link";
import { useRef, useState, type DragEvent } from "react";
import { Button, Panel, SectionTitle, focusRing } from "@/components/ui";
import type { DocumentSummary } from "@/lib/admin/documents";
import type { AdminStrings } from "@/lib/i18n/admin";
import { uploadCopy, uploadResult, type UploadOutcome, type UploadResult } from "@/lib/admin/upload-result";

// Decision 3 of `openspec/changes/guided-setup-and-knowledge/design.md`: the owner drags several files at once — or
// picks them with the button of the same control — and every file says, in words, what is happening to it and how it
// ended: uploading, reading, splitting into passages, ready with N passages, or the reason it failed and what to do.
//
// Decision 4: "Try it with a sample business (Café La Horquilla)" ingests the sample corpus in one press. The documents
// it added and the name it wrote are removed together, which is what undoes the sample (decision 16 of the amendment).
//
// Decision 5: every document opens as a page of its own, where the owner reads the passages the system understood.
//
// The files travel one request at a time on purpose: it is what lets a file that cannot be read show its reason while
// the files after it keep being ingested (the scenario "A scanned PDF" of the spec).

export type InfoPanelProps = {
  strings: AdminStrings;
  documents: DocumentSummary[];
  sampleLoaded?: boolean;
};

type Phase = "waiting" | "uploading" | "reading" | "splitting" | "done";

type Progress = {
  id: string;
  name: string;
  phase: Phase;
  result: UploadResult | null;
};

type Answer = {
  status?: string;
  error?: string;
  results?: UploadOutcome[];
  documents?: DocumentSummary[];
  name?: string;
  documents_added?: string[];
};

const ACCEPT = ".pdf,.docx,.md,.markdown,.mdx,.txt,.text,.csv,.log,.tsv";

// The native button of the picker dressed as the primary button of the kit, the same rule `components/ui/Input.tsx`
// applies to a file field: the field keeps 44 px of height on a phone.
const fileField =
  "min-h-11 p-2 text-sm file:mr-4 file:cursor-pointer file:rounded-none file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:font-bold file:uppercase file:tracking-[0.05em] file:text-paper hover:file:bg-surface-dark";

export function InfoPanel({ strings, documents, sampleLoaded = false }: InfoPanelProps) {
  const [list, setList] = useState(documents);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [sampleIn, setSampleIn] = useState(sampleLoaded);
  const picker = useRef<HTMLInputElement>(null);

  function phaseWords(phase: Phase): string {
    if (phase === "uploading") {
      return strings.uploadWorking;
    }

    if (phase === "reading") {
      return strings.uploadReading;
    }

    if (phase === "splitting") {
      return strings.uploadSplitting;
    }

    return "";
  }

  async function send(files: File[]): Promise<void> {
    if (files.length === 0) {
      return;
    }

    setBusy(true);
    setMessage(null);
    setError(null);
    setProgress(files.map((file) => ({ id: file.name, name: file.name, phase: "uploading", result: null })));

    // One file per request, in the order the owner chose them: that is what lets one file fail while the ones after it
    // keep being read, and what makes the progress of every file true (decision 3). The answer carries one result per
    // file it read — the request sends one — and every result of the answer takes its row, so a route that answered
    // about more than the file in flight is shown too and never dropped.
    for (const file of files) {
      const step = (phase: Phase): void => {
        setProgress((current) => current.map((one) => (one.id === file.name ? { ...one, phase } : one)));
      };

      step("reading");

      const form = new FormData();

      form.set("document", file);

      let answer: Answer = {};

      try {
        const response = await fetch("/api/admin/documents", { method: "POST", body: form });

        answer = (await response.json().catch(() => ({}))) as Answer;
      } catch {
        answer = {};
      }

      step("splitting");

      const outcomes: UploadOutcome[] =
        answer.results !== undefined && answer.results.length > 0
          ? answer.results
          : [{ name: file.name, passages: 0, failure: "unknown" }];

      setProgress((current) => {
        const next = [...current];

        for (const outcome of outcomes) {
          const result: UploadResult = uploadResult(outcome);
          const row = { id: outcome.name, name: outcome.name, phase: "done" as Phase, result };
          const at = next.findIndex((one) => one.id === outcome.name);

          if (at === -1) {
            next.push(row);
          } else {
            next[at] = row;
          }
        }

        return next;
      });

      if (answer.documents !== undefined) {
        setList(answer.documents);
      }
    }

    setBusy(false);
  }

  async function takeSample(): Promise<void> {
    setBusy(true);
    setMessage(null);
    setError(null);

    const response = await fetch("/api/admin/samples", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    const answer = (await response.json().catch(() => ({}))) as Answer;

    if (response.ok) {
      setSampleIn(true);
      setMessage(strings.sampleLoaded.replace("{name}", answer.name ?? ""));
      await refresh();
    } else {
      setError(answer.error ?? strings.uploadFailedTitle);
    }

    setBusy(false);
  }

  async function refresh(): Promise<void> {
    const response = await fetch("/api/admin/documents", { method: "GET" });
    const answer = (await response.json().catch(() => ({}))) as Answer;

    if (response.ok && answer.documents !== undefined) {
      setList(answer.documents);
    }
  }

  async function undo(): Promise<void> {
    setBusy(true);
    setMessage(null);
    setError(null);

    // Decision 16 of the amendment: undoing the sample is one request, because it does two things that belong
    // together — it removes the documents of the sample and clears the name the sample wrote, and only while the
    // business still carries that name. Removing the documents one by one would leave the name of the example behind.
    await fetch("/api/admin/samples", { method: "DELETE" });

    setSampleIn(false);
    setMessage(strings.documentUndone);
    await refresh();
    setBusy(false);
  }

  const drop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setDragging(false);
    void send([...event.dataTransfer.files]);
  };

  return (
    <div className="flex flex-col gap-8">
      <div
        data-setup="drop"
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => {
          setDragging(false);
        }}
        onDrop={drop}
        className={`flex flex-col gap-4 rounded-none border border-dashed p-6 ${
          dragging ? "border-ink bg-surface" : "border-border bg-paper"
        }`}
      >
        <p className="text-lg font-semibold text-ink">{strings.uploadDrop}</p>
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm text-ink-2">{strings.uploadOr}</span>
          <div className="flex min-w-[260px] max-w-[420px] flex-1 flex-col gap-2">
            <label className="text-sm font-semibold text-ink" htmlFor="information-files">
              {strings.uploadDocument}
            </label>
            <input
              ref={picker}
              accept={ACCEPT}
              className={`w-full rounded-none border border-border bg-paper text-ink ${fileField} ${focusRing}`}
              id="information-files"
              multiple
              name="document"
              onChange={(event) => {
                const chosen = [...(event.target.files ?? [])];

                event.target.value = "";
                void send(chosen);
              }}
              type="file"
            />
          </div>
          <Button disabled={busy} onClick={() => picker.current?.click()} type="button">
            {strings.upload}
          </Button>
        </div>
      </div>

      {progress.length === 0 ? null : (
        <ul aria-label={strings.documentsTitle} className="flex flex-col">
          {progress.map((one) => (
            <li key={one.id} data-upload-state={one.result?.state ?? one.phase} className="border-t border-rule py-4">
              <p className="break-words font-semibold text-ink [overflow-wrap:anywhere]">{one.name}</p>
              {one.result === null ? (
                <p className="text-sm text-ink-2" role="status">
                  {phaseWords(one.phase)}
                </p>
              ) : one.result.state === "ready" ? (
                <p className="text-sm text-ink" role="status">
                  {strings.uploadReady.replace("{n}", String(one.result.passages))}
                </p>
              ) : (
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-ink" role="alert">
                    {uploadCopy(one.result.reason, strings).title}
                  </p>
                  <p className="max-w-[65ch] text-sm text-ink-2">{uploadCopy(one.result.reason, strings).advice}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <Button disabled={busy} onClick={() => void takeSample()} variant="secondary">
          {strings.sampleTry}
        </Button>
        {sampleIn ? (
          <Button disabled={busy} onClick={() => void undo()} variant="secondary" size="sm">
            {strings.sampleUndo}
          </Button>
        ) : null}
      </div>

      {message === null ? null : (
        <p className="max-w-[65ch] text-sm font-semibold text-ink" role="status">
          {message}
        </p>
      )}
      {error === null ? null : (
        <p className="max-w-[65ch] text-sm font-semibold text-ink" role="alert">
          {error}
        </p>
      )}

      <Panel className={`flex flex-col gap-3 overflow-x-auto ${focusRing}`}>
        {/* The h1 of the page already says it: the box keeps its heading for the reader of the screen only. */}
        <SectionTitle className="sr-only" level="h2">
          {strings.documentsTitle}
        </SectionTitle>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-2">{strings.passages}</p>
        {list.length === 0 ? (
          <p className="text-sm text-ink/80">{strings.noDocuments}</p>
        ) : (
          <ul className="flex flex-col">
            {list.map((document) => (
              <li
                key={document.name}
                className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-ink/10 py-3 last:border-b-0"
              >
                <Link
                  className={`break-words text-ink underline-offset-4 hover:underline [overflow-wrap:anywhere] ${focusRing}`}
                  href={`/admin/information/${encodeURIComponent(document.name)}`}
                >
                  {document.name}
                </Link>
                {/* The number of passages of the document, once it is in the store: the row of an upload says it in
                    words ("Ready, N passages") and this list keeps the count, which is what the page of the document
                    opens with (decision 5). */}
                <span className="text-sm text-ink-2 tabular-nums">{document.passages}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

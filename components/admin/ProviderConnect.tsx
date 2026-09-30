"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Button, Input, Panel } from "@/components/ui";
import type { AdminStrings } from "@/lib/i18n/admin";
import type { ProviderEntry } from "@/lib/providers/catalog";
import type { TestReason } from "@/lib/providers/test";

// Decision 8 of `openspec/changes/provider-keys-in-panel/design.md`: the owner chooses a provider, pastes the key,
// presses "Test" and sees the result in words right here, never in a modal; the key is a password field with a show
// toggle and it is saved only after the provider answered. The browser sends the key once and never sees it again.

export type ProviderConnectProps = {
  kind: "chat" | "embeddings";
  strings: AdminStrings;
  entries: ProviderEntry[];
  encryptionReady: boolean;
  keyword?: boolean;
  initialProvider?: string | null;
};

type Tested = { model: string; latencyMs: number };
type Saved = { model: string; latencyMs: number; last4: string | null };

export function ProviderConnect({
  kind,
  strings,
  entries,
  encryptionReady,
  keyword = false,
  initialProvider = null,
}: ProviderConnectProps) {
  const field = useId();
  const [selected, setSelected] = useState(initialProvider ?? entries[0]?.id ?? "");
  const [secret, setSecret] = useState("");
  const [shown, setShown] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tested, setTested] = useState<Tested | null>(null);
  const [reason, setReason] = useState<TestReason | null>(null);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const entry = entries.find((candidate) => candidate.id === selected) ?? entries[0] ?? null;
  const reasonText: Record<TestReason, string> = {
    rejected_key: strings.reasonRejectedKey,
    no_credit: strings.reasonNoCredit,
    rate_limited: strings.reasonRateLimited,
    model_not_found: strings.reasonModelNotFound,
    unreachable: strings.reasonUnreachable,
    timeout: strings.reasonTimeout,
    address_not_allowed: strings.reasonAddressNotAllowed,
  };

  function payload(): Record<string, unknown> {
    return {
      kind,
      provider: selected,
      key: secret,
      model: kind === "chat" ? entry?.chatModel : (entry?.embeddingsModel ?? undefined),
      baseUrl: kind === "chat" ? entry?.baseUrl : entry?.embeddingsBaseUrl,
    };
  }

  async function post(url: string, body: unknown): Promise<Record<string, unknown>> {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    return (await response.json().catch(() => ({}))) as Record<string, unknown>;
  }

  async function test(): Promise<void> {
    setBusy(true);
    setTested(null);
    setReason(null);
    setNote(null);
    setFailed(false);

    const answer = await post("/api/admin/providers/test", payload());

    if (answer["ok"] === true) {
      setTested({ model: String(answer["model"] ?? ""), latencyMs: Number(answer["latencyMs"] ?? 0) });
    } else {
      setReason((answer["reason"] as TestReason | undefined) ?? "unreachable");
    }

    setBusy(false);
  }

  async function save(): Promise<void> {
    setBusy(true);
    setNote(null);
    setFailed(false);

    const answer = await post("/api/admin/providers/save", payload());

    if (answer["saved"] === true) {
      setSaved({
        model: String(answer["model"] ?? tested?.model ?? ""),
        latencyMs: Number(answer["latencyMs"] ?? tested?.latencyMs ?? 0),
        last4: answer["last4"] === null || answer["last4"] === undefined ? null : String(answer["last4"]),
      });
      setSecret("");
    } else {
      setFailed(true);
      setReason((answer["reason"] as TestReason | undefined) ?? null);
    }

    setBusy(false);
  }

  async function chooseKeyword(): Promise<void> {
    setBusy(true);
    setNote(null);
    setFailed(false);

    const answer = await post("/api/admin/providers/save", { kind: "embeddings", mode: "keyword" });

    if (answer["saved"] === true) {
      setNote(strings.keywordSaved);
      setTested(null);
      setReason(null);
    } else {
      setFailed(true);
    }

    setBusy(false);
  }

  if (saved !== null) {
    return (
      <Panel className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-ink" role="status">
          {strings.savedKey}
        </p>
        <p className="text-ink">
          {entry?.name ?? selected} · {saved.model} · {saved.last4 === null ? "••••" : `••••${saved.last4}`}
        </p>
      </Panel>
    );
  }

  return (
    <Panel className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:max-w-[420px]">
        <label className="text-sm font-semibold text-ink" htmlFor={`provider-${kind}-choice`}>
          {strings.providerLabel}
        </label>
        <select
          className="w-full border border-border bg-paper px-4 py-3 text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
          id={`provider-${kind}-choice`}
          onChange={(event) => {
            setSelected(event.target.value);
            setTested(null);
            setReason(null);
          }}
          value={selected}
        >
          {entries.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2 sm:max-w-[520px]">
        <label className="text-sm font-semibold text-ink" htmlFor={field}>
          {strings.keyLabel}
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            autoComplete="off"
            className="min-w-[240px] flex-1"
            id={field}
            name={`provider-${kind}-key`}
            onChange={(event) => {
              setSecret(event.target.value);
              setTested(null);
              setReason(null);
            }}
            type={shown ? "text" : "password"}
            value={secret}
          />
          <Button
            onClick={() => {
              setShown((current) => current === false);
            }}
            variant="secondary"
          >
            {shown ? strings.hideKey : strings.showKey}
          </Button>
        </div>
        <p className="text-sm text-ink/70">{strings.keyHint}</p>
      </div>

      {keyword ? (
        <div className="flex flex-col gap-2 border-t border-ink/10 pt-4">
          <p className="text-sm text-ink/80">{strings.keywordLine}</p>
          <div>
            <Button disabled={busy} onClick={() => void chooseKeyword()} variant="secondary">
              {strings.keywordChoose}
            </Button>
          </div>
        </div>
      ) : null}

      {encryptionReady ? null : (
        <p className="max-w-[65ch] text-sm text-ink" role="alert">
          {strings.noEncryptionKey}
        </p>
      )}

      <div className="flex flex-wrap gap-4">
        <Button disabled={busy || entry === null} onClick={() => void test()} variant="secondary">
          {busy ? strings.testing : strings.testKey}
        </Button>
        <Button disabled={busy || tested === null || encryptionReady === false} onClick={() => void save()}>
          {strings.saveKey}
        </Button>
      </div>

      {tested === null ? null : (
        <p className="max-w-[65ch] text-sm text-ink" role="status">
          {strings.tested
            .replace("{model}", tested.model)
            .replace("{ms}", String(tested.latencyMs))}
        </p>
      )}
      {reason === null ? null : (
        <p className="max-w-[65ch] text-sm text-ink" role="alert">
          {reasonText[reason]}
          {/* Requirement "The owner never reads a variable name in an answer of the panel" (task 11.3): the sentence
              is in the words of the owner and a setting only the installer can change sends to the page of whoever
              installs, which is the only one that names a variable of the environment. */}
          {reason === "address_not_allowed" ? (
            <>
              {" "}
              <Link className="underline underline-offset-2" href="/admin">
                {strings.reasonAddressNotAllowedLink}
              </Link>
            </>
          ) : null}
        </p>
      )}
      {failed ? (
        <p className="max-w-[65ch] text-sm text-ink" role="alert">
          {strings.providerFailed}
        </p>
      ) : null}
      {note === null ? null : (
        <p className="max-w-[65ch] text-sm text-ink" role="status">
          {note}
        </p>
      )}
    </Panel>
  );
}

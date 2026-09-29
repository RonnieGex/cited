"use client";

import { useState, type FormEvent } from "react";
import { Button, Input, SectionTitle } from "@/components/ui";
import type { AdminStrings } from "@/lib/i18n/admin";

export type LoginFormProps = {
  strings: AdminStrings;
  onSignedIn?: () => void;
};

type Answer = { status?: string; error?: string };

export function LoginForm({ strings, onSignedIn }: LoginFormProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError(null);

    let response: Response;

    try {
      response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
    } catch {
      setBusy(false);
      setError(strings.wrongPassword);

      return;
    }

    setBusy(false);

    if (response.ok) {
      (onSignedIn ?? (() => window.location.reload()))();

      return;
    }

    const answer = (await response.json().catch(() => ({}))) as Answer;

    setError(
      response.status === 429
        ? strings.locked
        : response.status === 503
          ? (answer.error ?? strings.unconfigured)
          : strings.wrongPassword,
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle level="h1" eyebrow={strings.panelEyebrow}>
        {strings.signInTitle}
      </SectionTitle>
      <form className="flex flex-col gap-4" onSubmit={submit}>
        <label className="text-sm font-semibold text-ink" htmlFor="admin-password">
          {strings.passwordLabel}
        </label>
        <Input
          autoComplete="current-password"
          id="admin-password"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
        <Button disabled={busy} type="submit">
          {strings.signIn}
        </Button>
        {error === null ? null : (
          <p className="text-sm font-semibold text-ink" role="alert">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}

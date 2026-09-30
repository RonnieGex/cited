"use client";

import { useState, type FormEvent } from "react";
import { Button, Chip, Input, Panel, SectionTitle } from "@/components/ui";
import type { AdminStrings } from "@/lib/i18n/admin";
import { topicsFrom } from "@/lib/settings/topics";
import type { Business, Lang } from "@/lib/settings/business";

export type BusinessFormProps = {
  strings: AdminStrings;
  business: Business | null;
  /** What the page does after a save: the live preview of Publish comes back with the new business (decision 7). */
  onSaved?: () => void;
};

type Answer = { status?: string; error?: string; business?: Business };

const label = "text-sm font-semibold text-ink";
const field = "flex max-w-[560px] flex-col gap-2";

export function BusinessForm({ strings, business, onSaved }: BusinessFormProps) {
  const [name, setName] = useState(business?.name ?? "");
  const [color, setColor] = useState(business?.primaryColor ?? "");
  const [tone, setTone] = useState(business?.tone ?? "");
  const [language, setLanguage] = useState<Lang>(business?.language ?? "en");
  const [topics, setTopics] = useState((business?.forbiddenTopics ?? []).join("\n"));
  const [welcomeEn, setWelcomeEn] = useState(business?.welcome.en ?? "");
  const [welcomeEs, setWelcomeEs] = useState(business?.welcome.es ?? "");
  const [logo, setLogo] = useState<File | null>(null);
  const [stored, setStored] = useState(business?.hasLogo ?? false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const response = await fetch("/api/admin/business", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name,
        primaryColor: color.trim().length === 0 ? null : color.trim(),
        tone,
        language,
        forbiddenTopics: topicsFrom(topics),
        welcome: { en: welcomeEn, es: welcomeEs },
      }),
    });
    const answer = (await response.json().catch(() => ({}))) as Answer;

    if (response.ok) {
      setStored(answer.business?.hasLogo ?? stored);
      setMessage(strings.saved);
      onSaved?.();
    } else {
      setError(answer.error ?? strings.saveFailed);
    }
  }

  async function uploadLogo(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (logo === null) {
      setError(strings.chooseLogo);

      return;
    }

    const form = new FormData();

    form.set("logo", logo);

    const response = await fetch("/api/admin/business/logo", { method: "POST", body: form });
    const answer = (await response.json().catch(() => ({}))) as Answer;

    if (response.ok) {
      setStored(true);
      setMessage(strings.logoSaved);
      onSaved?.();
    } else {
      setError(answer.error ?? strings.logoFailed);
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <form className="flex flex-col gap-8" onSubmit={save}>
        <div className={field}>
          <label className={label} htmlFor="business-name">
            {strings.businessName}
          </label>
          <Input
            id="business-name"
            name="name"
            onChange={(event) => setName(event.target.value)}
            required
            value={name}
          />
        </div>

        <div className={field}>
          <label className={label} htmlFor="business-color">
            {strings.businessColor}
          </label>
          <Input
            id="business-color"
            name="color"
            onChange={(event) => setColor(event.target.value)}
            placeholder="#171717"
            value={color}
          />
        </div>

        <div className={field}>
          <label className={label} htmlFor="business-tone">
            {strings.businessTone}
          </label>
          <Input
            id="business-tone"
            name="tone"
            onChange={(event) => setTone(event.target.value)}
            value={tone}
          />
        </div>

        <div className={field}>
          <label className={label} htmlFor="business-language">
            {strings.businessLanguage}
          </label>
          <select
            className="w-full rounded-none border border-border bg-paper px-5 py-4 text-ink"
            id="business-language"
            name="language"
            onChange={(event) => setLanguage(event.target.value === "es" ? "es" : "en")}
            value={language}
          >
            <option value="en">{strings.englishLabel}</option>
            <option value="es">{strings.spanishLabel}</option>
          </select>
        </div>

        <div className={field}>
          <label className={label} htmlFor="business-topics">
            {strings.businessTopics}
          </label>
          <textarea
            className="min-h-[120px] w-full rounded-none border border-border bg-paper px-5 py-4 text-ink"
            id="business-topics"
            name="topics"
            onChange={(event) => setTopics(event.target.value)}
            value={topics}
          />
          <p className="text-sm text-ink/80">{strings.businessTopicsHint}</p>
        </div>

        <div className={field}>
          <label className={label} htmlFor="welcome-en">
            {strings.welcomeEn}
          </label>
          <Input
            id="welcome-en"
            name="welcome-en"
            onChange={(event) => setWelcomeEn(event.target.value)}
            value={welcomeEn}
          />
        </div>

        <div className={field}>
          <label className={label} htmlFor="welcome-es">
            {strings.welcomeEs}
          </label>
          <Input
            id="welcome-es"
            name="welcome-es"
            onChange={(event) => setWelcomeEs(event.target.value)}
            value={welcomeEs}
          />
        </div>

        <Button className="self-start" type="submit">
          {strings.saveBusiness}
        </Button>

        {message === null ? null : (
          <p className="text-sm font-semibold text-ink" role="status">
            {message}
          </p>
        )}
        {error === null ? null : (
          <p className="text-sm font-semibold text-ink" role="alert">
            {error}
          </p>
        )}
      </form>

      <form onSubmit={uploadLogo}>
        <Panel className="flex max-w-[640px] flex-col gap-4">
          <SectionTitle level="h2">{strings.logoLabel}</SectionTitle>
          <Chip className="self-start">{stored ? strings.logoSet : strings.logoMissing}</Chip>
          <p className="max-w-[65ch] text-sm text-ink/80">{strings.logoHint}</p>
          <div className={field}>
            <label className={label} htmlFor="business-logo">
              {strings.logoLabel}
            </label>
            <Input
              accept="image/png,image/jpeg,image/webp"
              id="business-logo"
              name="logo"
              onChange={(event) => setLogo(event.target.files?.[0] ?? null)}
              type="file"
            />
          </div>
          <Button className="self-start" type="submit" variant="secondary">
            {strings.uploadLogo}
          </Button>
        </Panel>
      </form>
    </div>
  );
}

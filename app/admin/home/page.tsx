import Link from "next/link";
import { cookies } from "next/headers";
import { SectionTitle, focusRing } from "@/components/ui";
import { formatWhen, adminStrings } from "@/lib/i18n/admin";
import { LANG_COOKIE, resolveLang } from "@/lib/i18n/language";
import { setupChecklist } from "@/lib/admin/setup-checklist";
import { SETUP_STEP_ORDER } from "@/lib/admin/setup-copy";
import { sharedStore } from "@/lib/store/instance";
import { panelMetadata } from "@/lib/admin/titles";

export const dynamic = "force-dynamic";

// The workspace after the guided setup (decision 11: the first section of the navigation is Home). It answers two
// questions and nothing else: what is missing, and what the visitors asked lately. A step that is not verified is a
// door back into the lane, with the step already open, and a lane the owner skipped is offered again here, which is
// what "Skip for now" promises (decision 2).

export async function generateMetadata() {
  return panelMetadata("home");
}

export default async function AdminHome() {
  const stored = await cookies();
  const lang = resolveLang(stored.get(LANG_COOKIE)?.value, "en");
  const strings = adminStrings(lang);
  const store = await sharedStore(process.env);
  const checklist = await setupChecklist(store, process.env);
  const missing = checklist.steps.filter((step) => step.state !== "verified");
  const latest = await store.listRecentTurns(6);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <SectionTitle level="h1">
          {strings.homeTitle}
        </SectionTitle>
        <p className="max-w-[65ch] text-ink/80">{strings.homeIntro}</p>
      </div>

      <section aria-label={strings.homeMissing} className="flex flex-col gap-3">
        <h2 className="text-2xl font-bold tracking-[-0.02em] text-ink">{strings.homeMissing}</h2>
        {missing.length === 0 ? (
          <p className="text-ink/80">{strings.homeAllDone}</p>
        ) : (
          <ol className="flex flex-col">
            {SETUP_STEP_ORDER.filter((id) => missing.some((step) => step.id === id)).map((id) => {
              const step = missing.find((one) => one.id === id);

              return (
                <li className="border-t border-rule py-3" key={id}>
                  <Link
                    className={`flex min-h-11 flex-col gap-1 rounded-none py-2 text-ink ${focusRing}`}
                    href={`/admin?step=${id}`}
                  >
                    <span className="font-semibold">{step?.title[lang] ?? id}</span>
                    <span className="text-sm text-ink-2">{step?.detail[lang] ?? ""}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
        {checklist.skipped ? (
          <div className="flex flex-col gap-2">
            <p className="max-w-[65ch] text-sm text-ink-2">{strings.setupSkippedNote}</p>
            <p>
              <Link className="text-sm font-semibold text-ink underline underline-offset-4" href="/admin">
                {strings.setupOpen}
              </Link>
            </p>
          </div>
        ) : null}
      </section>

      <section aria-label={strings.homeLatest} className="flex flex-col gap-3">
        <h2 className="text-2xl font-bold tracking-[-0.02em] text-ink">{strings.homeLatest}</h2>
        {latest.length === 0 ? (
          <p className="text-ink/80">{strings.homeNoConversations}</p>
        ) : (
          <ul className="flex flex-col">
            {latest.map((turn) => (
              <li
                className="flex flex-col gap-1 border-t border-rule py-4"
                key={`${turn.sessionId}-${String(turn.turn)}`}
              >
                <p className="font-semibold text-ink">{turn.question}</p>
                <p className="max-w-[65ch] text-[16px] leading-[1.6] text-ink/80">{turn.answer}</p>
                <p className="text-sm text-ink-2 tabular-nums">{formatWhen(turn.createdAt, lang)}</p>
              </li>
            ))}
          </ul>
        )}
        <p>
          <Link className="text-sm font-semibold text-ink underline underline-offset-4" href="/admin/conversations">
            {strings.homeOpenPanel}
          </Link>
        </p>
      </section>
    </div>
  );
}

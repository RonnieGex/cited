import { cookies } from "next/headers";
import { AdminNav } from "@/components/admin/AdminNav";
import { LoginForm } from "@/components/admin/LoginForm";
import { Panel, SectionTitle } from "@/components/ui";
import { guardSession } from "@/lib/admin/guard";
import { SESSION_COOKIE } from "@/lib/admin/session";
import { adminStrings } from "@/lib/i18n/admin";
import { LANG_COOKIE, resolveLang } from "@/lib/i18n/language";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const stored = await cookies();
  const lang = resolveLang(stored.get(LANG_COOKIE)?.value, "en");
  const strings = adminStrings(lang);
  const guarded = guardSession(stored.get(SESSION_COOKIE)?.value, process.env);

  if (guarded.status === "unconfigured") {
    return (
      <main className="min-h-screen bg-paper px-6 py-16 text-ink">
        <Panel className="mx-auto flex max-w-[640px] flex-col gap-4">
          <SectionTitle level="h1" eyebrow={strings.panelEyebrow}>
            {strings.unconfiguredTitle}
          </SectionTitle>
          <p className="text-ink/80">
            {strings.unconfigured.replace("{variables}", guarded.missing.join(", "))}
          </p>
        </Panel>
      </main>
    );
  }

  if (guarded.status === "unauthorized") {
    return (
      <main className="min-h-screen bg-paper px-6 py-16 text-ink">
        <LoginForm strings={strings} />
      </main>
    );
  }

  return (
    <div lang={lang} className="min-h-screen bg-paper text-ink">
      <header className="border-b border-ink/10 px-6 py-6">
        <AdminNav lang={lang} strings={strings} />
      </header>
      <main className="mx-auto flex max-w-[960px] flex-col gap-10 px-6 py-12">{children}</main>
    </div>
  );
}

import { cookies } from "next/headers";
import { AdminNav } from "@/components/admin/AdminNav";
import { AuthShell } from "@/components/admin/AuthShell";
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
      <AuthShell lang={lang} strings={strings}>
        <Panel className="flex flex-col gap-4">
          <SectionTitle level="h1">
            {strings.unconfiguredTitle}
          </SectionTitle>
          <p className="text-ink/80">
            {strings.unconfigured.replace("{variables}", guarded.missing.join(", "))}
          </p>
        </Panel>
      </AuthShell>
    );
  }

  if (guarded.status === "unauthorized") {
    return (
      <AuthShell lang={lang} strings={strings}>
        <LoginForm strings={strings} />
      </AuthShell>
    );
  }

  return (
    <div lang={lang} className="min-h-screen bg-paper text-ink lg:grid lg:grid-cols-[240px_1fr]">
      <AdminNav lang={lang} strings={strings} />
      <main className="mx-auto flex w-full min-w-0 max-w-[960px] flex-col gap-10 px-6 py-12 lg:px-12">
        {children}
      </main>
    </div>
  );
}

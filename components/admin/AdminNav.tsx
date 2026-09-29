"use client";

import Link from "next/link";
import { LanguageSwitch } from "@/components/i18n/LanguageSwitch";
import { SignOutButton } from "@/components/admin/SignOutButton";
import type { AdminStrings } from "@/lib/i18n/admin";
import type { Lang } from "@/lib/settings/business";

export type AdminNavProps = {
  lang: Lang;
  strings: AdminStrings;
};

const links = "text-sm font-semibold text-ink underline-offset-4 hover:underline";

export function AdminNav({ lang, strings }: AdminNavProps) {
  return (
    <nav aria-label={strings.panelEyebrow} className="flex flex-wrap items-center gap-6">
      <ul className="flex flex-wrap items-center gap-6">
        <li>
          <Link className={links} href="/admin">
            {strings.navSetup}
          </Link>
        </li>
        <li>
          <Link className={links} href="/admin/business">
            {strings.navBusiness}
          </Link>
        </li>
        <li>
          <Link className={links} href="/admin/documents">
            {strings.navDocuments}
          </Link>
        </li>
        <li>
          <Link className={links} href="/admin/conversations">
            {strings.navConversations}
          </Link>
        </li>
      </ul>
      <div className="ml-auto flex items-center gap-6" data-testid="language-switch">
        <LanguageSwitch current={lang} />
        <SignOutButton strings={strings} />
      </div>
    </nav>
  );
}

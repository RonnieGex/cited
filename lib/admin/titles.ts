import type { Metadata } from "next";
import { cookies } from "next/headers";
import { guardSession } from "@/lib/admin/guard";
import { SESSION_COOKIE } from "@/lib/admin/session";
import { adminStrings } from "@/lib/i18n/admin";
import { LANG_COOKIE, resolveLang } from "@/lib/i18n/language";

// Decision 24 of `openspec/changes/brand-identity-ui/design.md`: every page of the panel has a title of its own, in the
// language of the panel ("Documents · Cited" / "Documentos · Cited"), so the tabs and the history tell them apart (WCAG 2.4.2).
// The layout answers with the sign-in or with the unfinished installation whenever it cannot show the page, and the title
// follows what the layout shows, so a signed-out visitor of `/admin/documents` reads the title of the sign-in.

// Decision 11 of `openspec/changes/guided-setup-and-knowledge/design.md` renamed the sections of the workspace, so the
// names of the titles are the ones of the new navigation, and every page of the round has its own.
export type PanelPage =
  | "setup"
  | "ai"
  | "conversations"
  | "home"
  | "information"
  | "try"
  | "publish"
  | "settings"
  | "document";

export async function panelMetadata(page: PanelPage): Promise<Metadata> {
  const stored = await cookies();
  const titles = adminStrings(resolveLang(stored.get(LANG_COOKIE)?.value, "en")).pageTitle;
  const guarded = guardSession(stored.get(SESSION_COOKIE)?.value, process.env);

  if (guarded.status === "unauthorized") {
    return { title: titles.signIn };
  }

  if (guarded.status === "unconfigured" || guarded.status === "short-password") {
    return { title: titles.unconfigured };
  }

  return { title: titles[page] };
}

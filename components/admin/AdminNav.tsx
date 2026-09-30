"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { BuiltByKatalis } from "@/components/admin/BuiltByKatalis";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { CitationMark, Wordmark } from "@/components/brand";
import { LanguageSwitch } from "@/components/i18n/LanguageSwitch";
import type { AdminStrings } from "@/lib/i18n/admin";
import type { Lang } from "@/lib/settings/business";

// Decision 7 of `openspec/changes/brand-identity-ui/design.md`: the panel is a workspace. This one element is the ink side
// column from 1024 px and, below it, an ink top bar: the wordmark, the sections in a list that scrolls sideways, then the
// switch and the sign-out in one row. It is one DOM at every width, so the panel keeps exactly one language switch and one
// sign-out.

// Decision 11 of `openspec/changes/guided-setup-and-knowledge/design.md`: the navigation takes the sections of the
// workspace in this order, each numbered with its citation mark: Home, Information, Try it, Conversations, Look and
// publish, AI and keys, Settings. "For the installer" is not one of them — it is the page of whoever installs, and it
// sits at the foot of the column as a quiet link, which is the only place of the panel where a variable of the
// environment is named.

export type AdminNavProps = {
  lang: Lang;
  strings: AdminStrings;
};

type Section = {
  href: string;
  name: "navHome" | "navInformation" | "navTry" | "navConversations" | "navPublish" | "navAi" | "navSettings";
};

const SECTIONS: readonly Section[] = [
  { href: "/admin/home", name: "navHome" },
  { href: "/admin/information", name: "navInformation" },
  { href: "/admin/try", name: "navTry" },
  { href: "/admin/conversations", name: "navConversations" },
  { href: "/admin/publish", name: "navPublish" },
  { href: "/admin/ai", name: "navAi" },
  { href: "/admin/settings", name: "navSettings" },
];

// `/admin` is the guided setup and the parent of every other section, so it is current only on its own path and on the
// steps of the setup; a section is current on its path and on the paths below it.
function isCurrent(pathname: string | null, href: string): boolean {
  if (pathname === null) {
    return false;
  }

  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;

  return path === href || path.startsWith(`${href}/`);
}

// The focus is the lime outline of the kit, drawn inside the link: the list scrolls sideways, and an outline outside it
// would be clipped by the scroller.
const link =
  "flex items-center gap-3 rounded-none px-3 py-2 text-[15px] font-semibold transition-colors duration-[var(--dur-fast)] max-lg:min-h-11 max-lg:whitespace-nowrap focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-lime";

// The side padding of the list on a phone (`px-6`), its scroll padding (`scroll-px-6`) and the width of its faded edges.
const EDGE = 24;

export function AdminNav({ lang, strings }: AdminNavProps) {
  const pathname = usePathname();
  const list = useRef<HTMLElement>(null);

  // On a phone the sections scroll sideways. The list stays at its start when the current section fits there; otherwise it
  // scrolls only as far as the current one needs to be whole and 24 px clear of the faded edge, so as many sections as
  // possible stay in view. The list itself is scrolled: `scrollIntoView` is not used here, because in Chromium it moves the
  // starting point of the sequential focus to the current link and the first Tab would skip the wordmark and every
  // section before it.
  useEffect(() => {
    const nav = list.current;
    const current = nav?.querySelector<HTMLElement>('[aria-current="page"]');

    if (!nav || !current || nav.scrollWidth <= nav.clientWidth) {
      return;
    }

    const edge = nav.getBoundingClientRect();
    const place = current.getBoundingClientRect();
    const after = place.right + EDGE - edge.right;
    const before = edge.left + EDGE - place.left;

    if (after > 0) {
      nav.scrollLeft += after;
    } else if (before > 0) {
      nav.scrollLeft -= before;
    }
  }, [pathname]);

  return (
    <div
      data-admin="sidebar"
      className="flex flex-col gap-4 bg-ink px-6 py-5 text-paper lg:sticky lg:top-0 lg:h-screen lg:gap-10 lg:py-8"
    >
      {/* The padding makes the link a target of 44 px on a phone and 24 px from 1024 px; the negative margin keeps the word
          where it was. */}
      <Wordmark size="sm" tone="ink" href="/admin" className="-my-1 self-start py-1 max-lg:-my-3 max-lg:py-3" />
      {/* A link reached with Tab is brought into view and kept 24 px clear of the edges, which fade where the list scrolls
          so a section cut by the edge reads as more to scroll, not as broken. */}
      <nav
        ref={list}
        aria-label={strings.panelEyebrow}
        className="-mx-6 scroll-px-6 overflow-x-auto px-6 max-lg:[mask-image:linear-gradient(to_right,transparent,black_24px,black_calc(100%-24px),transparent)] lg:mx-0 lg:overflow-visible lg:px-0"
      >
        <ol className="flex w-max gap-1 lg:w-auto lg:flex-col">
          {SECTIONS.map((section, index) => {
            const current = isCurrent(pathname, section.href);

            return (
              <li key={section.href} className="lg:w-full">
                <Link
                  href={section.href}
                  aria-current={current ? "page" : undefined}
                  onFocus={(event) => event.currentTarget.scrollIntoView?.({ inline: "nearest", block: "nearest" })}
                  className={`${link} ${current ? "bg-paper/10 text-paper" : "text-paper/80 hover:text-paper"}`}
                >
                  <CitationMark n={index + 1} tone="ink" state={current ? "open" : "rest"} />
                  {strings[section.name]}
                </Link>
              </li>
            );
          })}
        </ol>
      </nav>
      <div className="flex flex-wrap items-center justify-between gap-3 lg:mt-auto lg:flex-col lg:items-start lg:gap-4">
        <div data-testid="language-switch">
          <LanguageSwitch current={lang} tone="ink" />
        </div>
        <Link className={`${link} text-paper/80 hover:text-paper`} href="/admin/settings">
          {strings.panelInstaller}
        </Link>
        <SignOutButton strings={strings} />
        <BuiltByKatalis label={strings.builtBy} className="max-lg:hidden" />
      </div>
    </div>
  );
}

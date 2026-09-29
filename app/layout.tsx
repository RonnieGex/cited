import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { LANG_COOKIE, resolveLang } from "@/lib/i18n/language";

export const metadata: Metadata = {
  title: "Cited",
  description:
    "Cited, by Katalis: ask your own documents and get the passage and where it came from.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const stored = await cookies();
  const lang = resolveLang(stored.get(LANG_COOKIE)?.value, "en");

  return (
    <html lang={lang} className="font-sans">
      <body>{children}</body>
    </html>
  );
}

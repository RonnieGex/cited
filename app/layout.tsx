import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { LANG_COOKIE } from "@/lib/i18n/language";
import { readPublicBrand } from "@/lib/public/brand";

export const metadata: Metadata = {
  title: "Cited",
  description:
    "Cited, by Katalis: ask your own documents and get the passage and where it came from.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // The document declares the language of the page: the cookie of the visitor first, the language of the business
  // after it, and English when there are no settings yet.
  const cookie = (await cookies()).get(LANG_COOKIE)?.value;
  const brand = await readPublicBrand(cookie);

  return (
    <html lang={brand.lang} className="font-sans">
      <head>
        {/* The face the first frame is painted in: without the preload the page paints in the fallback and reflows when
            Outfit arrives (the sign-in form moved 37 px on a phone). It is the app's own file, never a font host. */}
        <link rel="preload" href="/fonts/outfit/outfit-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}

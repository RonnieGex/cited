import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cited",
  description:
    "Cited, by Katalis: answers from your own documents, with the page they came from.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

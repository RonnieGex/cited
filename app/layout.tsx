import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cited",
  description:
    "Cited, by Katalis: ask your own documents and get the passage and where it came from.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

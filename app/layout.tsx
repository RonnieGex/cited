import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Katalis Responde Community",
  description:
    "Free and forkable edition of Katalis Responde: a business answers with its own documents.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

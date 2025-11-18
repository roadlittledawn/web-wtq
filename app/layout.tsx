import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clinton Lexicon",
  description:
    "A personal collection of words, phrases, quotes, and hypotheticals",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

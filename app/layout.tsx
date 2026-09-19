import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://random.preference.com"),
  title: {
    default: "random.preference",
    template: "%s · random.preference",
  },
  description: "One question. Two choices. Every week.",
  openGraph: {
    title: "random.preference",
    description: "One question. Two choices. Every week.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Show Up — Your 90-Day Posting Calendar",
  description: "One post at a time. A simple 90-day accountability calendar for Instagram and LinkedIn.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

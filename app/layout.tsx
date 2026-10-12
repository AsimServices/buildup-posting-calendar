import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "90-Day Posting Calendar | BuildUp.pk",
  description: "One post at a time. A simple 90-day accountability calendar for Instagram and LinkedIn from BuildUp.pk.",
  icons: {
    icon: "/buildup-logo.png",
    shortcut: "/buildup-logo.png",
  },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#070a08" };

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

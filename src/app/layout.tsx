import type { Metadata } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";

export const metadata: Metadata = {
  title: "RegexLens - Understand, test, and visualize regex instantly",
  description:
    "A UI-first developer tool for understanding, testing, and documenting regular expressions. See what it matches, why it matches, and how it's structured.",
  keywords: [
    "regex",
    "regular expressions",
    "regex tester",
    "regex debugger",
    "regex explanation",
    "developer tools",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background font-sans antialiased">
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Sora } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { OptionalAdScript } from "@/components/observability/OptionalAdScript";
import { SiteAnalytics } from "@/components/observability/SiteAnalytics";
import { SiteSpeedInsights } from "@/components/observability/SiteSpeedInsights";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://regexlens.dev";
const siteName = "RegexLens";
const siteTitle = "RegexLens — Understand, Review & Debug Regular Expressions";
const siteDescription =
  "The fastest way to understand, review, and safely modify regular expressions. Paste any regex for plain-English explanations, safety warnings, structural analysis, and shareable review links — all in your browser.";

export const metadata: Metadata = {
  // Basic metadata
  title: {
    default: siteTitle,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  authors: [{ name: "RegexLens Team" }],
  generator: "Next.js",
  keywords: [
    "regex",
    "regular expressions",
    "regex review",
    "regex debugger",
    "regex visualizer",
    "regex explanation",
    "regex validator",
    "regex code review",
    "regex parser",
    "regex analyzer",
    "regex safety",
    "regex understanding",
    "pattern matching",
    "developer tools",
    "programming tools",
    "JavaScript regex",
    "regex online",
    "regex examples",
    "regex patterns",
    "text matching",
    "string parsing",
    "data extraction",
    "form validation",
    "input validation",
  ],
  referrer: "origin-when-cross-origin",
  creator: "RegexLens",
  publisher: "RegexLens",
  category: "Developer Tools",

  // Favicon and icons
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/favicon-32x32.png",
        color: "#3b82f6",
      },
    ],
  },

  // Web manifest
  manifest: "/site.webmanifest",

  // Open Graph metadata for social sharing
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: siteName,
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: `${siteUrl}/regexlens-logo.png`,
        width: 512,
        height: 512,
        alt: "RegexLens — Understand, Review & Debug Regular Expressions",
        type: "image/png",
      },
    ],
  },

  // Twitter Card metadata
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [`${siteUrl}/regexlens-logo.png`],
    creator: "@regexlens",
    site: "@regexlens",
  },

  // Robots directives
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Verification for search engines (add your actual verification codes)
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    // bing: process.env.BING_VERIFICATION,
  },

  // Alternate languages (if you add i18n later)
  alternates: {
    canonical: siteUrl,
    languages: {
      "en-US": siteUrl,
    },
  },

  // App-specific metadata
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: siteName,
  },

  // Format detection
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  // Other metadata
  other: {
    "msapplication-TileColor": "#0d1117",
    "msapplication-config": "/browserconfig.xml",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1117" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${jakarta.variable} ${sora.variable}`}>
      <head>
        {/* Structured Data - JSON-LD for rich search results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: siteName,
              description: siteDescription,
              url: siteUrl,
              applicationCategory: "DeveloperApplication",
              operatingSystem: "Any",
              browserRequirements: "Requires JavaScript",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
                description: "Free and open source",
              },
              featureList: [
                "Plain-English regex explanations",
                "Visual AST explorer",
                "Regex safety and risk analysis",
                "Pattern warnings and suggestions",
                "Match highlighting",
                "Capture group visualization",
                "Shareable regex review links",
                "Export to multiple formats",
              ],
              screenshot: `${siteUrl}/regexlens-logo.png`,
              softwareVersion: "1.0.0",
              author: {
                "@type": "Organization",
                name: "RegexLens",
                url: siteUrl,
              },
            }),
          }}
        />
        {/* Preconnect to external resources for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* DNS prefetch for third-party services */}
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <AuthProvider>
          <NuqsAdapter>{children}</NuqsAdapter>
        </AuthProvider>
        <Toaster 
          position="bottom-right" 
          theme="dark"
          toastOptions={{
            style: {
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              color: 'hsl(var(--foreground))',
            },
          }}
        />
        <SiteAnalytics />
        <SiteSpeedInsights />
        <OptionalAdScript />
      </body>
    </html>
  );
}

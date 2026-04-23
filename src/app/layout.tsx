import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { getBrand } from "@/lib/config/client";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const brand = getBrand();

/**
 * Canonical deployment URL. Used as `metadataBase` so every relative URL
 * in `openGraph.images`, `twitter.images`, and the icons block resolves
 * to an absolute URL crawlers can follow.
 */
const SITE_URL = "https://uigen.kevinriveros.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: brand.name,
    template: `%s · ${brand.name}`,
  },
  description: brand.tagline,
  applicationName: brand.name,
  authors: [
    { name: "Kevin Riveros", url: "https://github.com/kevin-riveros" },
  ],
  creator: "Kevin Riveros",
  publisher: "Kevin Riveros",
  keywords: [
    "AI UI generation",
    "React prototyping",
    "design system",
    "Claude",
    "Anthropic",
    "Next.js",
    "HeroUI",
    "Tailwind",
    "natural language to UI",
    "UI Gen",
  ],
  icons: {
    icon: [
      { url: "/logo/UIGen.ico", sizes: "any" },
      { url: "/logo/UIGen.svg", type: "image/svg+xml" },
    ],
    shortcut: "/logo/UIGen.ico",
    apple: "/logo/UIGen.ico",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: brand.name,
    title: brand.name,
    description: brand.tagline,
    locale: "en_US",
    images: [
      {
        url: "/logo/UIGen.svg",
        alt: brand.name,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: brand.name,
    description: brand.tagline,
    images: ["/logo/UIGen.svg"],
    creator: "@kevinriverosdev",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./components/Providers";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import VisitorNotifier from "./components/VisitorNotifier";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B1120",
};

export const metadata: Metadata = {
  title: {
    default: "PlanetKit — 100% Free All in One Online Tools",
    template: "%s | PlanetKit",
  },
  description:
    "100% Free all in one online tools — convert, merge, split, rotate, compress PDFs, extract text, edit metadata, and generate QR codes. All processing happens in your browser. Nothing ever leaves your device.",
  keywords: [
    "PDF tools",
    "PDF converter",
    "merge PDF",
    "split PDF",
    "compress PDF",
    "QR code generator",
    "100% free all in one online tools",
    "privacy",
  ],
  icons: {
    icon: "/planetkit.png",
  },
  openGraph: {
    title: "PlanetKit — 100% Free All in One Online Tools",
    description:
      "100% Free all in one online tools — convert, merge, split, rotate, compress, and more. All processing happens in your browser.",
    type: "website",
    siteName: "PlanetKit",
    images: ["/planetkit.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "PlanetKit — 100% Free All in One Online Tools",
    description:
      "100% Free all in one online tools — convert, merge, split, rotate, compress, and more. All processing happens in your browser.",
    images: ["/planetkit.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "PlanetKit",
    url: "https://planetkit.vercel.app",
    description: "100% free all in one online tools for PDF, images, and more — all processed in your browser.",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.setAttribute("data-theme", localStorage.getItem("planet-theme") || "dark");`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <VisitorNotifier />
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

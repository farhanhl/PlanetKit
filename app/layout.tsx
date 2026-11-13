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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://planetkit.vercel.app"),
  title: {
    default: "PlanetKit | Free Browser-Based File & Developer Tools",
    template: "%s | PlanetKit",
  },
  description:
    "Free browser-based tools to convert, merge, split, rotate, and compress PDFs, extract text, edit metadata, and generate QR codes with local processing.",
  keywords: [
    "PDF tools",
    "PDF converter",
    "merge PDF",
    "split PDF",
    "compress PDF",
    "QR code generator",
    "browser tools",
    "privacy",
  ],
  icons: {
    icon: "/planetkit.png",
  },
  openGraph: {
    title: "PlanetKit | Free Browser-Based File & Developer Tools",
    description:
      "Free browser-based tools to convert, merge, split, rotate, and compress files locally in your browser.",
    type: "website",
    siteName: "PlanetKit",
    images: ["/planetkit.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "PlanetKit | Free Browser-Based File & Developer Tools",
    description:
      "Free browser-based tools to convert, merge, split, rotate, and compress files locally in your browser.",
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
    description: "Browser-based developer and file tools for PDF, images, and code with local client-side processing.",
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

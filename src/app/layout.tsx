import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider";
import "./globals.css";

const displayFont = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const sansFont = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "SeoBeacon | Website SEO Auditor & Diagnostics",
  description: "A detailed website SEO grader, social debugger, and backlink analyzer powered by Cheerio and Groq AI.",
  keywords: [
    "SEO Grader",
    "AI SEO Auditor",
    "On-page SEO Checker",
    "Social Preview Debugger",
    "Open Source SEO Tool",
    "Website Diagnostics Checklist",
    "Cheerio scraper",
    "Groq AI Llama 3"
  ],
  authors: [{ name: "Shrey Jaiswal", url: "https://lazyshrey.in" }],
  alternates: {
    canonical: "https://seobeacon.lazyshrey.in/",
  },
  openGraph: {
    title: "SeoBeacon | Website SEO Auditor & Diagnostics",
    description: "A detailed website SEO grader, social debugger, and backlink analyzer powered by Cheerio and Groq AI.",
    url: "https://seobeacon.lazyshrey.in/",
    siteName: "SeoBeacon",
    images: [
      {
        url: "https://seobeacon.lazyshrey.in/og-image.png",
        width: 1200,
        height: 630,
        alt: "SeoBeacon AI SEO Auditor Preview Image",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SeoBeacon | Website SEO Auditor & Diagnostics",
    description: "A detailed website SEO grader, social debugger, and backlink analyzer powered by Cheerio and Groq AI.",
    images: ["https://seobeacon.lazyshrey.in/og-image.png"],
    creator: "@lazy_shrey",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${sansFont.variable} scroll-smooth`}
    >
      <body className="bg-background text-foreground font-sans min-h-screen selection:bg-[#ffafcc]/30 selection:text-[#a2d2ff] antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "SeoBeacon",
              "operatingSystem": "All",
              "applicationCategory": "BusinessApplication",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "description": "An open-source, free AI-powered SEO auditor, diagnostics checklist, and social card debugger.",
              "creator": {
                "@type": "Person",
                "name": "Shrey Jaiswal",
                "url": "https://lazyshrey.in"
              }
            })
          }}
        />
        <SmoothScrollProvider>
          {children}
        </SmoothScrollProvider>
      </body>
    </html>
  );
}

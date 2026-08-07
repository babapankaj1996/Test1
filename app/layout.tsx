import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";
import { getSettings } from "@/lib/settings";
import JsonLd from "@/components/JsonLd";
import { organizationSchema, websiteSchema } from "@/lib/schema";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = getSettings();
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${settings.site_name} — ${settings.site_tagline}`,
      template: `%s | ${settings.site_name}`,
    },
    description: settings.site_description,
    openGraph: {
      type: "website",
      siteName: settings.site_name,
      url: SITE_URL,
    },
    twitter: { card: "summary_large_image" },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: "#05060f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const settings = getSettings();
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <JsonLd data={websiteSchema(settings.site_name, settings.site_description)} />
        <JsonLd data={organizationSchema(settings.site_name, settings.site_description)} />
        {children}
      </body>
    </html>
  );
}

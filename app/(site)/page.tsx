import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { SITE_URL } from "@/lib/site";
import HomeView from "@/components/HomeView";

export const dynamic = "force-dynamic";

interface HomeSearchParams {
  q?: string;
  tag?: string;
  category?: string;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<HomeSearchParams>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const settings = getSettings();
  const filtered = !!(sp.q || sp.tag || sp.category);

  let title = `${settings.site_name} — ${settings.site_tagline}`;
  let description = settings.site_description;
  if (sp.q) {
    title = `Search results for “${sp.q}”`;
    description = `Articles matching “${sp.q}” on ${settings.site_name}.`;
  } else if (sp.tag) {
    title = `Posts tagged #${sp.tag}`;
    description = `All ${settings.site_name} articles tagged with ${sp.tag}.`;
  } else if (sp.category) {
    title = `${sp.category} articles`;
  }

  return {
    title,
    description,
    alternates: { canonical: SITE_URL },
    robots: filtered ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: { title, description, url: SITE_URL, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<HomeSearchParams>;
}) {
  const sp = await searchParams;
  return (
    <HomeView
      pageNum={1}
      filters={{
        q: sp.q?.trim().slice(0, 100) || undefined,
        tag: sp.tag || undefined,
        category: sp.category || undefined,
      }}
    />
  );
}

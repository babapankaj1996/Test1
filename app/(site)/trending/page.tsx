import type { Metadata } from "next";
import Link from "next/link";
import { getPosts } from "@/lib/posts";
import { getSettings } from "@/lib/settings";
import { absoluteUrl } from "@/lib/site";
import PostCard from "@/components/PostCard";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = getSettings();
  const title = "Trending — Top 10 Most Read Articles";
  const description = `The 10 most read articles on ${settings.site_name} right now, ranked by reader views.`;
  const url = absoluteUrl("/trending");
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function TrendingPage() {
  const top = getPosts({ orderBy: "views", perPage: 10 });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Trending", url: "/trending" },
        ])}
      />
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="transition-colors hover:text-neon">Home</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-white/80">Trending</li>
        </ol>
      </nav>

      <header className="text-center">
        <p className="eyebrow justify-center">What everyone&apos;s reading</p>
        <h1 className="font-display mt-3 text-3xl font-bold sm:text-4xl">
          🔥 Trending — <span className="gradient-text">Top 10 Most Read</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          The most read articles on the site right now, ranked by total views.
        </p>
      </header>

      {top.items.length > 0 ? (
        <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {top.items.map((post, i) => (
            <div key={post.id} className="relative">
              <span
                aria-hidden="true"
                className={`font-display absolute -top-3 left-4 z-10 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white shadow-lg ${
                  i < 3
                    ? "bg-gradient-to-br from-amber-400 to-fuchsia-pop shadow-amber-400/30"
                    : "bg-gradient-to-br from-pulse to-fuchsia-pop shadow-fuchsia-pop/30"
                }`}
              >
                {i + 1}
              </span>
              <PostCard post={post} priority={i < 3} />
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-10 text-center text-muted">No published posts yet.</p>
      )}
    </div>
  );
}

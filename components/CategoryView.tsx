import Link from "next/link";
import { notFound } from "next/navigation";
import { getPosts } from "@/lib/posts";
import { getSettings } from "@/lib/settings";
import type { Category } from "@/lib/types";
import PostCard from "@/components/PostCard";
import Pagination from "@/components/Pagination";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";

export default function CategoryView({
  category,
  pageNum = 1,
}: {
  category: Category;
  pageNum?: number;
}) {
  const settings = getSettings();
  const posts = getPosts({
    category: category.slug,
    page: pageNum,
    perPage: settings.posts_per_page,
  });
  if (pageNum > 1 && pageNum > posts.totalPages) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: category.name, url: `/${category.slug}` },
        ])}
      />
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="transition-colors hover:text-neon">Home</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-white/80">{category.name}</li>
        </ol>
      </nav>

      <header className="text-center">
        <p className="eyebrow justify-center">Category</p>
        <h1 className="font-display mt-3 text-3xl font-bold sm:text-4xl">
          <span className="gradient-text">{category.name}</span>
        </h1>
        {category.description && (
          <p className="mx-auto mt-3 max-w-xl text-muted">{category.description}</p>
        )}
        <p className="mt-2 text-sm text-muted">
          {posts.total} article{posts.total === 1 ? "" : "s"}
          {pageNum > 1 ? ` · page ${pageNum}` : ""}
        </p>
      </header>

      {posts.items.length > 0 ? (
        <>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {posts.items.map((post, i) => (
              <PostCard key={post.id} post={post} priority={i < 3 && pageNum === 1} />
            ))}
          </div>
          <Pagination
            page={posts.page}
            totalPages={posts.totalPages}
            basePath={`/${category.slug}`}
          />
        </>
      ) : (
        <div className="glass mx-auto mt-12 max-w-md rounded-2xl p-10 text-center">
          <h2 className="font-display text-xl font-bold">No posts yet</h2>
          <p className="mt-2 text-sm text-muted">
            Nothing has been published in this category so far.
          </p>
          <Link href="/" className="btn-primary mt-6">
            Browse all posts
          </Link>
        </div>
      )}
    </div>
  );
}

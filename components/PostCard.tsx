import Image from "next/image";
import Link from "next/link";
import type { Post } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { postPath } from "@/lib/urls";

export default function PostCard({
  post,
  priority = false,
}: {
  post: Post;
  priority?: boolean;
}) {
  return (
    <article className="card-hover glass group flex h-full flex-col overflow-hidden rounded-2xl">
      <Link href={postPath(post)} className="relative block aspect-[4/5] overflow-hidden bg-panel">
        {post.featured_image ? (
          <Image
            src={post.featured_image}
            alt={post.image_alt || post.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
            loading={priority ? undefined : "lazy"}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-pulse/35 via-fuchsia-pop/15 to-cyan-glow/20">
            <span className="font-display text-3xl font-bold text-white/40">
              {post.title.charAt(0)}
            </span>
          </div>
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
        {post.is_pinned === 1 && (
          <span className="absolute left-3 top-3 rounded-full bg-gradient-to-r from-pulse to-fuchsia-pop/90 px-2.5 py-1 text-[11px] font-semibold text-white shadow-md">
            📌 Pinned
          </span>
        )}
        <span
          className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur"
          title={`${post.view_count.toLocaleString()} views`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          {post.view_count.toLocaleString()}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {post.category_slug && (
            <Link href={`/${post.category_slug}`} className="chip-category px-2.5 py-0.5 text-xs">
              {post.category_name}
            </Link>
          )}
          {post.is_trending === 1 && (
            <Link href="/trending" className="chip-tag px-2.5 py-0.5 text-xs">
              🔥 Trending
            </Link>
          )}
        </div>

        <h3 className="font-display mt-2.5 text-base font-bold leading-snug sm:text-lg">
          <Link href={postPath(post)} className="transition-colors hover:text-glow">
            {post.title}
          </Link>
        </h3>

        {post.excerpt && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{post.excerpt}</p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/5 pt-3 text-xs text-muted">
          <time dateTime={post.published_at ?? undefined}>
            {formatDate(post.published_at)}
          </time>
          <span>{post.reading_time} min read</span>
        </div>
      </div>
    </article>
  );
}

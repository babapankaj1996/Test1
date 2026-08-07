import Link from "next/link";
import Form from "next/form";
import { getPosts } from "@/lib/posts";
import { formatDate } from "@/lib/format";
import { postPath } from "@/lib/urls";
import Pagination from "@/components/Pagination";
import DeletePostButton from "@/components/admin/DeletePostButton";

export const dynamic = "force-dynamic";

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const q = sp.q?.trim() || undefined;
  const status = sp.status === "draft" || sp.status === "published" ? sp.status : "all";

  const posts = getPosts({ page, perPage: 10, q, status });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold">Posts</h1>
        <Link href="/admin/posts/new" className="btn-primary">
          + New Post
        </Link>
      </div>

      <Form action="/admin/posts" className="mt-6 flex flex-wrap gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search posts…"
          className="field max-w-xs"
          aria-label="Search posts"
        />
        <select name="status" defaultValue={status} className="field max-w-[160px]" aria-label="Filter by status">
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <button type="submit" className="btn-ghost">
          Filter
        </button>
      </Form>

      <div className="glass mt-6 overflow-x-auto rounded-xl">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-muted">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Flags</th>
              <th className="px-4 py-3">Views</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.items.map((p) => (
              <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                <td className="max-w-[260px] px-4 py-3">
                  <Link href={`/admin/posts/${p.id}`} className="line-clamp-1 font-medium hover:text-glow">
                    {p.title}
                  </Link>
                  <span className="line-clamp-1 text-xs text-muted">{postPath(p)}</span>
                </td>
                <td className="px-4 py-3 text-muted">{p.category_name ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      p.status === "published"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-amber-500/15 text-amber-300"
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">
                  {p.is_pinned === 1 && <span title="Pinned">📌</span>}
                  {p.is_featured === 1 && <span title="Featured">★</span>}
                  {p.is_trending === 1 && <span title="Trending">🔥</span>}
                </td>
                <td className="px-4 py-3 text-muted">{p.view_count.toLocaleString()}</td>
                <td className="px-4 py-3 text-muted">{formatDate(p.published_at ?? p.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {p.status === "published" && (
                      <Link href={postPath(p)} className="btn-ghost !px-2.5 !py-1 text-xs" target="_blank">
                        View
                      </Link>
                    )}
                    <Link href={`/admin/posts/${p.id}`} className="btn-ghost !px-2.5 !py-1 text-xs">
                      Edit
                    </Link>
                    <DeletePostButton postId={p.id} postTitle={p.title} />
                  </div>
                </td>
              </tr>
            ))}
            {posts.items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted">
                  No posts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={posts.page}
        totalPages={posts.totalPages}
        basePath="/admin/posts"
        searchParams={{ q, status: sp.status }}
      />
    </div>
  );
}

import Link from "next/link";
import { getDb } from "@/lib/db";
import { getPosts } from "@/lib/posts";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function AdminDashboard() {
  const db = getDb();
  const count = (sql: string) => (db.prepare(sql).get() as { n: number }).n;

  const stats = [
    { label: "Published posts", value: count("SELECT COUNT(*) AS n FROM posts WHERE status = 'published'") },
    { label: "Drafts", value: count("SELECT COUNT(*) AS n FROM posts WHERE status = 'draft'") },
    { label: "Total views", value: count("SELECT COALESCE(SUM(view_count), 0) AS n FROM posts") },
    { label: "Categories", value: count("SELECT COUNT(*) AS n FROM categories") },
    { label: "Tags", value: count("SELECT COUNT(*) AS n FROM tags") },
    { label: "FAQs", value: count("SELECT COUNT(*) AS n FROM post_faqs") },
  ];

  const recent = getPosts({ status: "all", perPage: 6 });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <Link href="/admin/posts/new" className="btn-primary">
          + New Post
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="glass rounded-xl p-4">
            <p className="font-display text-2xl font-bold text-white">{s.value.toLocaleString()}</p>
            <p className="mt-1 text-xs text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <h2 className="font-display mt-10 text-lg font-bold">Recent posts</h2>
      <div className="glass mt-4 overflow-x-auto rounded-xl">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-muted">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Views</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {recent.items.map((p) => (
              <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                <td className="px-4 py-3">
                  <Link href={`/admin/posts/${p.id}`} className="font-medium hover:text-glow">
                    {p.title}
                  </Link>
                </td>
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
                <td className="px-4 py-3 text-muted">{p.view_count.toLocaleString()}</td>
                <td className="px-4 py-3 text-muted">{formatDate(p.published_at ?? p.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

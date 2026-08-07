"use client";

import { useState } from "react";
import type { StaticPage } from "@/lib/types";

export default function PagesManager({ initialPages }: { initialPages: StaticPage[] }) {
  const [pages, setPages] = useState(initialPages);
  const [selectedId, setSelectedId] = useState(initialPages[0]?.id ?? 0);
  const selected = pages.find((p) => p.id === selectedId);

  const [form, setForm] = useState<Partial<StaticPage>>(selected ?? {});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  function selectPage(page: StaticPage) {
    setSelectedId(page.id);
    setForm({ ...page });
    setMessage(null);
  }

  async function save() {
    if (!selected) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/pages/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          slug: form.slug,
          content: form.content,
          seo_title: form.seo_title,
          seo_description: form.seo_description,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to save" });
        return;
      }
      setPages((prev) => prev.map((p) => (p.id === data.id ? data : p)));
      setMessage({ type: "ok", text: "Page saved ✓" });
    } finally {
      setBusy(false);
    }
  }

  const labelCls = "mb-1.5 block text-sm font-medium text-white/80";

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <nav className="glass h-fit rounded-xl p-2" aria-label="Pages">
        {pages.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => selectPage(p)}
            className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              selectedId === p.id ? "bg-pulse/20 text-white" : "text-muted hover:bg-white/5"
            }`}
          >
            {p.title}
            <span className="block text-xs opacity-60">/{p.slug}</span>
          </button>
        ))}
      </nav>

      {selected && (
        <div className="glass min-w-0 rounded-xl p-5">
          {message && (
            <p
              role="alert"
              className={`mb-4 rounded-lg border px-3 py-2 text-sm ${
                message.type === "ok"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-red-500/30 bg-red-500/10 text-red-300"
              }`}
            >
              {message.text}
            </p>
          )}
          {selected.template === "categories" && (
            <p className="mb-4 rounded-lg border border-fuchsia-500/25 bg-fuchsia-500/10 px-3 py-2 text-xs text-fuchsia-200">
              Special page: automatically lists all categories. The content below is shown as an
              intro; title and slug are fully editable.
            </p>
          )}
          <label className={labelCls}>Title</label>
          <input
            value={form.title ?? ""}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="field"
            maxLength={150}
          />
          <label className={`${labelCls} mt-4`}>Slug (URL)</label>
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-sm text-muted">/</span>
            <input
              value={form.slug ?? ""}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className="field"
              maxLength={96}
            />
          </div>
          <label className={`${labelCls} mt-4`}>Content (HTML)</label>
          <textarea
            value={form.content ?? ""}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="field min-h-[320px] font-mono !text-[13px]"
          />
          <label className={`${labelCls} mt-4`}>SEO title</label>
          <input
            value={form.seo_title ?? ""}
            onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
            className="field"
            maxLength={200}
          />
          <label className={`${labelCls} mt-4`}>SEO description</label>
          <textarea
            value={form.seo_description ?? ""}
            onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
            className="field min-h-[60px]"
            maxLength={400}
          />
          <button type="button" onClick={save} disabled={busy} className="btn-primary mt-5">
            {busy ? "Saving…" : "Save page"}
          </button>
        </div>
      )}
    </div>
  );
}

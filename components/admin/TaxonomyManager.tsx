"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import HtmlEditor from "@/components/admin/HtmlEditor";

interface Item {
  id: number;
  name: string;
  slug: string;
  description: string;
  content?: string;
  seo_title?: string;
  seo_description?: string;
  show_in_nav?: number | boolean;
  show_in_footer?: number | boolean;
  post_count?: number;
}

/**
 * Shared CRUD manager for categories and tags.
 */
export default function TaxonomyManager({
  kind,
  initialItems,
}: {
  kind: "categories" | "tags";
  initialItems: Item[];
}) {
  const router = useRouter();
  const isCategory = kind === "categories";
  const [items, setItems] = useState(initialItems);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState<Partial<Item>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function startCreate() {
    setEditing(null);
    setForm({});
    setError("");
  }

  function startEdit(item: Item) {
    setEditing(item);
    setForm({ ...item });
    setError("");
  }

  async function refresh() {
    const res = await fetch(`/api/admin/${kind}`);
    if (res.ok) {
      const data = await res.json();
      setItems(data.items);
    }
    router.refresh();
  }

  async function save() {
    if (!form.name?.trim()) {
      setError("Name is required");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const payload = isCategory
        ? {
            ...form,
            show_in_nav: form.show_in_nav !== false && form.show_in_nav !== 0,
            show_in_footer: form.show_in_footer !== false && form.show_in_footer !== 0,
          }
        : form;
      const res = await fetch(editing ? `/api/admin/${kind}/${editing.id}` : `/api/admin/${kind}`, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save");
        return;
      }
      setForm({});
      setEditing(null);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: Item) {
    const warning = isCategory
      ? `Delete category “${item.name}”? Posts in it will become uncategorised.`
      : `Delete tag “${item.name}”? It will be removed from all posts.`;
    if (!confirm(warning)) return;
    const res = await fetch(`/api/admin/${kind}/${item.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to delete");
      return;
    }
    if (editing?.id === item.id) startCreate();
    await refresh();
  }

  const labelCls = "mb-1.5 block text-sm font-medium text-white/80";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="glass overflow-x-auto rounded-xl">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-muted">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Posts</th>
              {isCategory && <th className="px-4 py-3">Visibility</th>}
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3 text-muted">{item.slug}</td>
                <td className="px-4 py-3 text-muted">{item.post_count ?? 0}</td>
                {isCategory && (
                  <td className="px-4 py-3">
                    <span className="flex gap-1.5 text-xs">
                      {item.show_in_nav ? (
                        <span className="chip-category !px-2 !py-0.5">Nav</span>
                      ) : null}
                      {item.show_in_footer ? (
                        <span className="chip-tag px-2 py-0.5">Footer</span>
                      ) : null}
                      {!item.show_in_nav && !item.show_in_footer && (
                        <span className="text-muted">hidden</span>
                      )}
                    </span>
                  </td>
                )}
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => startEdit(item)} className="btn-ghost !px-2.5 !py-1 text-xs">
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(item)}
                      className="btn-ghost !px-2.5 !py-1 text-xs hover:!border-red-400/50 hover:!text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={isCategory ? 5 : 4} className="px-4 py-10 text-center text-muted">
                  Nothing here yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="glass h-fit rounded-xl p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold">
            {editing ? `Edit ${isCategory ? "category" : "tag"}` : `New ${isCategory ? "category" : "tag"}`}
          </h2>
          {editing && (
            <button type="button" onClick={startCreate} className="text-xs text-neon hover:opacity-80">
              + New instead
            </button>
          )}
        </div>
        {error && (
          <p role="alert" className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
        <label className={`${labelCls} mt-4`}>Name *</label>
        <input
          value={form.name ?? ""}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="field"
          placeholder="Name"
        />
        <label className={`${labelCls} mt-4`}>Slug</label>
        <input
          value={form.slug ?? ""}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
          className="field"
          placeholder="auto-generated-from-name"
        />
        <label className={`${labelCls} mt-4`}>Description</label>
        <textarea
          value={form.description ?? ""}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="field min-h-[60px]"
        />
        {isCategory && (
          <>
            <div className="mt-4 space-y-2.5 text-sm">
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={form.show_in_nav !== false && form.show_in_nav !== 0}
                  onChange={(e) => setForm({ ...form, show_in_nav: e.target.checked })}
                  className="h-4 w-4 accent-[#8b5cf6]"
                />
                Show in navbar
              </label>
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={form.show_in_footer !== false && form.show_in_footer !== 0}
                  onChange={(e) => setForm({ ...form, show_in_footer: e.target.checked })}
                  className="h-4 w-4 accent-[#8b5cf6]"
                />
                Show in footer
              </label>
            </div>
            <div className="mt-4">
              <HtmlEditor
                id="category-content"
                label="Category page content"
                value={form.content ?? ""}
                onChange={(content) => setForm({ ...form, content })}
                rows={14}
                placeholder="<h2>About this topic</h2>&#10;<p>Add SEO content for this category page.</p>"
              />
            </div>
            <label className={`${labelCls} mt-4`}>SEO title</label>
            <input
              value={form.seo_title ?? ""}
              onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
              className="field"
            />
            <label className={`${labelCls} mt-4`}>SEO description</label>
            <textarea
              value={form.seo_description ?? ""}
              onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
              className="field min-h-[60px]"
            />
          </>
        )}
        <button type="button" onClick={save} disabled={busy} className="btn-primary mt-5 w-full">
          {busy ? "Saving…" : editing ? "Update" : "Create"}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import type { SiteSettings } from "@/lib/settings";

export default function SettingsForm({ initial }: { initial: SiteSettings }) {
  const [form, setForm] = useState({ ...initial, posts_per_page: String(initial.posts_per_page) });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [key]: e.target.value });

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to save settings" });
        return;
      }
      setMessage({ type: "ok", text: "Settings saved ✓" });
    } finally {
      setBusy(false);
    }
  }

  const labelCls = "mb-1.5 block text-sm font-medium text-white/80";

  return (
    <div className="glass max-w-2xl rounded-xl p-6">
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

      <label className={labelCls}>Site name</label>
      <input value={form.site_name} onChange={set("site_name")} className="field" maxLength={80} />

      <label className={`${labelCls} mt-4`}>Tagline</label>
      <input value={form.site_tagline} onChange={set("site_tagline")} className="field" maxLength={160} />

      <label className={`${labelCls} mt-4`}>Site description (used for homepage SEO)</label>
      <textarea
        value={form.site_description}
        onChange={set("site_description")}
        className="field min-h-[70px]"
        maxLength={400}
      />

      <label className={`${labelCls} mt-4`}>Posts per page (pagination limit)</label>
      <input
        type="number"
        min={1}
        max={50}
        value={form.posts_per_page}
        onChange={set("posts_per_page")}
        className="field max-w-[120px]"
      />

      <h2 className="font-display mt-6 text-base font-bold">Social links</h2>
      {(
        [
          ["social_twitter", "Twitter / X URL"],
          ["social_facebook", "Facebook URL"],
          ["social_instagram", "Instagram URL"],
          ["social_youtube", "YouTube URL"],
        ] as const
      ).map(([key, label]) => (
        <div key={key}>
          <label className={`${labelCls} mt-4`}>{label}</label>
          <input value={form[key]} onChange={set(key)} className="field" placeholder="https://…" maxLength={300} />
        </div>
      ))}

      <button type="button" onClick={save} disabled={busy} className="btn-primary mt-6">
        {busy ? "Saving…" : "Save settings"}
      </button>
    </div>
  );
}

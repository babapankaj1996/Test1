"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeletePostButton({
  postId,
  postTitle,
}: {
  postId: number;
  postTitle: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!confirm(`Delete “${postTitle}”? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/posts/${postId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to delete post");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={busy}
      className="btn-ghost !px-2.5 !py-1 text-xs hover:!border-red-400/50 hover:!text-red-300"
    >
      {busy ? "…" : "Delete"}
    </button>
  );
}

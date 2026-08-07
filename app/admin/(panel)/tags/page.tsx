import { getTags } from "@/lib/posts";
import TaxonomyManager from "@/components/admin/TaxonomyManager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Tags" };

export default function AdminTagsPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Tags</h1>
      <p className="mt-1 text-sm text-muted">
        Tags act as filters only (/?tag=slug) — they never create separate pages.
      </p>
      <div className="mt-6">
        <TaxonomyManager kind="tags" initialItems={getTags()} />
      </div>
    </div>
  );
}

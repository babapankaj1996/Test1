import { getCategories } from "@/lib/posts";
import TaxonomyManager from "@/components/admin/TaxonomyManager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Categories" };

export default function AdminCategoriesPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Categories</h1>
      <p className="mt-1 text-sm text-muted">
        Each category gets its own SEO-optimised page at /category/&lt;slug&gt;.
      </p>
      <div className="mt-6">
        <TaxonomyManager kind="categories" initialItems={getCategories()} />
      </div>
    </div>
  );
}

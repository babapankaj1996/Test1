import { getStaticPages } from "@/lib/posts";
import PagesManager from "@/components/admin/PagesManager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Pages" };

export default function AdminPagesPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Footer Pages</h1>
      <p className="mt-1 text-sm text-muted">
        Edit About, Contact, Privacy Policy and Terms &amp; Conditions content.
      </p>
      <div className="mt-6">
        <PagesManager initialPages={getStaticPages()} />
      </div>
    </div>
  );
}

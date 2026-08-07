import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCategories, getCategoriesPage, getStaticPages } from "@/lib/posts";
import { getSettings } from "@/lib/settings";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = getSettings();
  // The admin toggle is authoritative — no post-count requirement.
  const navCategories = getCategories().filter((c) => c.show_in_nav === 1);
  const categoriesPage = getCategoriesPage();
  // Contact page keeps its nav spot even if the admin renames its title/slug.
  const contactPage =
    getStaticPages().find(
      (p) => p.template !== "categories" && (p.slug === "contact" || /contact/i.test(p.title))
    ) ?? null;
  return (
    <>
      <Header
        siteName={settings.site_name}
        categories={navCategories.map((c) => ({ name: c.name, slug: c.slug }))}
        categoriesPage={
          categoriesPage ? { title: categoriesPage.title, slug: categoriesPage.slug } : null
        }
        contactPage={contactPage ? { title: contactPage.title, slug: contactPage.slug } : null}
      />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}

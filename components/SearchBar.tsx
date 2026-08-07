import Form from "next/form";

/**
 * Server-rendered search form — no JS needed; submits as GET to /?q=…
 */
export default function SearchBar({
  defaultValue = "",
  placeholder = "Search articles, topics, ideas…",
  align = "center",
}: {
  defaultValue?: string;
  placeholder?: string;
  align?: "center" | "left";
}) {
  return (
    <Form
      action="/"
      role="search"
      className={`relative w-full max-w-xl ${align === "center" ? "mx-auto" : ""}`}
    >
      <label htmlFor="site-search" className="sr-only">
        Search posts
      </label>
      <input
        id="site-search"
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="field !rounded-full !border-white/15 !py-3.5 !pl-12 !pr-28 shadow-[0_0_50px_-12px_rgba(217,70,239,0.45)]"
      />
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
        className="pointer-events-none absolute left-4.5 top-1/2 -translate-y-1/2 text-muted"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
      <button
        type="submit"
        className="btn-primary absolute right-1.5 top-1/2 -translate-y-1/2 !rounded-full !py-2 text-sm"
      >
        Search
      </button>
    </Form>
  );
}

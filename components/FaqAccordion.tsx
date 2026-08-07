import type { PostFaq } from "@/lib/types";

/**
 * CSS-only accordion using <details>/<summary> — zero JavaScript, fully accessible.
 */
export default function FaqAccordion({ faqs }: { faqs: PostFaq[] }) {
  if (!faqs.length) return null;
  return (
    <section aria-labelledby="faq-heading" className="mt-12">
      <h2 id="faq-heading" className="font-display text-2xl font-bold">
        Frequently Asked <span className="gradient-text">Questions</span>
      </h2>
      <div className="mt-5 space-y-3">
        {faqs.map((faq) => (
          <details key={faq.id} className="glass group rounded-xl">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-medium [&::-webkit-details-marker]:hidden">
              <span>{faq.question}</span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
                className="shrink-0 text-glow transition-transform duration-300 group-open:rotate-45"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </summary>
            <div
              className="prose-content border-t border-white/10 px-5 py-4 !text-[0.95rem]"
              dangerouslySetInnerHTML={{ __html: faq.answer }}
            />
          </details>
        ))}
      </div>
    </section>
  );
}

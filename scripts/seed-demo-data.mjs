// Adds extra demo posts (published + drafts) on top of the base seed.
// Idempotent: skips any slug that already exists. Run: node scripts/seed-demo-data.mjs
import { DatabaseSync } from "node:sqlite";
import path from "path";

const db = new DatabaseSync(path.join(process.cwd(), "data", "blog.db"));
db.prepare("PRAGMA foreign_keys = ON").all();

const catId = (slug) => db.prepare("SELECT id FROM categories WHERE slug = ?").get(slug)?.id ?? null;
const ensureTag = (name, slug) => {
  const row = db.prepare("SELECT id FROM tags WHERE slug = ?").get(slug);
  if (row) return row.id;
  return Number(db.prepare("INSERT INTO tags (name, slug, description) VALUES (?, ?, '')").run(name, slug).lastInsertRowid);
};

const tagIds = {
  javascript: ensureTag("JavaScript", "javascript"),
  career: ensureTag("Career", "career"),
  "machine-learning": ensureTag("Machine Learning", "machine-learning"),
  sustainability: ensureTag("Sustainability", "sustainability"),
  finance: ensureTag("Finance", "finance"),
  ai: db.prepare("SELECT id FROM tags WHERE slug='ai'").get()?.id,
  ux: db.prepare("SELECT id FROM tags WHERE slug='ux'").get()?.id,
  trends: db.prepare("SELECT id FROM tags WHERE slug='trends'").get()?.id,
  startups: db.prepare("SELECT id FROM tags WHERE slug='startups'").get()?.id,
  productivity: db.prepare("SELECT id FROM tags WHERE slug='productivity'").get()?.id,
  "web-development": db.prepare("SELECT id FROM tags WHERE slug='web-development'").get()?.id,
};

const article = (lead, sections) =>
  `<p>${lead}</p>` +
  sections.map(([h, ...ps]) => `<h2>${h}</h2>` + ps.map((p) => (p.startsWith("<") ? p : `<p>${p}</p>`)).join("")).join("");

const posts = [
  {
    title: "TypeScript in 2026: Patterns Every Team Should Adopt",
    slug: "typescript-2026-patterns-every-team-should-adopt",
    excerpt: "From branded types to satisfies-driven configs, these are the TypeScript patterns that separate maintainable codebases from type-checked chaos.",
    image: "/uploads/sample-7.webp", alt: "Abstract indigo and teal gradient with JS monogram",
    cat: "technology", tags: ["javascript", "web-development", "productivity"],
    featured: 0, trending: 1, pinned: 0, views: 1543, days: 3, status: "published",
    lead: "TypeScript stopped being optional years ago. What separates teams now is not whether they use it, but how — and a handful of patterns consistently show up in the healthiest codebases.",
    sections: [
      ["Branded types for domain safety", "A UserId and a PostId are both strings, but mixing them up is a production incident waiting to happen. Branded types make identifiers incompatible at compile time with zero runtime cost."],
      ["Let the compiler own your configs", "The <code>satisfies</code> operator validates configuration objects against a contract while preserving their literal types — you get autocomplete and safety without widening everything to <code>string</code>."],
      ["Parse, don't validate", "Runtime schema tools that infer static types turn every API boundary into a single source of truth. Define the schema once, get both validation and types.", "<ul><li>Validate all external input at the edge</li><li>Derive types from schemas, never duplicate them</li><li>Treat <code>any</code> as a code review blocker</li></ul>"],
    ],
    faqs: [
      ["Is TypeScript worth it for small projects?", "Yes — modern tooling makes setup nearly free, and the cost of adding types later grows with every file. Even solo projects benefit from editor autocomplete and refactoring safety."],
      ["Should we enable strict mode?", "Always, and from day one. Every strictness flag you defer becomes a migration project later. New codebases should start with strict: true and never look back."],
    ],
  },
  {
    title: "The Product Manager's Guide to Saying No",
    slug: "product-managers-guide-to-saying-no",
    excerpt: "Great roadmaps are defined by what they exclude. A practical framework for declining feature requests without burning bridges.",
    image: "/uploads/sample-8.webp", alt: "Orange and crimson gradient with PM monogram",
    cat: "business", tags: ["career", "productivity", "startups"],
    featured: 1, trending: 0, pinned: 0, views: 892, days: 4, status: "published",
    lead: "Every product manager drowns in requests: sales wants a dashboard, support wants bulk actions, the CEO read about AI on a plane. Saying yes to everything ships nothing well — the craft is in the no.",
    sections: [
      ["Anchor every no to strategy", "A refusal that references the quarter's stated goals feels like discipline; a bare refusal feels like politics. If you can't tie a no to strategy, your strategy may be the real problem."],
      ["Offer the trade, not the wall", "Never just decline — show the cost. 'We can do this, and it moves the launch by three weeks' turns an argument into a prioritisation decision the requester makes with you."],
      ["Keep a visible parking lot", "Requests that die silently come back angrier. A public, ranked backlog of deferred ideas proves things were heard, and half of them quietly become irrelevant within a quarter."],
    ],
    faqs: [["How do I say no to my CEO?", "Reframe it as sequencing, not refusal: agree on what the request would displace and let the priorities argue for you. Bring data on the current commitment's expected impact."]],
  },
  {
    title: "Machine Learning on the Edge: Why Small Models Are Winning",
    slug: "machine-learning-on-the-edge-small-models-winning",
    excerpt: "Billion-parameter models grab headlines, but distilled models running on-device are quietly powering the features users love most.",
    image: "/uploads/sample-9.webp", alt: "Blue and violet gradient with ML monogram",
    cat: "technology", tags: ["ai", "machine-learning", "trends"],
    featured: 0, trending: 1, pinned: 0, views: 2367, days: 6, status: "published",
    lead: "The most interesting shift in applied AI isn't happening in data centres — it's happening on phones, laptops and browsers, where distilled models deliver instant, private inference without a network round-trip.",
    sections: [
      ["Latency is a feature", "On-device inference answers in milliseconds regardless of connectivity. For autocomplete, translation and image cleanup, that responsiveness matters more than raw model quality."],
      ["Privacy by architecture", "Data that never leaves the device never leaks in transit and never sits in a breach-able server log. Regulators have noticed, and so have users."],
      ["The distillation playbook", "Teams train a large teacher model, distil it into a small student, then quantise aggressively.", "<ul><li>4-bit quantisation with minimal quality loss</li><li>Task-specific models beat general ones at 1% of the size</li><li>Hybrid routing: local first, cloud for hard cases</li></ul>"],
    ],
    faqs: [
      ["Can small models really compete with frontier models?", "For narrow, well-defined tasks — classification, extraction, autocomplete — a fine-tuned small model often matches or beats a general frontier model while being dramatically cheaper and faster."],
      ["What hardware do edge models need?", "Modern phone NPUs handle billions of operations per second. A model under ~2 GB quantised runs comfortably on flagship phones from the last three years and on any recent laptop."],
    ],
  },
  {
    title: "Sustainable Web Design: Cutting Your Site's Carbon Footprint",
    slug: "sustainable-web-design-cutting-carbon-footprint",
    excerpt: "The web produces more CO₂ than global aviation. Here's how performance work doubles as climate work — and improves your rankings too.",
    image: "/uploads/sample-10.webp", alt: "Green gradient with ECO monogram",
    cat: "design", tags: ["sustainability", "web-development", "ux"],
    featured: 0, trending: 0, pinned: 0, views: 431, days: 9, status: "published",
    lead: "Every byte shipped to a browser costs energy — in the data centre, on the network and on the user's device. The good news: everything that reduces emissions also makes your site faster and cheaper to run.",
    sections: [
      ["Images are the biggest lever", "Media is typically 60–70% of page weight. Modern formats, responsive sizes and lazy loading routinely cut transfer by half without visible quality loss."],
      ["JavaScript is the hidden cost", "Scripts cost energy twice: in transfer and in CPU cycles parsing and executing on billions of devices. Server rendering with minimal hydration is the greenest architecture."],
      ["Measure it like performance", "Tools now estimate grams of CO₂ per page view. Set a page-weight budget, wire it into CI, and treat regressions like failed tests."],
    ],
    faqs: [["Does green hosting actually matter?", "Yes, but it's step two. A renewable-powered data centre helps, but a bloated site still wastes energy on every network hop and every device. Optimise the payload first, then pick a green host."]],
  },
  {
    title: "Spatial Interfaces: Designing Beyond the Flat Screen",
    slug: "spatial-interfaces-designing-beyond-flat-screen",
    excerpt: "AR headsets and spatial computing demand a new design language. What translates from 2D — and what has to be unlearned.",
    image: "/uploads/sample-11.webp", alt: "Magenta and indigo gradient with AR monogram",
    cat: "design", tags: ["ux", "trends", "ai"],
    featured: 1, trending: 1, pinned: 0, views: 1120, days: 11, status: "published",
    lead: "Spatial computing is finally usable, and designers are discovering that a decade of flat-screen instincts only half applies when the interface lives in the user's room.",
    sections: [
      ["Comfort is the new usability", "In spatial UI, a poorly placed panel causes neck strain, not just annoyance. Content belongs in a narrow comfortable band around eye level, and nothing should follow the user's head."],
      ["Depth is information", "Layering content in Z-space communicates hierarchy more naturally than size or colour ever did on flat screens — near means actionable, far means ambient."],
      ["Input is multimodal by default", "Eyes target, hands confirm, voice disambiguates. Designing for one input channel at a time is the fastest way to build something exhausting."],
    ],
    faqs: [["Do I need to learn 3D tools to design spatial UI?", "A working knowledge of one 3D prototyping tool helps, but the core skills are still hierarchy, typography and interaction design. Most spatial interfaces are 2D panels arranged thoughtfully in 3D space."]],
  },
  {
    title: "Bootstrapped vs Funded: The Honest Math for 2026",
    slug: "bootstrapped-vs-funded-honest-math-2026",
    excerpt: "Venture capital buys speed and dilutes ownership; bootstrapping buys freedom and caps velocity. The real numbers behind both paths.",
    image: "/uploads/sample-12.webp", alt: "Rose and amber gradient with FIN monogram",
    cat: "business", tags: ["startups", "finance", "trends"],
    featured: 0, trending: 0, pinned: 0, views: 668, days: 13, status: "published",
    lead: "The funding question has a fashionable answer every cycle. Strip away the discourse and it reduces to arithmetic: how big is the market window, and what does owning 100% of a slower company actually cost you?",
    sections: [
      ["What VC actually buys", "Capital compresses time. If a competitor can raise and outrun you to a winner-take-most market, bootstrapping is a strategy for second place. If the market is fragmented and sticky, speed matters far less."],
      ["The bootstrapper's compounding edge", "Profitable companies negotiate from strength: no forced exits, no growth-at-all-costs pivots, and every pricing decision optimises for customers instead of the next round's narrative."],
      ["A simple decision test", "<ul><li>Winner-take-most market + capital-hungry product → raise</li><li>Niche market + software margins → bootstrap</li><li>Unsure → bootstrap until the market forces the question</li></ul>"],
    ],
    faqs: [
      ["Can you raise later after bootstrapping?", "Usually more easily — revenue and retention replace the pitch deck. Many funds now actively hunt for profitable bootstrapped companies ready to accelerate."],
      ["What's a realistic bootstrapped growth rate?", "Healthy bootstrapped SaaS typically grows 30–80% annually once past product-market fit. Slower than a venture rocket, but with the founder keeping 10x the equity, the personal outcome is often comparable."],
    ],
  },
  {
    title: "Draft: The 2026 Content Strategy Playbook",
    slug: "draft-2026-content-strategy-playbook",
    excerpt: "Work-in-progress guide to planning a year of content that compounds.",
    image: "/uploads/sample-8.webp", alt: "Orange gradient placeholder",
    cat: "business", tags: ["trends", "productivity"],
    featured: 0, trending: 0, pinned: 0, views: 0, days: 0, status: "draft",
    lead: "Outline: pillar pages, topical clusters, refresh cadence, distribution loops. Flesh out each section before publishing.",
    sections: [["Working notes", "This is a draft post — visible only in the admin panel, never on the public site."]],
    faqs: [],
  },
  {
    title: "Draft: Interview — Building Design Tools with AI",
    slug: "draft-interview-building-design-tools-with-ai",
    excerpt: "Unedited interview transcript, awaiting review and approval.",
    image: "", alt: "",
    cat: "design", tags: ["ai", "ux"],
    featured: 0, trending: 0, pinned: 0, views: 0, days: 0, status: "draft",
    lead: "Transcript pending edits. Do not publish until quotes are approved by the interviewee.",
    sections: [["Status", "Awaiting sign-off. Target publish date: next week."]],
    faqs: [],
  },
];

const insertPost = db.prepare(`
  INSERT INTO posts (title, slug, excerpt, content, featured_image, image_alt, category_id,
    status, is_featured, is_trending, is_pinned, view_count, reading_time, author_name,
    seo_title, seo_description, published_at)
  VALUES (@title, @slug, @excerpt, @content, @featured_image, @image_alt, @category_id,
    @status, @is_featured, @is_trending, @is_pinned, @view_count, @reading_time, 'Admin',
    @seo_title, @seo_description, @published_at)
`);
const linkTag = db.prepare("INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)");
const insertFaq = db.prepare("INSERT INTO post_faqs (post_id, question, answer, sort_order) VALUES (?, ?, ?, ?)");

let added = 0;
db.exec("BEGIN");
try {
  for (const p of posts) {
    if (db.prepare("SELECT id FROM posts WHERE slug = ?").get(p.slug)) continue;
    const content = article(p.lead, p.sections);
    const words = content.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
    const info = insertPost.run({
      title: p.title, slug: p.slug, excerpt: p.excerpt, content,
      featured_image: p.image, image_alt: p.alt, category_id: catId(p.cat),
      status: p.status, is_featured: p.featured, is_trending: p.trending, is_pinned: p.pinned,
      view_count: p.views, reading_time: Math.max(1, Math.ceil(words / 200)),
      seo_title: p.title, seo_description: p.excerpt,
      published_at: p.status === "published"
        ? new Date(Date.now() - p.days * 86400000).toISOString().replace("T", " ").slice(0, 19)
        : null,
    });
    const postId = Number(info.lastInsertRowid);
    for (const t of p.tags) if (tagIds[t]) linkTag.run(postId, tagIds[t]);
    p.faqs.forEach(([q, a], i) => insertFaq.run(postId, q, a, i));
    added++;
  }
  db.exec("COMMIT");
} catch (err) {
  db.exec("ROLLBACK");
  throw err;
}

const counts = db.prepare("SELECT status, COUNT(*) n FROM posts GROUP BY status").all();
console.log(`Added ${added} demo posts. Totals:`, counts.map((c) => `${c.status}=${c.n}`).join(", "));

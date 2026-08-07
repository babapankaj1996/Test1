import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { SqliteDatabase } from "./sqlite";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "blog.db");

let _db: SqliteDatabase | null = null;

export function getDb(): SqliteDatabase {
  if (_db) return _db;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  _db = new SqliteDatabase(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  migrate(_db);
  seed(_db);
  return _db;
}

function migrate(db: SqliteDatabase) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT 'Admin',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      seo_title TEXT NOT NULL DEFAULT '',
      seo_description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      excerpt TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      featured_image TEXT NOT NULL DEFAULT '',
      image_alt TEXT NOT NULL DEFAULT '',
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
      is_featured INTEGER NOT NULL DEFAULT 0,
      is_trending INTEGER NOT NULL DEFAULT 0,
      is_pinned INTEGER NOT NULL DEFAULT 0,
      view_count INTEGER NOT NULL DEFAULT 0,
      reading_time INTEGER NOT NULL DEFAULT 1,
      author_name TEXT NOT NULL DEFAULT 'Admin',
      seo_title TEXT NOT NULL DEFAULT '',
      seo_description TEXT NOT NULL DEFAULT '',
      canonical_url TEXT NOT NULL DEFAULT '',
      published_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS post_tags (
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (post_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS post_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      alt TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS post_faqs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      seo_title TEXT NOT NULL DEFAULT '',
      seo_description TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    );

    CREATE INDEX IF NOT EXISTS idx_posts_status_published ON posts(status, published_at DESC);
  `);

  // Incremental migrations for databases created before these columns existed.
  addColumnIfMissing(db, "categories", "show_in_nav", "INTEGER NOT NULL DEFAULT 1");
  addColumnIfMissing(db, "categories", "show_in_footer", "INTEGER NOT NULL DEFAULT 1");
  addColumnIfMissing(db, "pages", "template", "TEXT NOT NULL DEFAULT 'default'");

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category_id);
    CREATE INDEX IF NOT EXISTS idx_posts_pinned ON posts(is_pinned);
    CREATE INDEX IF NOT EXISTS idx_posts_trending ON posts(is_trending);
    CREATE INDEX IF NOT EXISTS idx_post_faqs_post ON post_faqs(post_id, sort_order);
    CREATE INDEX IF NOT EXISTS idx_post_images_post ON post_images(post_id, sort_order);
    CREATE INDEX IF NOT EXISTS idx_post_tags_tag ON post_tags(tag_id);
  `);
}

function addColumnIfMissing(
  db: SqliteDatabase,
  table: string,
  column: string,
  ddl: string
) {
  const cols = db.pragma(`table_info(${table})`) as Array<{ name: string }>;
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
  }
}

function seed(db: SqliteDatabase) {
  const envAdmin = getEnvAdminConfig();
  const hasAdmin = db.prepare("SELECT COUNT(*) AS n FROM admins").get() as { n: number };
  if (hasAdmin.n === 0) {
    if (process.env.NODE_ENV === "production" && !envAdmin) {
      throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set before the production database is seeded.");
    }
    const email = envAdmin?.email || "apecommteam@gmail.com";
    const password = envAdmin?.password || "admin123";
    db.prepare("INSERT INTO admins (email, password_hash, name) VALUES (?, ?, ?)").run(
      email,
      bcrypt.hashSync(password, 10),
      "Admin"
    );
  } else if (envAdmin) {
    syncProductionAdmin(db, envAdmin.email, envAdmin.password);
  }

  const defaults: Record<string, string> = {
    site_name: "NovaPulse",
    site_tagline: "Ideas, insights and stories from the edge of tomorrow",
    site_description:
      "NovaPulse is a modern publication covering technology, design and business — in-depth articles, guides and trends, updated daily.",
    posts_per_page: "9",
    social_twitter: "https://twitter.com",
    social_facebook: "https://facebook.com",
    social_instagram: "https://instagram.com",
    social_youtube: "https://youtube.com",
  };
  const insertSetting = db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
  for (const [k, v] of Object.entries(defaults)) insertSetting.run(k, v);

  const hasPages = db.prepare("SELECT COUNT(*) AS n FROM pages").get() as { n: number };
  if (hasPages.n === 0) {
    const insertPage = db.prepare(
      "INSERT INTO pages (slug, title, content, seo_title, seo_description) VALUES (?, ?, ?, ?, ?)"
    );
    insertPage.run(
      "about",
      "About Us",
      "<p>Welcome to <strong>NovaPulse</strong> — a modern publication built for curious minds. We publish in-depth articles, practical guides and sharp analysis across technology, design and business.</p><p>Our mission is simple: cut through the noise and deliver content that is accurate, useful and enjoyable to read on any device.</p><h2>What we cover</h2><p>From emerging technology and product design to business strategy, our editorial team curates stories that matter today and shape tomorrow.</p>",
      "About Us",
      "Learn about NovaPulse — who we are, what we publish and why in-depth, trustworthy content is at the heart of everything we do."
    );
    insertPage.run(
      "contact",
      "Contact Us",
      "<p>We would love to hear from you. Whether you have a story tip, partnership proposal or feedback, reach out any time.</p><h2>Get in touch</h2><p>Email: <a href=\"mailto:apecommteam@gmail.com\">apecommteam@gmail.com</a></p><p>We usually respond within 1–2 business days.</p>",
      "Contact Us",
      "Contact the NovaPulse team — story tips, partnerships, advertising and general enquiries. We respond within 1–2 business days."
    );
    insertPage.run(
      "privacy-policy",
      "Privacy Policy",
      "<p>This Privacy Policy explains how we collect, use and protect your information when you visit this website.</p><h2>Information we collect</h2><p>We collect anonymous usage statistics (such as page views) to improve our content. We do not sell personal data to third parties.</p><h2>Cookies</h2><p>We use only essential cookies required for site functionality, such as admin authentication.</p><h2>Contact</h2><p>Questions about this policy? Contact us at <a href=\"mailto:apecommteam@gmail.com\">apecommteam@gmail.com</a>.</p>",
      "Privacy Policy",
      "Read the NovaPulse privacy policy — how we collect, use and protect your data, our cookie usage and your rights as a visitor."
    );
    insertPage.run(
      "terms-and-conditions",
      "Terms & Conditions",
      "<p>By accessing this website you agree to the following terms and conditions.</p><h2>Content</h2><p>All articles and media on this site are provided for informational purposes. Content may not be republished without permission.</p><h2>Liability</h2><p>We strive for accuracy but make no warranties regarding completeness or reliability of the information published.</p><h2>Changes</h2><p>We may update these terms at any time; continued use of the site constitutes acceptance of the revised terms.</p>",
      "Terms & Conditions",
      "The terms and conditions governing your use of NovaPulse — content usage rights, liability and acceptable use."
    );
  }

  // The categories index page is a real (renamable) page row with a special template.
  const hasCategoriesPage = db
    .prepare("SELECT COUNT(*) AS n FROM pages WHERE template = 'categories'")
    .get() as { n: number };
  if (hasCategoriesPage.n === 0) {
    db.prepare(
      `INSERT INTO pages (slug, title, content, seo_title, seo_description, template)
       VALUES (?, ?, ?, ?, ?, 'categories')`
    ).run(
      "categories",
      "Categories",
      "<p>Browse every topic we cover — pick a category to explore its articles.</p>",
      "All Categories",
      "Browse all content categories — technology, design, business and more. Find every article organised by topic."
    );
  }

  const hasCategories = db.prepare("SELECT COUNT(*) AS n FROM categories").get() as { n: number };
  if (hasCategories.n === 0) {
    const insertCat = db.prepare(
      "INSERT INTO categories (name, slug, description, seo_title, seo_description) VALUES (?, ?, ?, ?, ?)"
    );
    insertCat.run(
      "Technology",
      "technology",
      "The latest in software, hardware, AI and the tools shaping the future.",
      "Technology Articles & News",
      "Explore in-depth technology articles — AI, software engineering, gadgets and the innovations shaping tomorrow."
    );
    insertCat.run(
      "Design",
      "design",
      "UI, UX, product design and the craft of building beautiful things.",
      "Design Articles & Inspiration",
      "Design articles covering UI, UX, product design, typography and the craft of building beautiful digital experiences."
    );
    insertCat.run(
      "Business",
      "business",
      "Strategy, startups, growth and the economics of the modern web.",
      "Business & Strategy Articles",
      "Business articles on startups, strategy, marketing and growth — practical insight for the modern digital economy."
    );
  }

  const hasTags = db.prepare("SELECT COUNT(*) AS n FROM tags").get() as { n: number };
  if (hasTags.n === 0) {
    const insertTag = db.prepare("INSERT INTO tags (name, slug, description) VALUES (?, ?, ?)");
    const tags: Array<[string, string]> = [
      ["AI", "ai"],
      ["Web Development", "web-development"],
      ["UX", "ux"],
      ["Startups", "startups"],
      ["Productivity", "productivity"],
      ["Trends", "trends"],
    ];
    for (const [name, slug] of tags) insertTag.run(name, slug, "");
  }

  const hasPosts = db.prepare("SELECT COUNT(*) AS n FROM posts").get() as { n: number };
  if (hasPosts.n === 0) seedPosts(db);
}

function getEnvAdminConfig(): { email: string; password: string } | null {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email && !password) return null;
  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must both be set.");
  }
  if (process.env.NODE_ENV === "production" && password === "admin123") {
    throw new Error("Refusing to use the default admin password in production.");
  }
  return { email, password };
}

function syncProductionAdmin(db: SqliteDatabase, email: string, password: string) {
  const passwordHash = bcrypt.hashSync(password, 10);
  const existing = db.prepare("SELECT id FROM admins WHERE email = ?").get(email) as
    | { id: number }
    | undefined;

  if (existing) {
    db.prepare("UPDATE admins SET password_hash = ?, name = ? WHERE id = ?").run(
      passwordHash,
      "Admin",
      existing.id
    );
  } else {
    db.prepare("INSERT INTO admins (email, password_hash, name) VALUES (?, ?, ?)").run(
      email,
      passwordHash,
      "Admin"
    );
  }

  // This app has no admin-user management UI. Keep production login tied to
  // the configured env account so stale seeded defaults cannot linger.
  db.prepare("DELETE FROM admins WHERE email != ?").run(email);
}

function seedPosts(db: SqliteDatabase) {
  const catId = (slug: string) =>
    (db.prepare("SELECT id FROM categories WHERE slug = ?").get(slug) as { id: number }).id;
  const tagId = (slug: string) =>
    (db.prepare("SELECT id FROM tags WHERE slug = ?").get(slug) as { id: number }).id;

  const insertPost = db.prepare(`
    INSERT INTO posts (title, slug, excerpt, content, featured_image, image_alt, category_id,
      status, is_featured, is_trending, is_pinned, view_count, reading_time, author_name,
      seo_title, seo_description, published_at)
    VALUES (@title, @slug, @excerpt, @content, @featured_image, @image_alt, @category_id,
      'published', @is_featured, @is_trending, @is_pinned, @view_count, @reading_time, 'Admin',
      @seo_title, @seo_description, @published_at)
  `);
  const linkTag = db.prepare("INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)");
  const insertFaq = db.prepare(
    "INSERT INTO post_faqs (post_id, question, answer, sort_order) VALUES (?, ?, ?, ?)"
  );

  const body = (lead: string, points: string[]) =>
    `<p>${lead}</p><h2>Why it matters</h2><p>${points[0]}</p><h2>Key takeaways</h2><ul>${points
      .slice(1)
      .map((p) => `<li>${p}</li>`)
      .join("")}</ul><h2>Looking ahead</h2><p>The pace of change is only accelerating. Teams that adapt early — experimenting, measuring and iterating — will compound their advantage over those who wait for perfect certainty.</p>`;

  const samples = [
    {
      title: "The Future of AI-Powered Web Experiences",
      slug: "future-of-ai-powered-web-experiences",
      excerpt:
        "AI is reshaping how we build and browse the web — from generative interfaces to personalised content pipelines. Here's what's coming next.",
      image: "/uploads/sample-1.webp",
      alt: "Abstract gradient artwork representing artificial intelligence and the web",
      cat: "technology",
      tags: ["ai", "web-development", "trends"],
      featured: 1,
      trending: 1,
      pinned: 1,
      views: 1284,
      lead:
        "Artificial intelligence has moved from research labs into the everyday toolkit of web teams. Generative interfaces, semantic search and personalised content pipelines are no longer experiments — they are shipping in production.",
      points: [
        "Users increasingly expect experiences that adapt to their intent in real time, and AI is the only practical way to deliver that at scale.",
        "Generative UI lets interfaces assemble themselves around the user's task.",
        "Semantic search understands meaning, not just keywords.",
        "Edge inference keeps AI features fast and privacy-friendly.",
        "Human editorial oversight remains the differentiator for quality.",
      ],
      faqs: [
        [
          "Will AI replace web developers?",
          "No — AI is changing what developers spend time on. Routine scaffolding is increasingly automated, while system design, product judgement and quality control matter more than ever.",
        ],
        [
          "How can small teams adopt AI features affordably?",
          "Start with hosted APIs for search and personalisation rather than training models. A single well-placed AI feature, like semantic site search, often delivers most of the value at a fraction of the cost.",
        ],
      ],
      days: 2,
    },
    {
      title: "Design Systems That Scale: A Practical Guide",
      slug: "design-systems-that-scale-practical-guide",
      excerpt:
        "A design system is a product, not a project. Learn how successful teams structure tokens, components and governance so design scales with the organisation.",
      image: "/uploads/sample-2.webp",
      alt: "Geometric gradient pattern representing a structured design system",
      cat: "design",
      tags: ["ux", "productivity"],
      featured: 1,
      trending: 1,
      pinned: 0,
      views: 967,
      lead:
        "Every fast-growing product team eventually hits the same wall: inconsistent UI, duplicated components and design debt that slows every release. A well-governed design system is the way through.",
      points: [
        "Consistency compounds — every reusable token and component removes a future decision, review cycle and bug.",
        "Design tokens should be the single source of truth for colour, spacing and type.",
        "Components need clear ownership and a contribution process.",
        "Documentation is part of the product, not an afterthought.",
        "Measure adoption, not component count.",
      ],
      faqs: [
        [
          "When is the right time to build a design system?",
          "When you notice the same UI being rebuilt more than twice, or when two screens that should look identical don't. For most teams that happens between the second and fourth product surface.",
        ],
      ],
      days: 5,
    },
    {
      title: "10 Core Web Vitals Fixes That Actually Move Rankings",
      slug: "core-web-vitals-fixes-that-move-rankings",
      excerpt:
        "LCP, CLS and INP explained in plain language — plus the ten highest-impact fixes we've seen move real-world Google rankings.",
      image: "/uploads/sample-3.webp",
      alt: "Speedometer-style gradient illustration representing web performance",
      cat: "technology",
      tags: ["web-development", "trends", "productivity"],
      featured: 0,
      trending: 1,
      pinned: 0,
      views: 2110,
      lead:
        "Core Web Vitals are Google's user-experience signals, and they are one of the few ranking factors you fully control. The good news: most sites can reach green scores with a handful of targeted fixes.",
      points: [
        "Page experience is a confirmed ranking signal, and slow pages lose both rankings and conversions.",
        "Serve properly sized, modern-format images (AVIF/WebP) with lazy loading.",
        "Reserve space for images and embeds to eliminate layout shift.",
        "Cut unused JavaScript — every kilobyte delays interactivity.",
        "Use server rendering or static generation for content pages.",
      ],
      faqs: [
        [
          "What is a good LCP score?",
          "Largest Contentful Paint under 2.5 seconds for at least 75% of visits is considered good. Under 1.8 seconds puts you comfortably ahead of most competitors.",
        ],
        [
          "Do Core Web Vitals affect SEO directly?",
          "Yes. Google uses page experience signals, including Core Web Vitals, as ranking factors — especially as a tie-breaker between pages of similar content quality.",
        ],
      ],
      days: 7,
    },
    {
      title: "From Side Project to Startup: A Founder's Playbook",
      slug: "side-project-to-startup-founders-playbook",
      excerpt:
        "The path from weekend project to funded company is well-trodden. Here are the patterns that separate the projects that make it from the ones that stall.",
      image: "/uploads/sample-4.webp",
      alt: "Upward arrow gradient artwork representing startup growth",
      cat: "business",
      tags: ["startups", "productivity"],
      featured: 0,
      trending: 0,
      pinned: 0,
      views: 743,
      lead:
        "Most successful startups didn't begin with a pitch deck — they began as a side project solving the founder's own problem. Turning that spark into a company is a repeatable process.",
      points: [
        "Real usage from strangers is the only signal that matters in the early days.",
        "Charge money earlier than feels comfortable — pricing is discovery.",
        "Distribution is a feature: build sharing and SEO in from day one.",
        "Keep burn near zero until retention proves itself.",
        "Solve one problem completely before adding a second.",
      ],
      faqs: [],
      days: 10,
    },
    {
      title: "Dark Mode Done Right: Accessibility Meets Aesthetics",
      slug: "dark-mode-done-right-accessibility-aesthetics",
      excerpt:
        "Dark interfaces are everywhere, but many fail basic contrast and readability tests. Here's how to design dark UIs that are beautiful and accessible.",
      image: "/uploads/sample-5.webp",
      alt: "Dark themed interface mockup with glowing accent colours",
      cat: "design",
      tags: ["ux", "trends"],
      featured: 0,
      trending: 0,
      pinned: 0,
      views: 592,
      lead:
        "Dark mode is more than inverted colours. Done well it reduces eye strain and feels premium; done poorly it produces muddy contrast and vibrating text.",
      points: [
        "Over 80% of users enable dark mode somewhere — it's an expectation, not a trend.",
        "Never use pure black; elevated dark greys create depth.",
        "Desaturate accent colours slightly to prevent glow artifacts.",
        "Maintain WCAG AA contrast (4.5:1) for body text.",
        "Test with real content, not lorem ipsum.",
      ],
      faqs: [
        [
          "Should dark mode be the default?",
          "Follow the user's system preference by default and offer a manual toggle. Forcing either mode ignores accessibility needs like astigmatism, which makes light-on-dark text harder to read for some users.",
        ],
      ],
      days: 14,
    },
    {
      title: "SEO in 2026: What Still Works After the AI Search Shift",
      slug: "seo-2026-what-still-works-after-ai-search",
      excerpt:
        "AI answers changed search forever — but organic traffic hasn't died, it has consolidated. Here's where the clicks went and how to win them.",
      image: "/uploads/sample-6.webp",
      alt: "Magnifying glass over gradient waves representing modern search",
      cat: "business",
      tags: ["trends", "ai", "startups"],
      featured: 1,
      trending: 1,
      pinned: 0,
      views: 1876,
      lead:
        "AI-generated answers now sit on top of most search results, yet sites with genuine expertise and strong technical SEO are capturing more qualified traffic than ever. The playbook has changed — the fundamentals haven't.",
      points: [
        "Search engines increasingly reward first-hand experience and depth over volume — thin content is invisible now.",
        "Structured data (Article, FAQ, Breadcrumb schema) earns rich results and AI citations.",
        "Topical authority beats domain authority for new sites.",
        "Fast, mobile-first pages remain a hard prerequisite.",
        "Original data and opinions are the hardest content for AI to replace.",
      ],
      faqs: [
        [
          "Is SEO still worth it in 2026?",
          "Yes — organic search remains one of the highest-ROI channels. The bar is higher: winning content demonstrates first-hand expertise, loads fast and uses structured data so both search engines and AI systems can cite it.",
        ],
        [
          "How important is schema markup now?",
          "Very. Article, FAQ and Breadcrumb structured data directly powers rich results and increases the chance AI search experiences cite your page as a source.",
        ],
      ],
      days: 1,
    },
  ];

  const insertAll = db.transaction(() => {
    for (const s of samples) {
      const publishedAt = new Date(Date.now() - s.days * 86400000)
        .toISOString()
        .replace("T", " ")
        .slice(0, 19);
      const words = (s.lead + s.points.join(" ")).split(/\s+/).length;
      const info = insertPost.run({
        title: s.title,
        slug: s.slug,
        excerpt: s.excerpt,
        content: body(s.lead, s.points),
        featured_image: s.image,
        image_alt: s.alt,
        category_id: catId(s.cat),
        is_featured: s.featured,
        is_trending: s.trending,
        is_pinned: s.pinned,
        view_count: s.views,
        reading_time: Math.max(1, Math.ceil(words / 200) + 2),
        seo_title: s.title,
        seo_description: s.excerpt,
        published_at: publishedAt,
      });
      const postId = Number(info.lastInsertRowid);
      for (const t of s.tags) linkTag.run(postId, tagId(t));
      s.faqs.forEach(([q, a], i) => insertFaq.run(postId, q, a, i));
    }
  });
  insertAll();
}

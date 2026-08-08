export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  content: string;
  seo_title: string;
  seo_description: string;
  show_in_nav: number;
  show_in_footer: number;
  post_count?: number;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  description: string;
  post_count?: number;
}

export interface PostImage {
  id: number;
  post_id: number;
  url: string;
  alt: string;
  sort_order: number;
}

export interface PostFaq {
  id: number;
  post_id: number;
  question: string;
  answer: string;
  sort_order: number;
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string;
  image_alt: string;
  category_id: number | null;
  status: "draft" | "published";
  is_featured: number;
  is_trending: number;
  is_pinned: number;
  view_count: number;
  reading_time: number;
  author_name: string;
  seo_title: string;
  seo_description: string;
  canonical_url: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  category_name?: string | null;
  category_slug?: string | null;
  tags?: Tag[];
  faqs?: PostFaq[];
  images?: PostImage[];
}

export interface StaticPage {
  id: number;
  slug: string;
  title: string;
  content: string;
  seo_title: string;
  seo_description: string;
  template: "default" | "categories";
  updated_at: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

import { getCategories, getTags } from "@/lib/posts";
import PostForm from "@/components/admin/PostForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "New Post" };

export default function NewPostPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">New Post</h1>
      <div className="mt-6">
        <PostForm post={null} categories={getCategories()} tags={getTags()} />
      </div>
    </div>
  );
}

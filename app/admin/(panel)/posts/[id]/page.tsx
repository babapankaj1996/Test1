import { notFound } from "next/navigation";
import { getCategories, getPostById, getTags } from "@/lib/posts";
import PostForm from "@/components/admin/PostForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Edit Post" };

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const id = parseInt((await params).id, 10);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const post = getPostById(id);
  if (!post) notFound();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Edit Post</h1>
      <div className="mt-6">
        <PostForm post={post} categories={getCategories()} tags={getTags()} />
      </div>
    </div>
  );
}

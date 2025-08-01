import { type Post } from "@/lib/posts";
import { PostCard } from "./PostCard";

interface PostListProps {
  posts: Post[];
}

export function PostList({ posts }: PostListProps) {
  return (
    <div className="grid gap-10 sm:grid-cols-1 md:grid-cols-2">
      {posts.map((post) => (
        <PostCard key={post._meta.path} post={post} />
      ))}
    </div>
  );
}

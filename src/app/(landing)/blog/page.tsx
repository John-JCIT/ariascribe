import { PostList } from "@/components/blog/PostList";
import { GradientText } from "@/components/GradientText";
import { getAllPosts } from "@/lib/posts";

export const metadata = {
  title: "Blog",
  description: "Latest news and articles.",
};

export default async function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="container max-w-4xl py-10 lg:py-16">
      <div className="flex flex-col items-start gap-4 md:flex-row md:justify-between md:gap-8">
        <div className="flex-1 space-y-4">
          <GradientText className="bg-gradient-to-r from-violet-500 to-violet-700 text-2xl">
            Blog
          </GradientText>
          <p className="text-muted-foreground text-xl">
            Latest news, updates and articles.
          </p>
        </div>
      </div>
      <hr className="border-border/60 my-8" />
      {posts?.length ? (
        <div className="animate-in fade-in duration-700">
          <PostList posts={posts} />
        </div>
      ) : (
        <p className="text-muted-foreground italic">No posts published.</p>
      )}
    </div>
  );
}

import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug, type Post } from "@/lib/posts";
import { formatDate } from "@/lib/utils";
import { Mdx } from "@/components/blog/MdxComponents";
import Link from "next/link";
import { type Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { unstable_ViewTransition as ViewTransition } from "react";

interface PostPageProps {
  params: { slug: string };
}

interface PromisePostPageProps {
  params: Promise<PostPageProps["params"]>;
}

export async function generateMetadata({
  params,
}: PromisePostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {};
  }

  return {
    title: post.title,
    description: post.description,
  };
}

export async function generateStaticParams(): Promise<
  PostPageProps["params"][]
> {
  const posts = getAllPosts();

  return posts.map((post) => ({
    slug: post._meta.path,
  }));
}

export default async function PostPage({ params }: PromisePostPageProps) {
  const { slug } = await params;
  const post: Post | undefined = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const imageTransitionName = `blog-image-${slug}`;
  const titleTransitionName = `blog-title-${slug}`;
  const descriptionTransitionName = `blog-description-${slug}`;
  const dateTransitionName = `blog-date-${slug}`;

  return (
    <article className="animate-in fade-in relative container max-w-3xl py-10 duration-500 lg:py-16">
      <Link
        href="/blog"
        className="group text-muted-foreground hover:text-primary mb-8 inline-flex items-center gap-2 text-sm transition-colors"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Back to blog
      </Link>

      <div className="space-y-4">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <ViewTransition name={dateTransitionName}>
            <time dateTime={post.date}>{formatDate(post.date)}</time>
          </ViewTransition>
          {post.tags && post.tags.length > 0 && (
            <>
              <span>•</span>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-muted rounded-md px-2 py-1 text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        <ViewTransition name={titleTransitionName}>
          <h1 className="font-heading from-foreground to-foreground/70 bg-gradient-to-r bg-clip-text text-4xl leading-tight font-bold text-transparent lg:text-5xl">
            {post.title}
          </h1>
        </ViewTransition>

        {post.description && (
          <ViewTransition name={descriptionTransitionName}>
            <p className="text-muted-foreground text-xl">{post.description}</p>
          </ViewTransition>
        )}
      </div>

      {post.image && (
        <div className="my-8">
          <ViewTransition name={imageTransitionName}>
            <img
              src={post.image}
              alt={post.title}
              className="bg-muted aspect-video w-full rounded-md border object-cover transition-colors"
              loading="eager"
              fetchPriority="high"
            />
          </ViewTransition>
        </div>
      )}

      <div className="prose dark:prose-invert mt-12 max-w-none">
        <Mdx code={post.mdx} />
      </div>

      <hr className="border-border/50 my-12" />

      <div className="flex justify-center">
        <Link
          href="/blog"
          className="bg-muted hover:bg-muted/80 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all posts
        </Link>
      </div>
    </article>
  );
}

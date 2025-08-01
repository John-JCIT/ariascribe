import Link from "next/link";
import { unstable_ViewTransition as ViewTransition } from "react";
import { type Post } from "@/lib/posts";
import { formatDate } from "@/lib/utils";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  // Generate unique transition names based on the post's path
  const imageTransitionName = `blog-image-${post._meta.path}`;
  const titleTransitionName = `blog-title-${post._meta.path}`;
  const descriptionTransitionName = `blog-description-${post._meta.path}`;
  const dateTransitionName = `blog-date-${post._meta.path}`;

  return (
    <article className="group relative flex flex-col space-y-3">
      {post.image && (
        <Link href={`/blog/${post._meta.path}`}>
          <ViewTransition name={imageTransitionName}>
            <img
              src={post.image}
              alt={post.title}
              className="bg-muted mb-2 aspect-video rounded-md border object-cover transition-colors"
              loading="lazy"
            />
          </ViewTransition>
        </Link>
      )}
      <ViewTransition name={titleTransitionName}>
        <h2 className="text-xl font-semibold tracking-tight">
          <Link href={`/blog/${post._meta.path}`}>{post.title}</Link>
        </h2>
      </ViewTransition>
      {post.description && (
        <ViewTransition name={descriptionTransitionName}>
          <p className="text-muted-foreground">{post.description}</p>
        </ViewTransition>
      )}
      <ViewTransition name={dateTransitionName}>
        <time dateTime={post.date} className="text-muted-foreground text-sm">
          {formatDate(post.date)}
        </time>
      </ViewTransition>
    </article>
  );
}

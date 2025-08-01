import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/lib/posts";
import { APP_NAME } from "@/config/config";

// Image metadata
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

// Image generation
export default async function Image({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);

  // Use a default title if post not found, though ideally this shouldn't happen
  // if generateStaticParams covers all slugs.
  const title = post?.title ?? `${APP_NAME} Blog Post`;
  const description = post?.description ?? "Read more on our blog.";

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48, // Adjusted font size
          color: "white",
          background: "linear-gradient(to right, #8b5cf6, #6366f1)", // Consistent background
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px", // Increased padding
          fontFamily: '"Inter", sans-serif',
          textAlign: "center",
        }}
      >
        {/* Main Title */}
        <div
          style={{
            fontSize: "64px",
            fontWeight: "bold",
            marginBottom: "30px",
            lineHeight: 1.2, // Adjust line height for potentially longer titles
          }}
        >
          {title}
        </div>
        {/* Description (optional) */}
        <div
          style={{
            fontSize: "32px",
            color: "rgba(255, 255, 255, 0.8)",
            maxWidth: "80%", // Limit width of description
          }}
        >
          {description}
        </div>
        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            left: "40px",
            fontSize: "24px",
            color: "rgba(255, 255, 255, 0.7)",
          }}
        >
          {APP_NAME}
        </div>
      </div>
    ),
    // ImageResponse options
    {
      ...size,
      // You might want to export `alt` dynamically based on the post title
      // which requires modifying how metadata is generated or this file structure.
      // For now, a generic alt tag can be set in the page/layout metadata.
    },
  );
}

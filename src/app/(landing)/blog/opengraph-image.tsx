import { ImageResponse } from "next/og";
import { APP_NAME } from "@/config/config";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

// Image generation
export default async function Image() {
  // You can add more sophisticated styling, fonts, or dynamic elements here
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 64, // Reduced font size for better fit
          color: "white", // Changed text color for contrast
          background: "linear-gradient(to right, #8b5cf6, #6366f1)", // Added a gradient background
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column", // Stack elements vertically
          alignItems: "center",
          justifyContent: "center",
          padding: "40px", // Added padding
          fontFamily: '"Inter", sans-serif', // Assuming Inter font is available or loaded elsewhere
          textAlign: "center",
        }}
      >
        <div
          style={{ marginBottom: "20px", fontSize: "80px", fontWeight: "bold" }}
        >
          📝
        </div>
        {/* Added an icon */}
        <div style={{ fontWeight: "bold", display: "flex" }}>
          {APP_NAME} Blog
        </div>
        <div
          style={{
            fontSize: "32px",
            marginTop: "20px",
            color: "rgba(255, 255, 255, 0.8)",
          }}
        >
          Latest news, updates and articles.
        </div>
      </div>
    ),
    // ImageResponse options
    {
      // For convenience, we can re-use the exported size config to set the ImageResponse's width and height.
      ...size,
      // If using custom fonts, you'd load them here, e.g.:
      // fonts: [
      //   {
      //     name: 'Inter',
      //     data: await fetch(new URL('./Inter-SemiBold.ttf', import.meta.url)).then(res => res.arrayBuffer()),
      //     style: 'normal',
      //     weight: 600,
      //   },
      // ],
    },
  );
}

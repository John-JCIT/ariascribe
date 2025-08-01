import { withContentCollections } from "@content-collections/next";

const derivedUrl =
  (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
  (process.env.RAILWAY_PUBLIC_DOMAIN &&
    `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`) ||
  process.env.RENDER_EXTERNAL_URL ||
  process.env.COOLIFY_URL ||
  `http://localhost:${process.env.PORT ?? 3000}`;

const serverUrl = process.env.SERVER_URL || derivedUrl;

if (process.env.NODE_ENV === "production") {
  console.log("Derived server URL → ", derivedUrl);
  console.log("SERVER_URL → ", serverUrl);
}

/** @type {import("next").NextConfig} */
const config = {
  experimental: {
    viewTransition: true,
  },

  env: {
    // pass url here so it's usable on the client and backend
    NEXT_PUBLIC_APP_URL: serverUrl,
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
        port: "",
        pathname: "/f/**", // Allow images from the /f/ path on utfs.io
      },
    ],
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default withContentCollections(config);

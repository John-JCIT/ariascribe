import { UTApi } from "uploadthing/server";

// Initialize UTApi
// It will automatically use the UPLOADTHING_TOKEN environment variable.
export const utapi = new UTApi();

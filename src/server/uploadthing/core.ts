import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

const f = createUploadthing();

const authenticateUser = async ({ req }: { req: Request }) => {
  // Get the session from the request
  const session = await auth.api.getSession({ headers: req.headers });
  const user = session?.user;

  // If you throw, the user will not be able to upload
  if (!user) throw new UploadThingError("Unauthorized");

  // Whatever is returned here is accessible in onUploadComplete as `metadata`
  return { userId: user.id };
};

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({
    image: {
      /**
       * For full list of options and defaults, see the File Route API reference
       * @see https://docs.uploadthing.com/file-routes#route-config
       */
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    // Set permissions and file types for this FileRoute
    .middleware(authenticateUser)
    .onUploadComplete(async ({ metadata, file }) => {
      const newImage = await db.uTImage.create({
        data: {
          key: file.key,
          userId: metadata.userId,
        },
        select: { id: true, key: true },
      });

      return newImage;
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

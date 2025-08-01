"use client";

import React, { useState, useEffect } from "react";
import { UploadButton } from "@/server/uploadthing/uploadthing";
import { Button } from "@/components/ui/button";
import { Loader2, TrashIcon, UploadIcon } from "lucide-react";
import { clientEnv } from "@/env/client";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { Spinner } from "@/components/Spinner";
import type { OurFileRouter } from "@/server/uploadthing/core";
import type { ClientUploadedFileData } from "uploadthing/types";

export interface InitialImageType {
  id: string;
  key: string;
}

interface UploadThingUploadSingleImageProps {
  endpoint: keyof OurFileRouter;
  initialImage?: InitialImageType | null;
  onImageChange: (image: InitialImageType | null) => void;
}

const getUrlFromKey = (key: string | null): string | null => {
  return key ? `${clientEnv.NEXT_PUBLIC_UPLOADTHING_URL_ROOT}${key}` : null;
};

export const UploadThingUploadSingleImage: React.FC<
  UploadThingUploadSingleImageProps
> = ({ endpoint, initialImage, onImageChange }) => {
  const [currentImage, setCurrentImage] = useState<InitialImageType | null>(
    initialImage || null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Update internal state if initialImage prop changes externally
  useEffect(() => {
    setCurrentImage(initialImage || null);
  }, [initialImage]);

  const deleteImageMutation = api.utImage.delete.useMutation();

  const handleUploadComplete = async (
    res: ClientUploadedFileData<InitialImageType>[],
  ) => {
    const uploadedFile = res?.[0];

    if (!!uploadedFile) {
      setCurrentImage(uploadedFile.serverData);
      onImageChange(uploadedFile.serverData); // Notify parent
      toast.success("Image uploaded successfully!");
    } else {
      console.warn("Upload completed but no valid file data received:", res);
      toast.error("Upload failed. Invalid response.");
    }
  };

  const handleDelete = async () => {
    if (!currentImage) return;

    setIsDeleting(true);
    try {
      await deleteImageMutation.mutateAsync({ id: currentImage.id });
      setCurrentImage(null);
      onImageChange(null);
      toast.success("Image deleted.");
    } catch (error) {
      console.error("Failed to delete image:", error);
      toast.error("Failed to delete image. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const imageUrl = getUrlFromKey(currentImage?.key ?? null);

  return (
    <div>
      {imageUrl ? (
        <div className="bg-muted/20 relative size-24 rounded-lg border shadow-sm">
          <img
            src={imageUrl}
            alt="Uploaded image"
            className="h-full w-full rounded-lg object-cover"
          />
          <Button
            size="icon"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="absolute -top-2 -right-2 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full p-1 shadow-sm"
            aria-label="Delete image"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <TrashIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      ) : (
        <UploadButton
          endpoint={endpoint}
          onClientUploadComplete={handleUploadComplete}
          onUploadError={(error: Error) => {
            console.error("Upload Error:", error);
            toast.error(`Upload Failed: ${error.message}`);
          }}
          appearance={{
            container: "vertical align-start items-start",
            button: "h-8! w-24! text-sm bg-primary!",
          }}
          content={{
            button({ ready, isUploading }) {
              if (ready)
                return (
                  <div className="flex items-center gap-1.5">
                    <UploadIcon size={13} /> Upload
                  </div>
                );
              if (isUploading) return <Spinner />;
              return <Spinner />;
            },
            allowedContent({ ready, fileTypes, isUploading }) {
              if (!ready) return null;
              if (isUploading) return "Uploading...";
              return `Max 4MB`;
            },
          }}
        />
      )}
    </div>
  );
};

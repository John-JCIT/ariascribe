import React from "react";
import { toast } from "sonner";
import { EditProfileForm, type EditProfileFormValues } from "./EditProfileForm";
import { api } from "@/trpc/react";
import type { InitialImageType } from "@/components/core/UploadThingUploadSingleImage/UploadThingUploadSingleImage";
import type { UpdateProfileInputType } from "@/types/user";
import { Spinner } from "@/components/Spinner";

type UserForEditingProfile = {
  id: string;
  name: string;
  username: string;
  bio: string;
  timezone: string;
  avatarImageUrl: string | null;
  coverImageUrl: string | null;
  avatarImage: InitialImageType | null;
  coverImage: InitialImageType | null;
};

interface EditProfileFormWithDataProps {
  onSubmit?: (data: EditProfileFormValues) => Promise<void>;
  close?: () => void;
}

export const EditProfileFormWithData: React.FC<
  EditProfileFormWithDataProps
> = ({ onSubmit: externalOnSubmit, close }) => {
  const updateProfileMutation = api.user.updateProfile.useMutation();
  const { data: user, isFetching } =
    api.user.getUserForEditingProfile.useQuery<UserForEditingProfile>(
      undefined,
      {
        gcTime: 0,
        staleTime: 0,
      },
    );

  const utils = api.useUtils();

  if (isFetching || !user) {
    return <Spinner />;
  }

  const handleSubmit = async (values: EditProfileFormValues) => {
    const updateData: UpdateProfileInputType = {
      name: values.name,
      username: values.username,
      bio: values.bio,
      timezone: values.timezone,
      avatarImageId: values.avatarImage?.id ?? null,
      coverImageId: values.coverImage?.id ?? null,
      avatarImage: values.avatarImage,
      coverImage: values.coverImage,
    };

    try {
      await updateProfileMutation.mutateAsync(updateData);
      await utils.user.getCurrentUser.invalidate();
      await utils.user.getUserForEditingProfile.invalidate();

      if (externalOnSubmit) {
        await externalOnSubmit(values);
      } else if (close) {
        close();
      }

      toast.success("Success!", {
        description: "Profile updated!",
      });
      close?.();
    } catch (error) {
      console.error("Failed to update profile:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error("Failed to update profile", {
        description: errorMessage,
      });
    }
  };

  return (
    <EditProfileForm
      key={user.id}
      initialValues={user}
      onSubmit={handleSubmit}
      isSubmitting={updateProfileMutation.isPending}
      onCancel={close}
    />
  );
};

export default EditProfileFormWithData;

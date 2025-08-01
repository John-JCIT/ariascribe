"use client";

import React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { FormFieldInput } from "@/components/FormFieldInput";
import { FormFieldUploadThingImage } from "@/components/FormFieldUploadThingImage";
import { FormFieldTextarea } from "@/components/FormFieldTextarea";
import { UpdateProfileInput } from "@/types/user";
import { type z } from "zod";
import { CustomButton } from "@/components/CustomButton";
import type { InitialImageType } from "@/components/core/UploadThingUploadSingleImage/UploadThingUploadSingleImage";
import { clientEnv } from "@/env/client";

type GetUserForEditingProfileOutput = {
  id: string;
  name: string | null;
  username: string | null;
  bio: string | null;
  timezone: string | null;
  avatarImageUrl: string | null;
  coverImageUrl: string | null;
  avatarImage: InitialImageType | null;
  coverImage: InitialImageType | null;
};

export type EditProfileFormValues = z.infer<typeof UpdateProfileInput>;

export const EditProfileForm: React.FC<{
  onSubmit: (values: EditProfileFormValues) => Promise<void>;
  isSubmitting: boolean;
  initialValues?: Partial<GetUserForEditingProfileOutput>;
  onCancel?: () => void;
}> = ({ onSubmit, isSubmitting, initialValues = {}, onCancel }) => {
  const form = useForm<EditProfileFormValues>({
    resolver: zodResolver(UpdateProfileInput),
    defaultValues: {
      name: initialValues.name ?? "",
      username: initialValues.username ?? undefined,
      bio: initialValues.bio ?? undefined,
      timezone: initialValues.timezone ?? undefined,
      avatarImage: initialValues.avatarImage ?? undefined,
      coverImage: initialValues.coverImage ?? undefined,
    },
    mode: "all",
    reValidateMode: "onChange",
  });

  return (
    <div className="w-full">
      <Form {...form}>
        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full max-w-[500px] space-y-6"
          >
            <FormFieldInput
              name="name"
              label="Name"
              placeholder="Name"
              required
            />

            <FormFieldInput
              name="username"
              label="Username"
              placeholder="Username"
            />

            <FormFieldTextarea
              name="bio"
              label="Bio"
              placeholder="Tell us a bit about yourself..."
            />

            {clientEnv.NEXT_PUBLIC_ENABLE_UPLOADTHING && (
              <>
                <FormFieldUploadThingImage
                  name="avatarImage"
                  label="Avatar Image"
                  endpoint="imageUploader"
                />

                <FormFieldUploadThingImage
                  name="coverImage"
                  label="Cover Image"
                  endpoint="imageUploader"
                />
              </>
            )}

            <div className="horizontal center-v gap-2">
              {onCancel && (
                <CustomButton
                  onClick={(e) => {
                    e.preventDefault();
                    form.reset(initialValues as EditProfileFormValues);
                    onCancel();
                  }}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  Cancel
                </CustomButton>
              )}
              <CustomButton
                loading={isSubmitting}
                color="primary"
                disabled={
                  !form.formState.isDirty ||
                  !form.formState.isValid ||
                  isSubmitting
                }
                type="submit"
                className="w-full"
              >
                {isSubmitting ? "Saving..." : "Save"}
              </CustomButton>
            </div>
          </form>
        </FormProvider>
      </Form>
    </div>
  );
};

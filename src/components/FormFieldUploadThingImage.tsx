"use client";
import React, { useEffect } from "react";
import {
  FormFieldWrapper,
  type FormFieldWrapperProps,
} from "@/components/FormFieldWrapper";
import {
  UploadThingUploadSingleImage,
  type InitialImageType,
} from "@/components/core/UploadThingUploadSingleImage/UploadThingUploadSingleImage";
import { type FieldValues, type FieldPath, useFormContext } from "react-hook-form";
import type { OurFileRouter } from "@/server/uploadthing/core";

export interface FormFieldUploadThingImageProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<FormFieldWrapperProps<TFieldValues, TName>, "children"> {
  endpoint: keyof OurFileRouter;
}

export function FormFieldUploadThingImage<
  TFieldValues extends FieldValues = FieldValues,
>({ endpoint, ...wrapperProps }: FormFieldUploadThingImageProps<TFieldValues>) {
  return (
    <FormFieldWrapper<TFieldValues, any> {...wrapperProps}>
      {(field) => {
        const { setValue, trigger } = useFormContext<TFieldValues>();
        const currentImage = field.value as InitialImageType | null | undefined;

        const handleImageChange = (image: InitialImageType | null) => {
          setValue(field.name, image as any, { shouldDirty: true });
          trigger(field.name);
        };

        return (
          <UploadThingUploadSingleImage
            endpoint={endpoint}
            initialImage={currentImage}
            onImageChange={handleImageChange}
          />
        );
      }}
    </FormFieldWrapper>
  );
}

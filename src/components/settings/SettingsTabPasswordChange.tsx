"use client";

import * as React from "react";
import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  passwordChangeSchema,
  type PasswordChangeSchemaType,
} from "@/schemas/password-change-schema";
import { FormFieldInput } from "@/components/FormFieldInput";
import { CustomButton } from "@/components/CustomButton";
import { api } from "@/trpc/react";

export function SettingsTabPasswordChange() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PasswordChangeSchemaType>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const changePasswordMutation = api.auth.changePassword.useMutation({
    onSuccess: () => {
      form.reset();
      toast.success("Password updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update password");
    },
  });

  const onSubmit = async (values: PasswordChangeSchemaType) => {
    setIsLoading(true);

    try {
      await changePasswordMutation.mutateAsync(values);
    } catch (error) {
      // Error is handled by the mutation callbacks
      console.error("Error in form submission:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Change Password</h3>
        <p className="text-muted-foreground text-sm">
          Update your password to keep your account secure
        </p>
      </div>

      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormFieldInput
            name="currentPassword"
            label="Current Password"
            type="password"
            placeholder="Enter your current password"
          />

          <FormFieldInput
            name="newPassword"
            label="New Password"
            type="password"
            placeholder="Enter your new password"
          />

          <FormFieldInput
            name="confirmPassword"
            label="Confirm New Password"
            type="password"
            placeholder="Confirm your new password"
          />

          <div className="flex justify-end">
            <CustomButton
              type="submit"
              loading={isLoading || changePasswordMutation.isPending}
            >
              Update Password
            </CustomButton>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}

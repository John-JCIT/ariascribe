"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import { CustomButton } from "@/components/CustomButton";
import { FormFieldInput } from "@/components/FormFieldInput";
import { AuthFormHeader } from "@/components/auth/AuthFormHeader";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  resetPasswordSchema,
  type ResetPasswordSchemaType,
} from "@/schemas/reset-password-schema";

interface ResetPasswordFormProps {
  className?: string;
  onSubmit: (values: ResetPasswordSchemaType) => Promise<void>;
  isLoading: boolean;
  invalidToken?: boolean;
}

export function ResetPasswordForm({
  className,
  onSubmit,
  isLoading,
  invalidToken,
  ...props
}: ResetPasswordFormProps) {
  const form = useForm<ResetPasswordSchemaType>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = form.handleSubmit(onSubmit);

  if (invalidToken) {
    return (
      <div className="flex grow items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <AuthFormHeader title="Invalid Reset Link" />
          <CardContent>
            <div className="space-y-4">
              <p className="text-center text-gray-600">
                This password reset link is invalid or has expired.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <AuthFormHeader title="Reset Password" />
        <CardContent>
          <FormProvider {...form}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <FormFieldInput
                name="password"
                label="Password"
                type="password"
                placeholder="Enter your password"
              />

              <FormFieldInput
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                placeholder="Confirm your password"
              />

              <CustomButton type="submit" loading={isLoading}>
                Reset Password
              </CustomButton>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  );
}

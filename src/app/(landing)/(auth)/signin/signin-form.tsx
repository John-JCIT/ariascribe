"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm, FormProvider } from "react-hook-form";
import { CustomButton } from "@/components/CustomButton";
import { FormFieldInput } from "@/components/FormFieldInput";
import { LoginWithGitHub } from "@/components/auth/LoginWithGitHub";
import { AuthFormHeader } from "@/components/auth/AuthFormHeader";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { signInSchema, type SignInSchemaType } from "@/schemas/login-schema";
import { showEmailPasswordFields, hasGithubIntegration } from "@/config/config";

interface SigninFormProps {
  className?: string;
  onSubmit: (values: SignInSchemaType) => Promise<void>;
  isLoading: boolean;
}

export function SigninForm({
  className,
  onSubmit,
  isLoading,
  ...props
}: SigninFormProps) {
  const form = useForm<SignInSchemaType>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSubmit = form.handleSubmit(onSubmit);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <AuthFormHeader title="Login" description="Login to your account" />
        <CardContent>
          <FormProvider {...form}>
            <form onSubmit={handleSubmit} className="space-y-6">
              {showEmailPasswordFields && (
                <>
                  <FormFieldInput
                    name="email"
                    label="Email"
                    type="email"
                    placeholder="Enter your email"
                  />

                  <div>
                    <FormFieldInput
                      name="password"
                      label="Password"
                      type="password"
                      placeholder="Enter your password"
                    />
                    <div className="mt-2 flex">
                      <Link
                        href="/forgot-password"
                        className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                      >
                        Forgot your password?
                      </Link>
                    </div>
                  </div>
                </>
              )}

              <div className="vertical gap-2">
                {showEmailPasswordFields && (
                  <CustomButton
                    loading={isLoading}
                    className="w-full"
                    type="submit"
                  >
                    Sign in with Email
                  </CustomButton>
                )}
                {hasGithubIntegration && <LoginWithGitHub />}
              </div>
              {showEmailPasswordFields && (
                <div className="mt-4 text-center text-sm">
                  No account yet?{" "}
                  <Link href="/signup" className="underline underline-offset-4">
                    Sign up
                  </Link>
                </div>
              )}
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  );
}

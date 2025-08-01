"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm, FormProvider } from "react-hook-form";
import { CustomButton } from "@/components/CustomButton";
import { FormFieldInput } from "@/components/FormFieldInput";
import { LoginWithGitHub } from "@/components/auth/LoginWithGitHub";
import { signUpSchema, type SignUpSchemaType } from "@/schemas/signup-schema";
import { EmailSentAnimation } from "./success-animation";
import {
  AnimatedFormWrapper,
  AnimatedFormHeader,
  AnimatedFormContent,
  AnimatedFormFields,
  AnimatedSuccessContent,
} from "@/components/auth/AnimatedFormComponents";
import { showEmailPasswordFields, hasGithubIntegration } from "@/config/config";

interface SignupFormProps {
  className?: string;
  onSubmit: (values: SignUpSchemaType) => Promise<void>;
  isLoading: boolean;
  isSubmitted: boolean;
}

export function SignupForm({
  className,
  onSubmit,
  isLoading,
  isSubmitted,
  ...props
}: SignupFormProps) {
  const form = useForm<SignUpSchemaType>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const handleSubmit = form.handleSubmit(onSubmit);

  return (
    <AnimatedFormWrapper className={className} {...props}>
      <AnimatedFormHeader
        title={isSubmitted ? "Signup Complete!" : "Signup"}
        description={
          isSubmitted
            ? "Please check your email for a verification link."
            : "Enter your details to sign up for your account"
        }
      />
      <AnimatedFormContent>
        <FormProvider {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatedSuccessContent isVisible={isSubmitted}>
              <EmailSentAnimation description="Thank you for signing up! We've sent a verification link to your email address." />
            </AnimatedSuccessContent>

            <AnimatedFormFields isVisible={!isSubmitted}>
              {showEmailPasswordFields && (
                <>
                  <FormFieldInput
                    name="name"
                    label="Name"
                    type="text"
                    placeholder="Enter your name"
                  />

                  <FormFieldInput
                    name="email"
                    label="Email"
                    type="email"
                    placeholder="Enter your email"
                  />

                  <FormFieldInput
                    name="password"
                    label="Password"
                    type="password"
                    placeholder="Enter your password"
                  />

                  <CustomButton className="w-full" loading={isLoading}>
                    Sign up with Email
                  </CustomButton>
                </>
              )}

              {hasGithubIntegration && (
                <LoginWithGitHub
                  label="Sign up with Github"
                  className="mt-2 w-full"
                />
              )}

              {showEmailPasswordFields && (
                <div className="mt-4 text-center text-sm">
                  Already have an account?{" "}
                  <Link href="/signin" className="underline underline-offset-4">
                    Sign in
                  </Link>
                </div>
              )}
            </AnimatedFormFields>
          </form>
        </FormProvider>
      </AnimatedFormContent>
    </AnimatedFormWrapper>
  );
}

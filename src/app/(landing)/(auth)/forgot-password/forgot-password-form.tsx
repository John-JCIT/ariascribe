"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import { CustomButton } from "@/components/CustomButton";
import { FormFieldInput } from "@/components/FormFieldInput";
import {
  forgotPasswordSchema,
  type ForgotPasswordSchemaType,
} from "@/schemas/forgot-password-schema";
import { EmailSentAnimation } from "@/app/(landing)/(auth)/signup/success-animation";
import {
  AnimatedFormWrapper,
  AnimatedFormHeader,
  AnimatedFormContent,
  AnimatedFormFields,
  AnimatedSuccessContent,
} from "@/components/auth/AnimatedFormComponents";

interface ForgotPasswordFormProps {
  className?: string;
  onSubmit: (values: ForgotPasswordSchemaType) => Promise<void>;
  isLoading: boolean;
  submitted?: boolean;
}

export function ForgotPasswordForm({
  className,
  onSubmit,
  isLoading,
  submitted = false,
  ...props
}: ForgotPasswordFormProps) {
  const form = useForm<ForgotPasswordSchemaType>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleSubmit = form.handleSubmit(onSubmit);

  return (
    <AnimatedFormWrapper className={className} {...props}>
      <AnimatedFormHeader
        title="Reset Password"
        description={
          submitted
            ? "Request submitted"
            : "Enter your email below to reset your password."
        }
      />
      <AnimatedFormContent>
        <FormProvider {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatedSuccessContent isVisible={submitted}>
              <EmailSentAnimation description="If an account exists with the email you provided, you will receive a password reset link shortly. Please check your inbox and follow the instructions to reset your password." />
            </AnimatedSuccessContent>

            <AnimatedFormFields isVisible={!submitted}>
              <FormFieldInput
                name="email"
                label="Email"
                type="email"
                placeholder="Enter your email"
              />

              <CustomButton
                loading={isLoading}
                className="w-full"
                type="submit"
              >
                Reset Password
              </CustomButton>
            </AnimatedFormFields>
          </form>
        </FormProvider>
      </AnimatedFormContent>
    </AnimatedFormWrapper>
  );
}

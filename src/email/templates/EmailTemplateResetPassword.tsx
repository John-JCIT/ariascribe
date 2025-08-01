import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import * as React from "react";
import { VerificationLinkText } from "@/email/components/VerificationLinkText";

interface EmailTemplateProps {
  inviteLink: string;
}

export const EmailTemplateResetPassword = ({
  inviteLink,
}: EmailTemplateProps) => {
  const previewText = `Reset your password`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Container className="mx-auto my-[40px] max-w-[465px] rounded border border-solid border-[#eaeaea] p-[20px]">
            <Heading className="mx-0 my-[30px] p-0 text-center text-[24px] font-normal text-black">
              <strong>Reset Your Password</strong>
            </Heading>
            <Text className="text-[14px] leading-[24px] text-black">
              We received a request to reset the password for your account.
            </Text>
            <Text className="text-[14px] leading-[24px] text-black">
              Click the button below to set a new password:
            </Text>
            <Section className="mt-[32px] mb-[32px] text-center">
              <Button
                className="rounded-lg bg-[#000000] px-5 py-3 text-center text-[12px] font-semibold text-white no-underline"
                href={inviteLink}
              >
                Reset Password
              </Button>
            </Section>
            <VerificationLinkText url={inviteLink} />
            <Hr className="mx-0 my-[26px] w-full border border-solid border-[#eaeaea]" />
            <Text className="text-[12px] leading-[24px] text-[#666666]">
              If you didn't request a password reset, you can safely ignore this
              email. Your password will not be changed.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

EmailTemplateResetPassword.PreviewProps = {
  inviteLink: "http://localhost:3000",
};

export default EmailTemplateResetPassword;

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
} from "@react-email/components";
import * as React from "react";
import { VerificationLinkText } from "@/email/components/VerificationLinkText";

interface EmailTemplateProps {
  inviteLink: string;
}

export const EmailTemplateVerification = ({
  inviteLink,
}: EmailTemplateProps) => {
  const previewText = `Verify Your Email Address.`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Container className="mx-auto my-[40px] max-w-[465px] rounded border border-solid border-[#eaeaea] p-[20px]">
            <Heading className="mx-0 my-[30px] p-0 text-center text-[24px] font-normal text-black">
              <strong>Verify Your Email Address</strong>
            </Heading>
            <Section className="mt-[32px] mb-[32px] text-center">
              <Button
                className="rounded-lg bg-[#000000] px-5 py-3 text-center text-[12px] font-semibold text-white no-underline"
                href={inviteLink}
              >
                Verify Now
              </Button>
            </Section>
            <VerificationLinkText url={inviteLink} />
            <Hr className="mx-0 my-[26px] w-full border border-solid border-[#eaeaea]" />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

EmailTemplateVerification.PreviewProps = {
  inviteLink: "http://localhost:3000",
};

export default EmailTemplateVerification;

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Tailwind,
  Text,
} from "@react-email/components";
import * as React from "react";

interface EmailTemplateProps {
  userName: string;
}

export const EmailTemplateWelcome = ({ userName }: EmailTemplateProps) => {
  const previewText = `Welcome aboard, ${userName}!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Container className="mx-auto my-[40px] max-w-[465px] rounded border border-solid border-[#eaeaea] p-[20px]">
            <Heading className="mx-0 my-[30px] p-0 text-center text-[24px] font-normal text-black">
              <strong>Welcome to the Platform!</strong>
            </Heading>
            <Text className="text-[14px] leading-[24px] text-black">
              Hello {userName},
            </Text>
            <Text className="text-[14px] leading-[24px] text-black">
              We're thrilled to have you join us! Explore the platform and let
              us know if you have any questions.
            </Text>
            {/* Optional: Add a button to get started */}
            {/* <Section className="mt-[32px] mb-[32px] text-center">
              <Button
                className="rounded-lg bg-[#000000] px-5 py-3 text-center text-[12px] font-semibold text-white no-underline"
                href={"https://your-app-url.com/dashboard"} // Replace with actual URL
              >
                Get Started
              </Button>
            </Section> */}
            <Hr className="mx-0 my-[26px] w-full border border-solid border-[#eaeaea]" />
            <Text className="text-[12px] leading-[24px] text-[#666666]">
              You received this email because you signed up on our platform.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

EmailTemplateWelcome.PreviewProps = {
  userName: "Test User",
};

export default EmailTemplateWelcome;

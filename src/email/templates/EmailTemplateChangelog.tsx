import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

import { APP_NAME } from "@/config/config";

interface EmailTemplateChangelogProps {
  versionNumber: string;
  releaseDate: string;
  majorFeatures: string[];
  bugFixes: string[];
  preview?: string;
  title?: string;
  userName?: string;
  ctaUrl?: string;
  ctaText?: string;
  showBetaBadge?: boolean;
}

export default function EmailTemplateChangelog({
  versionNumber = "1.0.0",
  releaseDate = "January 1, 2024",
  majorFeatures = [],
  bugFixes = [],
  preview,
  title,
  userName = "",
  ctaUrl = "https://example.com/changelog",
  ctaText = "View Full Changelog",
  showBetaBadge = false,
}: EmailTemplateChangelogProps) {
  const defaultPreviewText = `${APP_NAME} v${versionNumber} Release - ${majorFeatures.length} new features and ${bugFixes.length} bug fixes`;
  const headingText = title || `${APP_NAME} v${versionNumber}`;

  return (
    <Html>
      <Head />
      <Preview>{preview || defaultPreviewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            {headingText} {showBetaBadge && <span style={betaBadge}>BETA</span>}
          </Heading>

          {userName && <Text style={text}>Hello {userName},</Text>}

          <Text style={text}>
            We're excited to announce the release of version {versionNumber} on{" "}
            {releaseDate}. Here's what's new:
          </Text>

          {majorFeatures.length > 0 && (
            <Section style={section}>
              <Heading style={h2}>New Features</Heading>
              <ul style={list}>
                {majorFeatures.map((feature, index) => (
                  <li key={index} style={listItem}>
                    {feature}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {bugFixes.length > 0 && (
            <Section style={section}>
              <Heading style={h2}>Bug Fixes</Heading>
              <ul style={list}>
                {bugFixes.map((bugFix, index) => (
                  <li key={index} style={listItem}>
                    {bugFix}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section style={buttonContainer}>
            <Button style={button} href={ctaUrl}>
              {ctaText}
            </Button>
          </Section>

          <Text style={footer}>
            Thank you for using {APP_NAME}!<br />
            If you have any questions, feel free to reach out to our support
            team.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: "#f9fafb", // gray-50
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
  padding: "48px 12px", // py-12 px-3
};

const container = {
  backgroundColor: "#ffffff", // white
  margin: "0 auto",
  padding: "32px", // p-8
  maxWidth: "600px",
  borderRadius: "12px", // rounded-xl
  boxShadow:
    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)", // shadow-lg
  border: "1px solid #e5e7eb", // border gray-200
};

const h1 = {
  color: "#111827", // gray-900
  fontSize: "30px", // text-3xl
  fontWeight: "800", // font-extrabold
  margin: "12px 0 24px", // my-3 mb-6
  padding: "0",
  lineHeight: "1.25", // leading-tight
  textAlign: "center" as const,
};

const h2 = {
  color: "#1f2937", // gray-800
  fontSize: "24px", // text-2xl
  fontWeight: "700", // font-bold
  margin: "32px 0 16px", // mt-8 mb-4
  padding: "0 0 8px", // pb-2
  borderBottom: "2px solid #f3f4f6", // border-b-2 border-gray-100
};

const text = {
  color: "#4b5563", // gray-600
  fontSize: "16px", // text-base
  lineHeight: "1.625", // leading-relaxed
  margin: "16px 0", // my-4
};

const section = {
  margin: "28px 0", // my-7
};

const list = {
  margin: "16px 0", // my-4
  padding: "0 0 0 24px", // pl-6
};

const listItem = {
  color: "#4b5563", // gray-600
  fontSize: "16px", // text-base
  lineHeight: "1.625", // leading-relaxed
  margin: "12px 0", // my-3
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "36px 0 28px", // my-9 mb-7
};

const button = {
  backgroundColor: "#4f46e5", // indigo-600
  borderRadius: "8px", // rounded-lg
  color: "#ffffff", // white
  fontSize: "16px", // text-base
  fontWeight: "600", // font-semibold
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px", // py-3.5 px-8 (larger padding for less squished button)
  border: "0",
  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)", // shadow
};

const footer = {
  color: "#6b7280", // gray-500
  fontSize: "14px", // text-sm
  margin: "32px 0 12px", // mt-8 mb-3
  textAlign: "center" as const,
  lineHeight: "1.6", // leading-relaxed
  padding: "20px 0 0", // pt-5
  borderTop: "1px solid #f3f4f6", // border-t border-gray-100
};

const betaBadge = {
  backgroundColor: "#ef4444", // red-500
  color: "#ffffff", // white
  fontSize: "12px", // text-xs
  fontWeight: "600", // font-semibold
  padding: "4px 10px", // py-1 px-2.5
  borderRadius: "9999px", // rounded-full
  marginLeft: "10px", // ml-2.5
  verticalAlign: "middle",
  letterSpacing: "0.025em", // tracking-wide
  boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", // shadow-sm
};

EmailTemplateChangelog.PreviewProps = {
  versionNumber: "1.2.3",
  releaseDate: "July 26, 2024",
  majorFeatures: [
    "Added dark mode support.",
    "Integrated new payment provider.",
    "Launched AI assistant feature.",
  ],
  bugFixes: [
    "Fixed login issue on Safari.",
    "Resolved notification duplication bug.",
  ],
  preview: "Optional Custom Title Here",
  title: "Optional Custom Title Here",
  userName: "Alex Doe",
  ctaUrl: "https://example.com/full-changelog-v1.2.3",
  ctaText: "See What's New",
  showBetaBadge: true,
} satisfies EmailTemplateChangelogProps;

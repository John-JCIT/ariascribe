import { Text } from "@react-email/components";
import * as React from "react";

interface VerificationLinkTextProps {
  url: string;
}

const textStyle = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#525f7f",
};

const linkStyle = {
  ...textStyle,
  display: "inline-block", // Allows max-width to work
  maxWidth: "100%", // Ensure it doesn't overflow container
  wordBreak: "break-all" as const, // Break long URLs
  color: "#525f7f", // Match surrounding text color
  textDecoration: "none", // Optional: remove underline if desired
};

export const VerificationLinkText: React.FC<
  Readonly<VerificationLinkTextProps>
> = ({ url }) => (
  <>
    <Text style={textStyle}>
      If you cannot click the link, please copy and paste this URL into your
      browser:
    </Text>
    <Text style={linkStyle}>{url}</Text>
  </>
);

export default VerificationLinkText;

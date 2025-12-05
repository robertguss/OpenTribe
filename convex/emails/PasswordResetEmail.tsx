/**
 * Password Reset Email Template
 *
 * React Email template for password reset requests.
 * Used by Better Auth's built-in password reset flow.
 */

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface PasswordResetEmailProps {
  name?: string;
  resetUrl: string;
}

export function PasswordResetEmail({
  name,
  resetUrl,
}: PasswordResetEmailProps) {
  const greeting = name ? `Hi ${name},` : "Hi,";

  return (
    <Html>
      <Head />
      <Preview>Reset your OpenTribe password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Reset your password</Heading>

          <Text style={paragraph}>{greeting}</Text>

          <Text style={paragraph}>
            We received a request to reset your password for your OpenTribe
            account. Click the button below to choose a new password.
          </Text>

          <Section style={buttonSection}>
            <Button style={button} href={resetUrl}>
              Reset Password
            </Button>
          </Section>

          <Text style={warningText}>
            This link will expire in 1 hour. If you didn&apos;t request this
            password reset, you can safely ignore this email. Your password will
            remain unchanged.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            If the button above doesn&apos;t work, copy and paste this link into
            your browser:
          </Text>
          <Text style={linkText}>{resetUrl}</Text>

          <Hr style={hr} />

          <Text style={securityNote}>
            <strong>Security tip:</strong> Never share this link with anyone.
            OpenTribe will never ask you for your password via email.
          </Text>

          <Text style={footer}>
            Need help?{" "}
            <Link href="mailto:support@opentribe.com" style={link}>
              Contact support
            </Link>
          </Text>

          <Text style={signature}>The OpenTribe Team</Text>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
  borderRadius: "8px",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
};

const heading = {
  color: "#111827",
  fontSize: "28px",
  fontWeight: "700",
  lineHeight: "1.3",
  margin: "0 0 24px",
};

const paragraph = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 16px",
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#111827",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const warningText = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0 0 16px",
  backgroundColor: "#fef3c7",
  padding: "12px",
  borderRadius: "6px",
  borderLeft: "4px solid #f59e0b",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};

const footer = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0 0 8px",
};

const linkText = {
  color: "#6366f1",
  fontSize: "12px",
  lineHeight: "1.6",
  wordBreak: "break-all" as const,
  margin: "0 0 16px",
};

const link = {
  color: "#6366f1",
  textDecoration: "underline",
};

const securityNote = {
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: "1.6",
  margin: "0 0 16px",
  backgroundColor: "#f3f4f6",
  padding: "12px",
  borderRadius: "6px",
};

const signature = {
  color: "#6b7280",
  fontSize: "14px",
  fontWeight: "500",
  margin: "16px 0 0",
};

export default PasswordResetEmail;

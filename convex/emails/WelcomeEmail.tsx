/**
 * Welcome Email Template
 *
 * React Email template for welcoming new users to OpenTribe.
 * Used by the sendWelcomeEmail action.
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

interface WelcomeEmailProps {
  name?: string;
  /** Dashboard URL - must be provided by caller based on environment */
  dashboardUrl: string;
}

export function WelcomeEmail({ name, dashboardUrl }: WelcomeEmailProps) {
  const greeting = name ? `Welcome, ${name}!` : "Welcome!";

  return (
    <Html>
      <Head />
      <Preview>Welcome to OpenTribe - Your community awaits!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>{greeting}</Heading>

          <Text style={paragraph}>
            Thank you for joining our community. We&apos;re excited to have you!
          </Text>

          <Text style={paragraph}>Here&apos;s what you can do next:</Text>

          <Section style={listSection}>
            <Text style={listItem}>
              <span style={bullet}>•</span> Explore community spaces and connect
              with others
            </Text>
            <Text style={listItem}>
              <span style={bullet}>•</span> Browse courses and start learning
            </Text>
            <Text style={listItem}>
              <span style={bullet}>•</span> Join upcoming events
            </Text>
            <Text style={listItem}>
              <span style={bullet}>•</span> Complete your profile
            </Text>
          </Section>

          <Section style={buttonSection}>
            <Button style={button} href={dashboardUrl}>
              Go to Dashboard
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            If you have any questions, feel free to reach out to us at{" "}
            <Link href="mailto:support@opentribe.com" style={link}>
              support@opentribe.com
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

const listSection = {
  margin: "0 0 24px",
};

const listItem = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "1.8",
  margin: "0",
  paddingLeft: "8px",
};

const bullet = {
  color: "#6366f1",
  marginRight: "8px",
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

const hr = {
  borderColor: "#e5e7eb",
  margin: "32px 0",
};

const footer = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0 0 8px",
};

const link = {
  color: "#6366f1",
  textDecoration: "underline",
};

const signature = {
  color: "#6b7280",
  fontSize: "14px",
  fontWeight: "500",
  margin: "16px 0 0",
};

export default WelcomeEmail;

import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://regexlens.dev";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How RegexLens collects, uses, and protects your information.",
  alternates: { canonical: `${siteUrl}/privacy` },
};

export default function PrivacyPolicyPage() {
  const effectiveDate = "March 31, 2026";

  return (
    <LegalPageLayout title="Privacy Policy">
      <p className="text-muted-foreground not-prose mb-8">
        <strong className="text-foreground">Effective date:</strong> {effectiveDate}
      </p>

      <p>
        RegexLens (&quot;RegexLens,&quot; &quot;we,&quot; &quot;us,&quot;) provides a web-based
        regular-expression tester, debugger, and visualizer. This Privacy Policy explains what
        information we collect, how we use it, and your choices. It applies to our website and
        online product offered at {siteUrl} and related subdomains.
      </p>

      <h2>Information we collect</h2>
      <h3>Information you provide</h3>
      <ul>
        <li>
          <strong>Account and sign-in.</strong> If you create or use an account, we process
          authentication data from your chosen provider (for example Google, GitHub, or email
          magic links). This typically includes your email address, name, and profile image
          URL when supplied by the provider. Magic-link email is delivered using our email
          vendor (Resend).
        </li>
        <li>
          <strong>Saved content (Pro).</strong> If you are a subscriber and save regexes or
          related snippets in the app, we store that content and metadata you choose to save
          in our database so you can access it across sessions.
        </li>
        <li>
          <strong>Billing.</strong> If you purchase a paid plan, payment information is handled
          by Stripe. We receive limited billing identifiers and subscription status from Stripe
          (we do not store full payment card numbers on RegexLens servers).
        </li>
      </ul>

      <h3>Information collected automatically</h3>
      <ul>
        <li>
          <strong>Usage and diagnostics.</strong> We may use Vercel Analytics (and similar
          first-party analytics) to understand aggregated traffic and product usage.
        </li>
        <li>
          <strong>Logs and security.</strong> Our hosting and application may record technical
          data such as IP address, user agent, request path, and timestamps for security,
          reliability, and abuse prevention.
        </li>
        <li>
          <strong>Cookies and similar technologies.</strong> We use cookies and similar
          mechanisms required for authentication sessions (for example, secure session
          cookies when you sign in).
        </li>
      </ul>

      <h3>Regex, test text, and AI features</h3>
      <ul>
        <li>
          Core regex testing and visualization run in your browser. Unless you explicitly save
          content to your account (Pro) or use features that send data to our servers, your
          patterns and sample text are not stored by us as part of routine operation.
        </li>
        <li>
          <strong>Shareable links</strong> may encode pattern and test state in the URL you
          share. Anyone with the link can view that encoded state.
        </li>
        <li>
          <strong>Regex Copilot (Pro AI assistant).</strong> When you use AI-powered features,
          your prompts and relevant regex context are sent to our AI provider (Anthropic) to
          generate responses. Please do not submit secrets, regulated personal data, or other
          sensitive information you are not authorized to share with subprocessors.
        </li>
      </ul>

      <h2>How we use information</h2>
      <p>We use the information above to:</p>
      <ul>
        <li>Provide, operate, and improve RegexLens;</li>
        <li>Authenticate users, sync saved library content, and enforce plan limits;</li>
        <li>Process payments and manage subscriptions via Stripe;</li>
        <li>Communicate transactional messages (for example, sign-in emails where applicable);</li>
        <li>Monitor security, prevent abuse, and comply with legal obligations.</li>
      </ul>

      <h2>Legal bases (EEA, UK, and similar jurisdictions)</h2>
      <p>
        Where required, we rely on contract (providing the service you request), legitimate
        interests (security, analytics, product improvement—balanced against your rights),
        and consent where applicable (for example, non-essential cookies or marketing, if
        offered).
      </p>

      <h2>How we share information</h2>
      <p>We share information with service providers who process data on our behalf, including:</p>
      <ul>
        <li>Hosting and infrastructure (for example Vercel);</li>
        <li>Database and authentication storage (PostgreSQL as configured for our Auth.js adapter);</li>
        <li>Payments (Stripe);</li>
        <li>Transactional email (Resend, for magic links);</li>
        <li>AI inference (Anthropic, for Pro AI features);</li>
        <li>Analytics (Vercel Analytics).</li>
      </ul>
      <p>
        We may also disclose information if required by law, to protect rights and safety, or
        in connection with a business transfer, subject to applicable law.
      </p>

      <h2>Data retention</h2>
      <p>
        We retain account, billing, and saved-library data as needed to provide the service and
        meet legal, tax, and accounting requirements. Session and security logs are kept for a
        limited period consistent with operational needs. You may request deletion of your
        account (see Contact); some records may be retained where we are legally required to do
        so.
      </p>

      <h2>Security</h2>
      <p>
        We use industry-standard safeguards designed to protect data in transit and at rest.
        No method of transmission or storage is completely secure; we work to reduce risk but
        cannot guarantee absolute security.
      </p>

      <h2>International transfers</h2>
      <p>
        We may process and store information in the United States and other countries where our
        service providers operate. Where required, we use appropriate safeguards (such as
        standard contractual clauses) for cross-border transfers.
      </p>

      <h2>Your choices and rights</h2>
      <p>Depending on where you live, you may have rights to:</p>
      <ul>
        <li>Access, correct, or delete personal information;</li>
        <li>Object to or restrict certain processing;</li>
        <li>Port data where applicable;</li>
        <li>Withdraw consent where processing is consent-based;</li>
        <li>Lodge a complaint with a supervisory authority.</li>
      </ul>
      <p>
        You can manage some information through your account and subscription portal (Stripe
        Customer Portal, where available). For other requests, contact us using the information
        below.
      </p>

      <h2>Children</h2>
      <p>
        RegexLens is not directed to children under 16 (or the minimum age in your
        jurisdiction). We do not knowingly collect personal information from children. If you
        believe we have collected information from a child, contact us and we will take
        appropriate steps.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will post the updated version on
        this page and revise the effective date. Where changes are material, we will provide
        additional notice as required by law.
      </p>

      <h2>Contact</h2>
      <p>
        For privacy-related questions or requests, contact us at{" "}
        <a href="mailto:prince.agyei.tuffour@gmail.com">prince.agyei.tuffour@gmail.com</a>.
      </p>
    </LegalPageLayout>
  );
}

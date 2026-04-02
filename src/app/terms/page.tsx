import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://regexlens.dev";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing use of RegexLens.",
  alternates: { canonical: `${siteUrl}/terms` },
};

export default function TermsOfServicePage() {
  const effectiveDate = "March 31, 2026";

  return (
    <LegalPageLayout title="Terms of Service">
      <p className="text-muted-foreground not-prose mb-8">
        <strong className="text-foreground">Effective date:</strong> {effectiveDate}
      </p>

      <p>
        These Terms of Service (&quot;Terms&quot;) govern your access to and use of RegexLens
        (&quot;RegexLens,&quot; &quot;we,&quot; &quot;us&quot;), including our website, web
        application, and related services (collectively, the &quot;Service&quot;) available at{" "}
        {siteUrl} and related locations.
      </p>
      <p>
        By accessing or using the Service, you agree to these Terms. If you do not agree, do
        not use the Service.
      </p>

      <h2>Eligibility and accounts</h2>
      <p>
        You must be able to form a binding contract in your jurisdiction (and meet any minimum
        age in your region) to use the Service. You are responsible for activity under your
        account. Keep your credentials confidential. You may sign in using third-party
        providers (for example Google or GitHub) subject to their terms.
      </p>

      <h2>The Service</h2>
      <p>
        RegexLens provides tools to test, visualize, explain, and work with regular expressions.
        We offer free functionality and optional paid plans (&quot;Pro&quot;) with additional
        features such as saved libraries, exports, and AI-assisted assistance, as described on
        our pricing page.
      </p>
      <p>
        We may modify, suspend, or discontinue features with reasonable notice where practicable.
        We do not guarantee uninterrupted or error-free operation.
      </p>

      <h2>Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Violate applicable law or third-party rights;</li>
        <li>
          Probe, scan, or test the vulnerability of the Service, or bypass authentication or
          rate limits, without authorization;
        </li>
        <li>
          Send malware, overload systems, or interfere with other users&apos; access (including
          denial-of-service attacks);
        </li>
        <li>
          Reverse engineer the Service except to the extent permitted by law despite this
          limitation;
        </li>
        <li>
          Use the Service to process unlawful, infringing, or highly sensitive personal data
          you are not authorized to submit (for example in AI prompts or saved snippets).
        </li>
      </ul>
      <p>
        We may suspend or terminate access for conduct that we reasonably believe violates these
        Terms or creates risk or legal exposure.
      </p>

      <h2>User content</h2>
      <p>
        You retain rights in content you create. You grant RegexLens a non-exclusive license to
        host, process, and display your content solely as needed to operate the Service (for
        example storing snippets you save, or sending AI prompts to our provider when you use
        Copilot). You represent you have the rights needed to grant this license.
      </p>
      <p>
        Share links you create may expose encoded regex or test data to anyone with the link.
        You are responsible for what you share.
      </p>

      <h2>Subscriptions, fees, and taxes</h2>
      <p>
        Paid plans are billed through Stripe. Fees are as shown at checkout, plus applicable
        taxes. Subscriptions renew until cancelled. You can manage billing in the Stripe
        Customer Portal where we make it available.
      </p>
      <p>
        Unless required by law or stated otherwise at purchase, payments are non-refundable. If
        we materially reduce features tied to your paid tier, we will provide a remedy
        consistent with applicable consumer law.
      </p>

      <h2>Intellectual property</h2>
      <p>
        The Service, including software, branding, and documentation, is owned by RegexLens or
        its licensors and is protected by intellectual property laws. Except for the limited
        rights expressly granted in these Terms, no rights are transferred to you.
      </p>

      <h2>Third-party services</h2>
      <p>
        The Service integrates with third parties (for example authentication providers,
        Stripe, hosting, analytics, email delivery, and AI providers for Pro features). Your use
        of those services may be subject to their terms and privacy policies.
      </p>

      <h2>Disclaimers</h2>
      <p>
        THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES
        OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING MERCHANTABILITY, FITNESS
        FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT, TO THE MAXIMUM EXTENT PERMITTED BY LAW.
      </p>
      <p>
        Regex explanations, warnings, and AI-generated suggestions are informational and may be
        incorrect or incomplete. You are responsible for validating results in your environment
        and complying with your own security and compliance obligations.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, NEITHER RegexLens NOR ITS SUPPLIERS WILL BE
        LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE
        DAMAGES, OR ANY LOSS OF PROFITS, DATA, GOODWILL, OR BUSINESS OPPORTUNITY, ARISING OUT OF
        OR RELATED TO THE SERVICE OR THESE TERMS, EVEN IF ADVISED OF THE POSSIBILITY.
      </p>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR AGGREGATE LIABILITY FOR ALL CLAIMS RELATING
        TO THE SERVICE OR THESE TERMS WILL NOT EXCEED THE GREATER OF (A) THE AMOUNTS YOU PAID
        RegexLens FOR THE SERVICE IN THE TWELVE (12) MONTHS BEFORE THE CLAIM OR (B) FIFTY U.S.
        DOLLARS (USD $50) IF YOU HAVE NOT HAD A PAYMENT OBLIGATION.
      </p>
      <p>
        Some jurisdictions do not allow certain limitations; in those cases, our liability is
        limited to the fullest extent permitted.
      </p>

      <h2>Indemnity</h2>
      <p>
        You will defend and indemnify RegexLens and its affiliates, officers, and employees
        against third-party claims, damages, and costs (including reasonable attorneys&apos; fees)
        arising from your use of the Service, your content, or your violation of these Terms,
        except to the extent caused by RegexLens&apos; willful misconduct.
      </p>

      <h2>Governing law and disputes</h2>
      <p>
        These Terms are governed by the laws of the State of Delaware, USA, excluding conflict of
        law rules, unless mandatory consumer protections in your jurisdiction require otherwise.
        Courts in Delaware have exclusive jurisdiction for disputes, subject to mandatory
        arbitration or venue rules that apply to you.
      </p>
      <p>
        If you are a consumer in the EEA, UK, or another region with non-waivable rights, you
        may also have rights under local law. Nothing in these Terms limits those rights.
      </p>

      <h2>General</h2>
      <p>
        These Terms constitute the entire agreement regarding the Service and supersede prior
        agreements on the subject. If any provision is unenforceable, the remaining provisions
        remain in effect. Our failure to enforce a provision is not a waiver. You may not assign
        these Terms without our consent; we may assign them in connection with a merger or sale.
      </p>

      <h2>Contact</h2>
      <p>
        For questions about these Terms, contact{" "}
        <a href="mailto:prince.agyei.tuffour@gmail.com">prince.agyei.tuffour@gmail.com</a>.
      </p>
    </LegalPageLayout>
  );
}

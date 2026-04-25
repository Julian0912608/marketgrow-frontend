// app/privacy/page.tsx

import Link from 'next/link';
import { Navbar } from '@/components/marketing/Navbar';
import { Footer } from '@/components/marketing/sections';

export default function PrivacyPage() {
  return (
    <main>
      <Navbar />
      <section className="pt-32 pb-20 bg-white">
        <div className="max-w-3xl mx-auto px-6">

          <h1 className="font-display text-4xl font-800 text-slate-900 mb-2">Privacy Policy</h1>
          <p className="text-slate-400 text-sm mb-12">Last updated: April 2026</p>

          <div className="prose prose-slate max-w-none">

            <h2>1. Who we are</h2>
            <p>
              MarketGrow is an AI-powered analytics platform for ecommerce entrepreneurs, operated by
              MarketGrow B.V., based in the Netherlands. If you have questions about this policy,
              contact us at <a href="mailto:hello@marketgrow.ai">hello@marketgrow.ai</a>.
            </p>

            <h2>2. What data we collect</h2>
            <p>We collect the following data when you use MarketGrow:</p>
            <ul>
              <li><strong>Account data</strong> — name, email address, company name, password (hashed)</li>
              <li><strong>Billing data</strong> — payment information processed by Stripe (we do not store card details)</li>
              <li><strong>Store data</strong> — order data, product data, and revenue data synced from your connected platforms (Shopify, Bol.com, Amazon, Etsy, WooCommerce)</li>
              <li><strong>Advertising data</strong> — campaign data, ad creatives, and performance metrics from connected advertising platforms (Meta, Google Ads, Bol.com Ads)</li>
              <li><strong>Usage data</strong> — how you use the platform, which features you use, and technical logs</li>
              <li><strong>Communications</strong> — emails you send to our support team</li>
            </ul>

            <h2>3. How we use your data</h2>
            <p>We use your data to:</p>
            <ul>
              <li>Provide and improve the MarketGrow platform</li>
              <li>Generate AI-powered insights and recommendations based on your store data</li>
              <li>Generate AI-powered advertising creatives and copy on your behalf, with your explicit approval before publishing</li>
              <li>Send you daily briefing emails and platform notifications (you can opt out)</li>
              <li>Process payments and manage your subscription</li>
              <li>Provide customer support</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p>We do not sell your data to third parties. We do not use your store data to train AI models that are shared with other customers.</p>

            <h2>4. Data storage and security</h2>
            <p>
              Your data is stored on servers within the European Union (Supabase, hosted on AWS eu-west-1).
              We use encryption at rest and in transit. All third-party access tokens (Shopify, Bol.com, Meta,
              Google Ads) are encrypted at rest using AES-256-GCM. Each customer account is strictly isolated
              at the database level using Row-Level Security — your data is never accessible to other MarketGrow customers.
            </p>

            <h2>5. Third-party services</h2>
            <p>We use the following third-party services to operate MarketGrow:</p>
            <ul>
              <li><strong>Stripe</strong> — payment processing (<a href="https://stripe.com/privacy" target="_blank" rel="noopener">privacy policy</a>)</li>
              <li><strong>Resend</strong> — transactional email (<a href="https://resend.com/privacy" target="_blank" rel="noopener">privacy policy</a>)</li>
              <li><strong>Anthropic</strong> — AI model provider for generating insights (<a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener">privacy policy</a>)</li>
              <li><strong>Google</strong> — AI model provider for image generation (<a href="https://policies.google.com/privacy" target="_blank" rel="noopener">privacy policy</a>)</li>
              <li><strong>Upstash</strong> — Redis cache (<a href="https://upstash.com/privacy" target="_blank" rel="noopener">privacy policy</a>)</li>
            </ul>

            <h2>6. Meta Platform Integration</h2>
            <p>
              MarketGrow integrates with Meta's advertising platform (Facebook and Instagram) through the
              Meta Marketing API. This section explains what data we access and how we use it.
            </p>

            <h3>What we access</h3>
            <p>
              When you connect your Meta Business account to MarketGrow, with your explicit consent through
              Meta's official OAuth flow, we access:
            </p>
            <ul>
              <li>Basic information about your Meta Business Manager and connected ad accounts</li>
              <li>Information about Facebook Pages you manage</li>
              <li>Advertising campaign data (campaigns, ad sets, ads, creatives) that you have created via MarketGrow or that exists in your account</li>
              <li>Advertising performance metrics (impressions, reach, clicks, spend, conversions, ROAS)</li>
            </ul>

            <h3>What we do with this data</h3>
            <ul>
              <li>Display campaign performance in your MarketGrow dashboard</li>
              <li>Generate AI-powered advertising creatives and copy on your behalf</li>
              <li>Publish advertising campaigns directly to your Meta ad account, with your explicit per-campaign approval</li>
              <li>Provide automated insights and growth recommendations</li>
              <li>Apply optional safeguards such as ROAS-based auto-pause rules</li>
            </ul>

            <h3>What we do NOT do</h3>
            <ul>
              <li>We do not access your personal Facebook profile, friends list, photos, or messages</li>
              <li>We do not access data from Meta accounts other than the one you explicitly connect</li>
              <li>We do not sell, rent, or share your Meta data with any third party</li>
              <li>We do not use your Meta data to train AI models</li>
              <li>We do not retain your data after you disconnect your Meta account, except for aggregated, anonymised performance statistics</li>
            </ul>

            <h3>How we protect your Meta data</h3>
            <ul>
              <li>All Meta access tokens are encrypted at rest using AES-256-GCM encryption</li>
              <li>All API communication is encrypted in transit via HTTPS / TLS 1.2+</li>
              <li>Tokens are stored separately from other account data and are accessible only by authorised backend processes</li>
              <li>Each customer account is isolated at the database level using Row-Level Security</li>
            </ul>

            <h3>Disconnecting your Meta account</h3>
            <p>
              You can disconnect your Meta account from MarketGrow at any time via{' '}
              <strong>Settings → Integrations → Meta → Disconnect</strong>. Disconnection immediately revokes
              our access token and removes all Meta-related data from our systems within 24 hours, except for
              aggregated, anonymised performance statistics that contain no personally identifiable information.
            </p>
            <p>
              You can also revoke MarketGrow's access directly from Meta at any time via your{' '}
              <a href="https://www.facebook.com/settings?tab=business_tools" target="_blank" rel="noopener">
                Meta Business Tools settings
              </a>.
            </p>

            <h2>7. Your rights (GDPR)</h2>
            <p>As a user in the EU/EEA, you have the right to:</p>
            <ul>
              <li>Access the data we hold about you</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data ("right to be forgotten")</li>
              <li>Object to or restrict processing of your data</li>
              <li>Export your data in a portable format</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p>To exercise any of these rights, email us at <a href="mailto:hello@marketgrow.ai">hello@marketgrow.ai</a>. We will respond within 30 days.</p>

            <h2 id="data-deletion">8. Data Deletion Request</h2>
            <p>
              You have the right to request deletion of all personal data we hold about you at any time,
              in accordance with the EU General Data Protection Regulation (GDPR).
            </p>

            <h3>How to request deletion</h3>
            <p>
              Send an email to <a href="mailto:hello@marketgrow.ai">hello@marketgrow.ai</a> with the subject line{' '}
              <strong>"Data deletion request"</strong>. Please include the email address associated with your
              MarketGrow account so we can locate your data.
            </p>

            <h3>What gets deleted</h3>
            <p>Upon receiving a verified request, we will permanently delete:</p>
            <ul>
              <li>Your MarketGrow account and login credentials</li>
              <li>All connected integration tokens (Shopify, Bol.com, Meta, Google Ads)</li>
              <li>All synchronised data including orders, products, advertising performance, and analytics</li>
              <li>All AI-generated content you have created within the platform</li>
              <li>All audit logs and usage history associated with your account</li>
            </ul>

            <h3>Timeframe</h3>
            <p>
              We process verified deletion requests within 30 days. You will receive an email confirmation
              once deletion is complete. After deletion, your data cannot be recovered.
            </p>

            <h3>Data retained for legal reasons</h3>
            <p>
              Certain billing and tax records may be retained for up to 7 years as required by Dutch tax law
              (Algemene Wet inzake Rijksbelastingen). These records are anonymised where possible and are not
              used for any other purpose.
            </p>

            <h3>Third-party data</h3>
            <p>
              Deleting your MarketGrow account does <strong>not</strong> delete data held by connected third
              parties (Meta, Shopify, Bol.com, Google). To remove data from those platforms, you must contact
              them directly. We will, however, immediately revoke our access tokens to those platforms upon
              deletion of your MarketGrow account.
            </p>

            <h2>9. Cookies</h2>
            <p>
              We use strictly necessary cookies to keep you logged in and to protect against CSRF attacks.
              We do not use advertising or tracking cookies. See our <Link href="/cookies">Cookie Policy</Link> for details.
            </p>

            <h2>10. Data retention</h2>
            <p>
              We retain your data for as long as your account is active. If you cancel your account,
              we delete your personal data within 90 days, except where we are required to retain it
              for legal or accounting purposes.
            </p>

            <h2>11. Changes to this policy</h2>
            <p>
              We may update this policy from time to time. We will notify you by email of material changes
              at least 30 days before they take effect.
            </p>

            <h2>12. Contact</h2>
            <p>
              Questions or concerns? Email us at{' '}
              <a href="mailto:hello@marketgrow.ai">hello@marketgrow.ai</a>.
            </p>

          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

import type { Metadata, Viewport } from 'next';
import { DM_Sans, Bricolage_Grotesque } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { CookieBanner } from '@/components/CookieBanner';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';
import './globals.css';

// Self-hosted via next/font/google. Geen render-blocking CSS request meer
// naar fonts.googleapis.com. Automatische preconnect, automatic font-display swap,
// en subsetting tot Latin-only. Variabelen matchen globals.css :root fallbacks.
const dmSans = DM_Sans({
  subsets:  ['latin'],
  display:  'swap',
  variable: '--font-geist-sans',
  weight:   ['300', '400', '500', '600', '700'],
});

const bricolage = Bricolage_Grotesque({
  subsets:  ['latin'],
  display:  'swap',
  variable: '--font-cabinet',
  weight:   ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'MarketGrow - AI-Powered Ecommerce Intelligence',
  description: 'The all-in-one AI platform for ecommerce entrepreneurs. Connect Shopify, Amazon, Bol.com and more.',
  applicationName: 'MarketGrow',
  appleWebApp: {
    capable:    true,
    title:      'MarketGrow',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon:     '/favicon.ico',
    shortcut: '/favicon.ico',
    apple:    '/icons/apple-touch-icon.png',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  // Next.js voegt automatisch <link rel="manifest"> toe omdat app/manifest.ts bestaat
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#4f46e5' },
    { media: '(prefers-color-scheme: dark)',  color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${bricolage.variable} scroll-smooth`}>
      <body className="grain antialiased">
        {children}
        <Analytics />
        <SpeedInsights />
        <CookieBanner />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}

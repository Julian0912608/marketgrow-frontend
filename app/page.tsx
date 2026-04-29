import { Navbar }    from '@/components/marketing/Navbar';
import { Hero }      from '@/components/marketing/Hero';
import {
  PainPoints,
  HowItWorks,
  AIContentStudio,
  AIAds,
  PlatformBar,
  Pricing,
  FAQ,
  CTA,
  Footer,
} from '@/components/marketing/sections';

export default function HomePage() {
  return (
    <main className="overflow-x-hidden bg-cream">
      <Navbar />
      <Hero />
      <PainPoints />
      <HowItWorks />
      <AIContentStudio />
      <AIAds />
      <PlatformBar />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}

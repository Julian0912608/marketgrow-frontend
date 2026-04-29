'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight, Check, Sparkles, Zap, ImageIcon,
  Layers, Wand2, ShoppingBag, Compass, MessageCircle,
  TrendingUp, Lightbulb, Plus, Minus,
} from 'lucide-react';

// ════════════════════════════════════════════════════════════════
// PAIN POINTS — what's wrong with the status quo
// ════════════════════════════════════════════════════════════════

export function PainPoints() {
  const pains = [
    {
      symbol: '✕',
      title: 'Empty content calendars',
      desc: 'You know you need to post, but staring at a blank Instagram is exhausting. Days slip by with nothing live.',
    },
    {
      symbol: '✕',
      title: 'No idea what actually works',
      desc: 'You see other stores running ads everywhere. You try it. Money disappears. No one tells you why.',
    },
    {
      symbol: '✕',
      title: 'Too expensive to outsource',
      desc: 'Agencies want €2,000+ per month. Freelancers ghost you. Tools cost more than your revenue.',
    },
  ];

  return (
    <section className="bg-warm-900 py-24 sm:py-32">
      <div className="max-w-5xl mx-auto px-6">
        <div className="max-w-2xl mb-16">
          <p className="text-xs uppercase tracking-[0.2em] text-terra-400 font-medium mb-4">
            Sound familiar?
          </p>
          <h2 className="font-serif-display text-4xl sm:text-5xl text-white leading-tight tracking-tight">
            You started a store to <span className="italic text-terra-400">build something</span>.
            Not to drown in marketing tasks.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-warm-700">
          {pains.map((p, i) => (
            <div
              key={i}
              className="bg-warm-900 p-8 sm:p-10"
            >
              <div className="text-terra-500 text-2xl font-light mb-6">{p.symbol}</div>
              <h3 className="font-serif-display text-xl text-white mb-3 leading-snug">
                {p.title}
              </h3>
              <p className="text-warm-400 text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* Transition line */}
        <p className="text-center mt-16 text-warm-400 text-base">
          We built MarketGrow to fix exactly this.
        </p>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════
// HOW IT WORKS — 3 simple steps
// ════════════════════════════════════════════════════════════════

export function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Connect your store',
      desc: 'Shopify or Bol.com — link in 60 seconds. We sync your products, orders, and ad accounts automatically.',
      visual: 'connect',
    },
    {
      number: '02',
      title: 'AI does the heavy lifting',
      desc: 'Product descriptions, ad creatives, social posts, daily briefings. All grounded in your real product data.',
      visual: 'ai',
    },
    {
      number: '03',
      title: 'You stay in control',
      desc: 'Review, tweak, publish. Nothing goes live without your approval. We make work easier, not autonomous.',
      visual: 'control',
    },
  ];

  return (
    <section id="how" className="bg-cream py-24 sm:py-32">
      <div className="max-w-5xl mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center mb-20">
          <p className="text-xs uppercase tracking-[0.2em] text-terra-600 font-medium mb-4">
            How it works
          </p>
          <h2 className="font-serif-display text-4xl sm:text-5xl text-warm-900 leading-tight tracking-tight">
            From signup to <span className="italic">first growing</span> in three steps.
          </h2>
        </div>

        <div className="space-y-16 sm:space-y-24">
          {steps.map((step, i) => (
            <div
              key={i}
              className={`grid md:grid-cols-2 gap-10 lg:gap-16 items-center ${
                i % 2 === 1 ? 'md:[&>*:first-child]:order-2' : ''
              }`}
            >
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <span className="font-serif-display italic text-terra-500 text-3xl">
                    {step.number}
                  </span>
                  <div className="h-px flex-1 bg-warm-200" />
                </div>
                <h3 className="font-serif-display text-3xl sm:text-4xl text-warm-900 mb-4 leading-tight">
                  {step.title}
                </h3>
                <p className="text-warm-700 text-base sm:text-lg leading-relaxed max-w-md">
                  {step.desc}
                </p>
              </div>

              <div>
                <StepVisual variant={step.visual} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StepVisual({ variant }: { variant: string }) {
  if (variant === 'connect') {
    return (
      <div className="bg-white rounded-2xl border border-warm-100 shadow-lg p-8">
        <div className="space-y-3">
          {[
            { name: 'Shopify',  status: 'Connected',  color: 'emerald' },
            { name: 'Bol.com',  status: 'Connected',  color: 'emerald' },
            { name: 'Meta Ads', status: 'Syncing…',   color: 'amber'   },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-cream-50 rounded-lg">
              <div className="w-9 h-9 rounded-lg bg-white border border-warm-100 flex items-center justify-center">
                <Compass className="w-4 h-4 text-warm-700" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-warm-900">{s.name}</p>
                <p className={`text-xs ${
                  s.color === 'emerald' ? 'text-emerald-600' : 'text-amber-600'
                }`}>{s.status}</p>
              </div>
              <div className={`w-2 h-2 rounded-full ${
                s.color === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
              }`} />
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-warm-500 mt-4 pt-4 border-t border-warm-100">
          🔒 Read-only access · Cancel anytime
        </p>
      </div>
    );
  }

  if (variant === 'ai') {
    return (
      <div className="bg-white rounded-2xl border border-warm-100 shadow-lg p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-terra-500/10 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-terra-50 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-terra-600" />
            </div>
            <span className="text-xs font-medium text-warm-700">AI is generating…</span>
          </div>

          <div className="space-y-2">
            <div className="bg-cream-50 border border-warm-100 rounded-lg p-3">
              <p className="text-xs text-warm-500 mb-1">Product description</p>
              <p className="text-sm text-warm-900 leading-relaxed">
                Crafted from solid European oak by skilled hands in our Dutch workshop…
              </p>
            </div>
            <div className="bg-cream-50 border border-warm-100 rounded-lg p-3">
              <p className="text-xs text-warm-500 mb-1">Instagram caption</p>
              <p className="text-sm text-warm-900 leading-relaxed">
                A board that gets better with every dinner. ✨
              </p>
            </div>
            <div className="bg-cream-50 border border-warm-100 rounded-lg p-3">
              <p className="text-xs text-warm-500 mb-1">Ad headline</p>
              <p className="text-sm text-warm-900 leading-relaxed">
                The serving board everyone asks about
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // control
  return (
    <div className="bg-white rounded-2xl border border-warm-100 shadow-lg p-6">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-warm-100">
        <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
          <Check className="w-3.5 h-3.5 text-emerald-600" />
        </div>
        <span className="text-xs font-medium text-warm-700">Ready for review</span>
      </div>

      <div className="bg-cream-50 rounded-lg p-4 mb-4">
        <p className="text-sm text-warm-900 leading-relaxed mb-2">
          The serving board everyone asks about. Made by hand, made to last generations.
        </p>
        <p className="text-xs text-warm-500 italic">— Suggested ad copy</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button className="px-3 py-2 bg-warm-900 text-white text-xs font-medium rounded-lg">
          Approve
        </button>
        <button className="px-3 py-2 bg-cream-100 text-warm-700 text-xs font-medium rounded-lg border border-warm-100">
          Edit
        </button>
        <button className="px-3 py-2 bg-cream-100 text-warm-700 text-xs font-medium rounded-lg border border-warm-100">
          Regenerate
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// AI CONTENT STUDIO — main feature
// ════════════════════════════════════════════════════════════════

export function AIContentStudio() {
  const formats = [
    { icon: ImageIcon, label: 'Product photos',  desc: 'Studio-quality images from a single product shot' },
    { icon: Layers,    label: 'Social carousels', desc: '5-slide Instagram + TikTok posts in your tone' },
    { icon: MessageCircle, label: 'Captions',     desc: 'Short captions that actually feel human' },
    { icon: Wand2,     label: 'Product copy',     desc: 'Descriptions that convert, written for your brand' },
  ];

  return (
    <section id="features" className="bg-warm-900 py-24 sm:py-32 relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-br from-terra-500/20 to-transparent rounded-full blur-3xl" />

      <div className="max-w-6xl mx-auto px-6 relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">

          {/* Left — copy */}
          <div className="lg:sticky lg:top-24">
            <p className="text-xs uppercase tracking-[0.2em] text-terra-400 font-medium mb-4">
              Content Studio
            </p>
            <h2 className="font-serif-display text-4xl sm:text-5xl lg:text-6xl text-white leading-[1.1] tracking-tight mb-6">
              All your content,
              <br />
              <span className="italic text-terra-400">one click away.</span>
            </h2>
            <p className="text-warm-400 text-base sm:text-lg leading-relaxed mb-8 max-w-md">
              Connect your products. Pick a format. AI writes copy that sounds like you,
              creates images that fit your brand, and keeps everything in your voice.
            </p>

            <div className="space-y-4 mb-10">
              {formats.map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-warm-800 border border-warm-700 flex items-center justify-center flex-shrink-0">
                    <f.icon className="w-4 h-4 text-terra-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white mb-0.5">{f.label}</p>
                    <p className="text-xs text-warm-400">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/register"
              className="group inline-flex items-center gap-2 bg-terra-500 hover:bg-terra-600 text-white text-sm font-medium px-6 py-3 rounded-full transition-all"
            >
              Try Content Studio free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Right — visual demo */}
          <div className="space-y-4">
            {/* Mock 1: Instagram post */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
              <div className="aspect-square bg-gradient-to-br from-cream-100 via-terra-50 to-cream-200 flex items-center justify-center relative">
                <div className="text-center px-8">
                  <p className="font-serif-display text-3xl text-warm-900 italic mb-2">
                    Hand-crafted
                  </p>
                  <p className="font-serif-display text-3xl text-warm-900 mb-3">
                    in the Netherlands
                  </p>
                  <div className="w-16 h-px bg-terra-500 mx-auto" />
                </div>
                <div className="absolute bottom-4 right-4 px-2 py-1 bg-white/80 backdrop-blur rounded-md">
                  <p className="text-[9px] text-warm-700 font-medium">AI generated · 3 sec ago</p>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-warm-900 leading-relaxed">
                  Made by hand. Made to last. The serving board you'll pass down. ✨
                </p>
                <p className="text-xs text-brand-600 mt-2">
                  #handmade #dutchdesign #dinnertable #foodlover
                </p>
              </div>
            </div>

            {/* Mock 2: Generation panel */}
            <div className="bg-warm-800 border border-warm-700 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-terra-500/20 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-terra-400" />
                </div>
                <span className="text-sm font-medium text-white">Just generated</span>
              </div>

              <div className="space-y-2">
                <div className="bg-warm-900/50 rounded-lg p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-cream-100 flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="w-4 h-4 text-warm-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white font-medium">Holiday gift carousel</p>
                    <p className="text-xs text-warm-400">5 slides · Instagram</p>
                  </div>
                  <Check className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="bg-warm-900/50 rounded-lg p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-cream-100 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-4 h-4 text-warm-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white font-medium">TikTok hook script</p>
                    <p className="text-xs text-warm-400">15 sec · Vertical</p>
                  </div>
                  <Check className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="bg-warm-900/50 rounded-lg p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-cream-100 flex items-center justify-center flex-shrink-0">
                    <Wand2 className="w-4 h-4 text-warm-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white font-medium">SEO product description</p>
                    <p className="text-xs text-warm-400">240 words · NL + EN</p>
                  </div>
                  <Check className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════
// AI ADS — second main feature
// ════════════════════════════════════════════════════════════════

export function AIAds() {
  return (
    <section className="bg-cream py-24 sm:py-32 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">

          {/* Left — visual demo (5 ad concepts) */}
          <div className="order-2 lg:order-1 space-y-3">
            <div className="text-xs uppercase tracking-[0.2em] text-warm-500 font-medium mb-4 px-1">
              Sample campaign · 5 concepts
            </div>

            {[
              { angle: 'Lifestyle', headline: 'The board everyone asks about', cta: 'Shop now', tone: 'cream' },
              { angle: 'UGC',       headline: '"Best gift I\'ve ever given"',     cta: 'See reviews', tone: 'dark' },
              { angle: 'Promo',     headline: '20% off — this week only',         cta: 'Get yours',  tone: 'cream' },
              { angle: 'Pain point', headline: 'Done with cheap plastic boards?', cta: 'Upgrade',    tone: 'cream' },
              { angle: 'Social proof', headline: 'Joined by 1,200+ Dutch homes',  cta: 'Learn more', tone: 'cream' },
            ].map((ad, i) => (
              <div
                key={i}
                className={`rounded-xl p-4 flex items-center gap-4 border transition-all hover:scale-[1.01] ${
                  ad.tone === 'dark'
                    ? 'bg-warm-900 border-warm-800 text-white'
                    : 'bg-white border-warm-100 text-warm-900'
                }`}
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  ad.tone === 'dark' ? 'bg-terra-500/20' : 'bg-terra-50'
                }`}>
                  <span className={`text-[10px] font-medium uppercase tracking-wider ${
                    ad.tone === 'dark' ? 'text-terra-400' : 'text-terra-600'
                  }`}>
                    {ad.angle.slice(0, 3)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[10px] uppercase tracking-wider mb-0.5 ${
                    ad.tone === 'dark' ? 'text-warm-400' : 'text-warm-500'
                  }`}>
                    {ad.angle}
                  </p>
                  <p className="text-sm font-medium leading-snug">{ad.headline}</p>
                </div>
                <div className={`px-3 py-1.5 rounded-md text-xs font-medium flex-shrink-0 ${
                  ad.tone === 'dark' ? 'bg-white/10 text-white' : 'bg-cream-100 text-warm-900'
                }`}>
                  {ad.cta}
                </div>
              </div>
            ))}

            <div className="bg-terra-50 border border-terra-200 rounded-xl p-4 text-center">
              <p className="text-sm text-terra-600 font-medium">
                + 10 more variations ready to launch
              </p>
            </div>
          </div>

          {/* Right — copy */}
          <div className="order-1 lg:order-2">
            <p className="text-xs uppercase tracking-[0.2em] text-terra-600 font-medium mb-4">
              Meta Ad Studio
            </p>
            <h2 className="font-serif-display text-4xl sm:text-5xl lg:text-6xl text-warm-900 leading-[1.1] tracking-tight mb-6">
              15 fresh ad ideas.
              <br />
              <span className="italic text-terra-600">In one click.</span>
            </h2>
            <p className="text-warm-700 text-base sm:text-lg leading-relaxed mb-8 max-w-md">
              Tell us about your product. We generate 5 different angles, 3 hook variations each.
              All grounded in real product data — never made-up claims.
            </p>

            <ul className="space-y-3 mb-10">
              {[
                'Lifestyle, UGC, promo, social proof, pain point — all covered',
                'Built on Meta\'s 2026 best practices for the algorithm',
                'Review every ad before it goes live',
                'Push directly to your Meta account when ready',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-warm-700">
                  <div className="w-5 h-5 rounded-full bg-terra-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-terra-600" />
                  </div>
                  <span className="text-sm leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/register"
              className="group inline-flex items-center gap-2 bg-warm-900 hover:bg-warm-700 text-white text-sm font-medium px-6 py-3 rounded-full transition-all"
            >
              Generate your first campaign
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════
// PLATFORM BAR — works with
// ════════════════════════════════════════════════════════════════

export function PlatformBar() {
  const platforms = [
    { name: 'Shopify',  desc: 'Live'         },
    { name: 'Bol.com',  desc: 'Live'         },
    { name: 'Meta Ads', desc: 'Live'         },
    { name: 'Google Ads', desc: 'Live'       },
    { name: 'TikTok',   desc: 'Coming soon'  },
    { name: 'Amazon',   desc: 'Coming soon'  },
  ];

  return (
    <section className="bg-cream-100 py-16 border-y border-warm-100">
      <div className="max-w-5xl mx-auto px-6">
        <p className="text-center text-xs uppercase tracking-[0.2em] text-warm-500 font-medium mb-8">
          Plays nice with the tools you use
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {platforms.map(p => (
            <div
              key={p.name}
              className="bg-white border border-warm-100 rounded-xl px-4 py-5 text-center hover:shadow-md transition-shadow"
            >
              <p className="font-serif-display text-warm-900 text-base mb-1">{p.name}</p>
              <p className={`text-[10px] font-medium ${
                p.desc === 'Live' ? 'text-emerald-600' : 'text-warm-400'
              }`}>
                {p.desc === 'Live' ? '● Live' : '○ Coming soon'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════
// PRICING — €15 / €30 / €95
// ════════════════════════════════════════════════════════════════

const plans = [
  {
    slug: 'starter', name: 'Starter', price: 15,
    desc: 'For founders getting their first 100 customers.',
    features: [
      '1 connected store',
      '100 AI credits per month',
      'AI Content Studio',
      'Daily AI briefing',
      'Sales dashboard',
      'Email support',
    ],
    cta: 'Start free trial',
    popular: false,
  },
  {
    slug: 'growth', name: 'Growth', price: 30,
    desc: 'For stores ready to scale with paid ads.',
    features: [
      '3 connected stores',
      '2,000 AI credits per month',
      'Everything in Starter',
      'Meta Ad Studio',
      'Weekly opportunity engine',
      'Customer LTV tracking',
      'Priority support',
    ],
    cta: 'Start free trial',
    popular: true,
  },
  {
    slug: 'scale', name: 'Scale', price: 95,
    desc: 'For multi-store brands and small agencies.',
    features: [
      'Unlimited stores',
      'Unlimited AI credits',
      'Everything in Growth',
      'AI ad optimisation',
      'White-label dashboard',
      'Team accounts',
      'API access',
    ],
    cta: 'Start free trial',
    popular: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="bg-cream py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-6">

        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-xs uppercase tracking-[0.2em] text-terra-600 font-medium mb-4">
            Pricing
          </p>
          <h2 className="font-serif-display text-4xl sm:text-5xl text-warm-900 leading-tight tracking-tight mb-5">
            Honest pricing.
            <br />
            <span className="italic">No surprises.</span>
          </h2>
          <p className="text-warm-700 text-base sm:text-lg max-w-xl mx-auto">
            Start with 14 days free. No credit card needed.
            Cancel any time, keep what you generated.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div
              key={plan.slug}
              className={`relative rounded-3xl p-8 transition-all ${
                plan.popular
                  ? 'bg-warm-900 text-white border-2 border-terra-500 shadow-xl lg:scale-105'
                  : 'bg-white text-warm-900 border border-warm-100 shadow-sm hover:shadow-md'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="bg-terra-500 text-white text-[10px] uppercase tracking-[0.15em] font-semibold px-3 py-1 rounded-full">
                    Most popular
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-serif-display text-2xl mb-2">{plan.name}</h3>
                <p className={`text-sm leading-relaxed ${plan.popular ? 'text-warm-400' : 'text-warm-500'}`}>
                  {plan.desc}
                </p>
              </div>

              <div className="mb-6 pb-6 border-b border-warm-100/20">
                <div className="flex items-baseline gap-1">
                  <span className="font-serif-display text-5xl font-500">€{plan.price}</span>
                  <span className={`text-sm ${plan.popular ? 'text-warm-400' : 'text-warm-500'}`}>
                    /month
                  </span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      plan.popular ? 'text-terra-400' : 'text-terra-600'
                    }`} />
                    <span className={plan.popular ? 'text-warm-300' : 'text-warm-700'}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={`/register?plan=${plan.slug}`}
                className={`block text-center font-medium px-6 py-3 rounded-full transition-all ${
                  plan.popular
                    ? 'bg-terra-500 hover:bg-terra-600 text-white'
                    : 'bg-warm-900 hover:bg-warm-700 text-white'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-warm-500 mt-10">
          All plans include 14 days free · No credit card · Cancel anytime
        </p>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════
// FAQ
// ════════════════════════════════════════════════════════════════

const faqs = [
  {
    q: 'Do I need any technical skills?',
    a: 'No. If you can run a Shopify or Bol.com store, you can use MarketGrow. Setup takes under 2 minutes — connect your store and you\'re done. No code, no APIs to configure, no developer needed.',
  },
  {
    q: 'What happens during the 14-day free trial?',
    a: 'You get full access to everything in your chosen plan. No credit card required upfront. After 14 days, you decide whether to continue. If you cancel, all the content you generated stays yours.',
  },
  {
    q: 'How is this different from ChatGPT?',
    a: 'ChatGPT is a generalist. MarketGrow is built specifically for ecommerce — connected to your real product data, sales, and ad account. It writes ad copy that knows your bestsellers, generates social posts that match your brand voice, and creates content grounded in what actually works for your store.',
  },
  {
    q: 'Will the AI publish ads automatically?',
    a: 'Never without your approval. We generate ad concepts, copy, and creatives — you review and approve each one before it goes live. We make work easier, not autonomous. You stay in full control.',
  },
  {
    q: 'What if I want to cancel?',
    a: 'Cancel anytime from your dashboard. No phone calls, no retention scripts, no "just one more question." Your account closes at the end of your billing period and we delete your data on request.',
  },
  {
    q: 'Is my store data safe?',
    a: 'Yes. We use read-only access where possible (we never modify your products or ads without permission). Data is encrypted at rest with AES-256, and we\'re GDPR-compliant. You can export or delete your data at any time.',
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-cream-100 py-24 sm:py-32">
      <div className="max-w-3xl mx-auto px-6">

        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.2em] text-terra-600 font-medium mb-4">
            Questions
          </p>
          <h2 className="font-serif-display text-4xl sm:text-5xl text-warm-900 leading-tight tracking-tight">
            Everything you might be <span className="italic">wondering</span>.
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                open === i ? 'border-terra-200 shadow-sm' : 'border-warm-100'
              }`}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left"
              >
                <span className="font-serif-display text-lg text-warm-900 leading-snug">
                  {faq.q}
                </span>
                <div className="w-7 h-7 rounded-full bg-cream-100 flex items-center justify-center flex-shrink-0">
                  {open === i ? (
                    <Minus className="w-3.5 h-3.5 text-warm-700" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-warm-700" />
                  )}
                </div>
              </button>
              {open === i && (
                <div className="px-6 pb-5 text-warm-700 text-sm leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════
// CTA — final push
// ════════════════════════════════════════════════════════════════

export function CTA() {
  return (
    <section className="bg-warm-900 py-24 sm:py-32 relative overflow-hidden">
      {/* Warm gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-terra-500/15 via-transparent to-transparent rounded-full blur-3xl" />

      <div className="max-w-3xl mx-auto px-6 text-center relative">
        <p className="text-xs uppercase tracking-[0.2em] text-terra-400 font-medium mb-6">
          Let's grow together
        </p>
        <h2 className="font-serif-display text-4xl sm:text-5xl lg:text-6xl text-white leading-[1.1] tracking-tight mb-6">
          Your store deserves
          <br />
          <span className="italic text-terra-400">more than guesswork.</span>
        </h2>
        <p className="text-warm-400 text-lg leading-relaxed mb-10 max-w-xl mx-auto">
          14 days free. No credit card. We help you grow,
          even if you don't know where to start.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <Link
            href="/register"
            className="group flex items-center gap-2 bg-terra-500 hover:bg-terra-600 text-white font-medium px-7 py-3.5 rounded-full transition-all shadow-lg text-sm"
          >
            Start free trial
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 text-warm-400 hover:text-white text-sm font-medium underline-offset-4 hover:underline transition-colors"
          >
            See pricing
          </a>
        </div>

        <p className="text-warm-500 text-xs">
          Built by ecommerce founders, for ecommerce founders.
        </p>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════
// FOOTER
// ════════════════════════════════════════════════════════════════

export function Footer() {
  const cols = [
    {
      title: 'Product',
      links: [
        { label: 'How it works', href: '/#how' },
        { label: 'Features',     href: '/#features' },
        { label: 'Pricing',      href: '/#pricing' },
        { label: 'FAQ',          href: '/#faq' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About',   href: '#' },
        { label: 'Blog',    href: '/blog' },
        { label: 'Contact', href: 'mailto:hello@marketgrow.ai' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy', href: '/privacy' },
        { label: 'Terms',   href: '/terms' },
        { label: 'Security', href: '/privacy' },
      ],
    },
  ];

  return (
    <footer className="bg-warm-900 text-warm-400 pt-16 pb-8 border-t border-warm-800">
      <div className="max-w-6xl mx-auto px-6">

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12 pb-12 border-b border-warm-800">
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 text-white mb-4">
              <div className="w-8 h-8 rounded-xl bg-warm-800 flex items-center justify-center">
                <Zap className="w-4 h-4 text-terra-400" fill="currentColor" />
              </div>
              <span className="font-serif-display font-600 text-xl">MarketGrow</span>
            </Link>
            <p className="text-sm leading-relaxed text-warm-400 max-w-xs">
              The AI co-pilot for ecommerce founders.
              We help you grow, even if you don't know where to start.
            </p>
          </div>

          {cols.map(col => (
            <div key={col.title}>
              <h4 className="text-white font-medium text-sm mb-4">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map(l => (
                  <li key={l.label}>
                    <a href={l.href} className="text-sm text-warm-400 hover:text-white transition-colors">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-warm-500">
          <p>© {new Date().getFullYear()} MarketGrow. Made with care for ecommerce founders.</p>
          <p className="font-serif-display italic">hello@marketgrow.ai</p>
        </div>
      </div>
    </footer>
  );
}

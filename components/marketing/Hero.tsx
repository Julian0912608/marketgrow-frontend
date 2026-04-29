'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles, Check } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center bg-cream pt-16 overflow-hidden">

      {/* Warm gradient mesh background */}
      <div className="absolute inset-0 mesh-warm pointer-events-none" />

      {/* Decorative elements */}
      <div className="absolute top-32 left-8 w-2 h-2 rounded-full bg-terra-500 opacity-60" />
      <div className="absolute top-48 right-16 w-3 h-3 rounded-full bg-brand-600 opacity-30" />
      <div className="absolute bottom-32 left-1/4 w-2 h-2 rounded-full bg-terra-500 opacity-40" />

      <div className="relative max-w-6xl mx-auto px-6 py-20 lg:py-32 w-full">

        {/* Header pill */}
        <div className="flex justify-center mb-12 animate-fade-up">
          <div className="inline-flex items-center gap-2.5 bg-white/70 backdrop-blur border border-warm-200 text-warm-700 text-xs font-medium px-4 py-2 rounded-full shadow-sm">
            <Sparkles className="w-3 h-3 text-terra-500" />
            <span>For ecommerce founders just getting started</span>
          </div>
        </div>

        {/* Headline — editorial style */}
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="font-serif-display text-5xl sm:text-6xl lg:text-[5.5rem] font-500 text-warm-900 leading-[1.05] tracking-tight mb-8 text-balance animate-fade-up animate-delay-100">
            Stop guessing what to post.
            <br />
            <span className="italic font-400 text-terra-600">Start growing</span>
            <span className="text-warm-900"> your store.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-warm-500 leading-relaxed mb-12 text-balance animate-fade-up animate-delay-200">
            The AI co-pilot that creates your ads, posts, and product content —
            so you can focus on what matters: selling more.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 animate-fade-up animate-delay-300">
            <Link
              href="/register"
              className="group flex items-center gap-2 bg-warm-900 hover:bg-warm-700 text-white font-medium px-7 py-3.5 rounded-full transition-all shadow-lg shadow-warm-900/20 text-sm"
            >
              Start free 14-day trial
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a
              href="#how"
              className="inline-flex items-center gap-2 text-warm-700 hover:text-warm-900 text-sm font-medium underline-offset-4 hover:underline transition-colors"
            >
              See how it works
            </a>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mb-16 animate-fade-up animate-delay-400">
            {[
              'No credit card required',
              'Setup in under 2 minutes',
              'Cancel anytime',
            ].map(t => (
              <div key={t} className="flex items-center gap-1.5 text-xs text-warm-500">
                <Check className="w-3.5 h-3.5 text-terra-500" />
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard preview — softly framed */}
        <div className="relative max-w-5xl mx-auto animate-fade-up animate-delay-500">
          <div className="absolute -inset-4 bg-gradient-to-br from-terra-500/10 via-transparent to-brand-600/10 rounded-3xl blur-xl" />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-warm-100 overflow-hidden">

            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-warm-100 bg-cream-50">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-300" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-300" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <div className="ml-3 flex-1 max-w-xs flex items-center gap-2 bg-white rounded-md h-6 px-3 border border-warm-100">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <p className="text-[10px] text-warm-500">app.marketgrow.ai</p>
              </div>
            </div>

            {/* Mock dashboard content */}
            <div className="p-6 sm:p-8 bg-white">

              {/* Welcome strip */}
              <div className="flex items-start justify-between mb-6 pb-6 border-b border-warm-100">
                <div>
                  <p className="font-serif-display text-2xl sm:text-3xl text-warm-900 mb-1">
                    Good morning, Sarah ✨
                  </p>
                  <p className="text-sm text-warm-500">
                    Here are 3 things to grow your store today
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-medium text-emerald-700">All systems synced</span>
                </div>
              </div>

              {/* Action cards grid */}
              <div className="grid sm:grid-cols-3 gap-4">

                {/* Card 1 */}
                <div className="bg-cream-50 border border-warm-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-terra-50 flex items-center justify-center">
                      <span className="text-base">📸</span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-warm-500 font-medium">Today's content</span>
                  </div>
                  <p className="text-sm font-medium text-warm-900 leading-snug mb-3">
                    Instagram carousel ready for "Winter Collection"
                  </p>
                  <div className="flex items-center gap-1 text-xs text-terra-600 font-medium">
                    <span>Review & post</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>

                {/* Card 2 — accent */}
                <div className="bg-warm-900 rounded-xl p-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-terra-500/20 rounded-full blur-2xl" />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-terra-500/20 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-terra-400" />
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-warm-400 font-medium">Ad campaign</span>
                    </div>
                    <p className="text-sm font-medium text-white leading-snug mb-3">
                      5 fresh creatives for your bestseller
                    </p>
                    <div className="flex items-center gap-1 text-xs text-terra-400 font-medium">
                      <span>Generate now</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>

                {/* Card 3 */}
                <div className="bg-cream-50 border border-warm-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center">
                      <span className="text-base">📈</span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-warm-500 font-medium">Quick win</span>
                  </div>
                  <p className="text-sm font-medium text-warm-900 leading-snug mb-3">
                    Update product description for #1 seller
                  </p>
                  <div className="flex items-center gap-1 text-xs text-brand-600 font-medium">
                    <span>See suggestion</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>

              </div>

              {/* Bottom strip */}
              <div className="mt-6 pt-6 border-t border-warm-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4 text-xs text-warm-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    24 orders today
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                    €1,847 revenue
                  </span>
                </div>
                <span className="text-[10px] text-warm-400 italic">
                  Updated 2 minutes ago
                </span>
              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

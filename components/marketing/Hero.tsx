'use client';

import Link from 'next/link';
import { ArrowRight, Play, Check } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center bg-gradient-to-b from-slate-50 to-white pt-16 overflow-hidden">
      <div className="absolute top-32 left-1/4 w-96 h-96 bg-brand-200/40 rounded-full blur-3xl" />
      <div className="absolute bottom-32 right-1/4 w-72 h-72 bg-sky-200/30 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-6 py-24 text-center">

        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-4 py-2 rounded-full mb-8">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          For ecommerce founders just getting started
        </div>

        <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-800 text-slate-900 leading-[1.05] tracking-tight mb-6 text-balance">
          Stop guessing what to post.
          <span className="block text-brand-600">Start growing your store.</span>
        </h1>

        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-500 leading-relaxed mb-10 text-balance">
          The AI co-pilot that creates your ads, posts, and product content —
          so you can focus on what matters: selling more.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <Link
            href="/register"
            className="group flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-8 py-4 rounded-xl transition-all shadow-lg text-sm"
          >
            Start your free 14-day trial
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#how"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
          >
            <div className="w-8 h-8 rounded-full border border-slate-200 bg-white shadow-sm flex items-center justify-center">
              <Play className="w-3 h-3 fill-slate-500 text-slate-500 ml-0.5" />
            </div>
            See how it works
          </a>
        </div>

        {/* Trust signals */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-20">
          {[
            'No credit card required',
            'Setup in under 2 minutes',
            'Cancel anytime',
          ].map(t => (
            <div key={t} className="flex items-center gap-1.5 text-xs text-slate-400">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              {t}
            </div>
          ))}
        </div>

        {/* Mock dashboard preview */}
        <div className="relative max-w-5xl mx-auto">
          <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/50">
              <div className="w-3 h-3 rounded-full bg-rose-500/60" />
              <div className="w-3 h-3 rounded-full bg-amber-500/60" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
              <div className="ml-4 flex-1 bg-slate-800 rounded-md h-6 max-w-xs" />
            </div>

            <div className="p-6 sm:p-8">
              <div className="flex items-start justify-between mb-6 pb-6 border-b border-slate-800">
                <div className="text-left">
                  <p className="font-display text-2xl sm:text-3xl text-white mb-1">
                    Good morning, Sarah ✨
                  </p>
                  <p className="text-sm text-slate-400">
                    Here are 3 things to grow your store today
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-medium text-emerald-300">All systems synced</span>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 text-left">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-pink-500/20 flex items-center justify-center">
                      <span className="text-base">📸</span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Today's content</span>
                  </div>
                  <p className="text-sm font-medium text-white leading-snug mb-3">
                    Instagram carousel ready for "Winter Collection"
                  </p>
                  <div className="flex items-center gap-1 text-xs text-pink-400 font-medium">
                    <span>Review & post</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-brand-600/20 to-purple-600/20 border border-brand-500/30 rounded-xl p-4 relative overflow-hidden">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-brand-500/30 flex items-center justify-center">
                      <span className="text-base">⚡</span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-brand-300 font-medium">Ad campaign</span>
                  </div>
                  <p className="text-sm font-medium text-white leading-snug mb-3">
                    5 fresh creatives for your bestseller
                  </p>
                  <div className="flex items-center gap-1 text-xs text-brand-300 font-medium">
                    <span>Generate now</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <span className="text-base">📈</span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Quick win</span>
                  </div>
                  <p className="text-sm font-medium text-white leading-snug mb-3">
                    Update product description for #1 seller
                  </p>
                  <div className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                    <span>See suggestion</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    24 orders today
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                    €1,847 revenue
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">
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

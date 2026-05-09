'use client';

// ============================================================
// app/dashboard/setup/page.tsx
//
// /dashboard/setup
// Polling page tijdens Day Zero AI setup (15 minuten).
// Master Plan v3.1: friendly progress UI met educational microcopy.
//
// Flow:
//   - Mount: poll GET /day-zero/status elke 3 seconden
//   - status 'completed' -> redirect /dashboard
//   - status 'failed'    -> toon error, knop terug naar dashboard
//   - status 404         -> redirect /dashboard (geen actieve job)
//
// Standalone donker thema (geen DashboardLayout sidebar). Brand: sky blue.
// ============================================================

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

const POLL_INTERVAL_MS = 3000;

const STAGE_LABELS: Record<number, string> = {
  0: 'Preparing your AI',
  1: 'Reading your store data',
  2: 'Learning your brand voice',
  3: 'Spotting patterns in your sales',
  4: 'Drafting your baseline marketing plan',
  5: 'Finalizing your AI memory',
};

const EDUCATIONAL_FACTS = [
  'The average ecom founder checks 5 different dashboards per morning. Tomorrow, you check one.',
  'Most marketing agencies take 4 to 6 weeks to deliver what your AI is building right now.',
  'MarketGrow remembers everything: your patterns, your wins, your customers. So you can stop remembering.',
  'The first 90 days decide whether a new shop ever scales. You just bought yourself an unfair advantage.',
  'Your daily briefing tomorrow at 7:00 will be the first one ever written for your shop specifically.',
];

interface StatusDTO {
  status:             'pending' | 'running' | 'completed' | 'failed';
  current_stage:      number;
  current_stage_name: string;
  progress_percent:   number;
  eta_seconds:        number | null;
  started_at:         string | null;
  completed_at:       string | null;
  error_message:      string | null;
}

export default function DayZeroSetupPage() {
  const router = useRouter();

  const [status, setStatus] = useState<StatusDTO | null>(null);
  const [factIndex, setFactIndex] = useState<number>(0);
  const [networkError, setNetworkError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get<StatusDTO>('/day-zero/status');
      setStatus(res.data);
      setNetworkError(null);

      if (res.data.status === 'completed') {
        // 1.2s pauze zodat 100% bar even zichtbaar wordt
        setTimeout(() => router.replace('/dashboard'), 1200);
      }
    } catch (err: any) {
      if (err?.response?.status === 404) {
        // Geen actieve job: gewoon door naar dashboard
        router.replace('/dashboard');
        return;
      }
      setNetworkError(err?.message ?? 'Network error');
    }
  }, [router]);

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchStatus]);

  useEffect(() => {
    const id = setInterval(() => {
      setFactIndex((i) => (i + 1) % EDUCATIONAL_FACTS.length);
    }, 8000);
    return () => clearInterval(id);
  }, []);

  const isFailed   = status?.status === 'failed';
  const stageLabel = status ? (STAGE_LABELS[status.current_stage] ?? status.current_stage_name) : 'Starting up';
  const progress   = status?.progress_percent ?? 0;
  const etaText    = formatEta(status?.eta_seconds);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">

      {/* Header */}
      <header className="border-b border-slate-800/60">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-2 font-display font-700 text-lg text-white">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" fill="white" />
            </div>
            MarketGrow
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">

          <div className="mb-10 text-center">
            <p className="text-xs font-semibold tracking-wider text-brand-400 uppercase mb-3">
              Day Zero AI Setup
            </p>
            <h1 className="font-display font-800 text-3xl sm:text-4xl text-white mb-3">
              {isFailed ? 'Something went wrong' : 'Your AI is getting to know your shop'}
            </h1>
            <p className="text-slate-400 text-base max-w-xl mx-auto">
              {isFailed
                ? 'We hit a snag during setup. Our team has been notified.'
                : 'This takes about 15 minutes. You can leave this page open or come back later.'}
            </p>
          </div>

          {/* Progress card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm">

            {!isFailed && (
              <>
                <div className="flex items-baseline justify-between mb-3">
                  <p className="text-sm font-medium text-slate-200">{stageLabel}</p>
                  <p className="text-sm font-mono text-brand-400">{progress}%</p>
                </div>

                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-700 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <p className="text-xs text-slate-500 mt-4">
                  {etaText}
                </p>
              </>
            )}

            {isFailed && (
              <div className="text-center py-2">
                <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="w-5 h-5 text-rose-400" />
                </div>
                <p className="text-sm text-slate-300 mb-2">
                  {status?.error_message ?? 'Unknown error during setup.'}
                </p>
                <p className="text-sm text-slate-400">
                  Reach out to{' '}
                  <a href="mailto:hello@marketgrow.ai" className="text-brand-400 hover:text-brand-300">
                    hello@marketgrow.ai
                  </a>
                  {' '}and we will resolve this together.
                </p>
                <button
                  onClick={() => router.replace('/dashboard')}
                  className="mt-6 inline-flex items-center px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-medium text-white transition-colors"
                >
                  Continue to dashboard
                </button>
              </div>
            )}
          </div>

          {/* Educational fact */}
          {!isFailed && (
            <div className="mt-8 px-6 py-5 bg-slate-900/40 border border-slate-800/60 rounded-xl">
              <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase mb-2">
                Did you know
              </p>
              <p
                key={factIndex}
                className="text-sm text-slate-300 leading-relaxed animate-fade-in"
              >
                {EDUCATIONAL_FACTS[factIndex]}
              </p>
            </div>
          )}

          {networkError && (
            <p className="mt-4 text-xs text-amber-500/80 text-center">
              Reconnecting to status updates...
            </p>
          )}
        </div>
      </main>

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.6s ease-in;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function formatEta(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return '';
  if (seconds <= 0) return 'Almost there...';
  const mins = Math.ceil(seconds / 60);
  if (mins === 1) return 'About 1 minute remaining';
  return `About ${mins} minutes remaining`;
}

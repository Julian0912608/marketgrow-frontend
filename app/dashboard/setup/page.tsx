'use client';

// ============================================================
// app/dashboard/setup/page.tsx
//
// /dashboard/setup
// Polling page tijdens Day Zero AI setup (15 minuten).
// Master Plan v3.1: friendly progress UI met educational microcopy.
//
// Gedrag:
//   - Polled GET /api/day-zero/status elke 3 seconden
//   - Status 'completed' -> redirect naar /dashboard
//   - Status 'failed'    -> toon error met support contact
//   - Status 404         -> redirect naar /dashboard (geen actieve job)
//
// Engelstalig (platform conventie). Brand: indigo + dark slate.
// ============================================================

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const API_STATUS_URL = '/api/day-zero/status';
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
  'The average ecom founder checks 5 different dashboards per morning. Tomorrow, you will check one.',
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

  // ----- Polling -----
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(API_STATUS_URL, {
        credentials: 'include',
        cache:       'no-store',
      });

      if (res.status === 404) {
        // Geen actieve job, niets te tonen.
        router.replace('/dashboard');
        return;
      }
      if (!res.ok) {
        throw new Error(`Status ${res.status}`);
      }

      const dto = (await res.json()) as StatusDTO;
      setStatus(dto);
      setNetworkError(null);

      if (dto.status === 'completed') {
        // Korte vertraging zodat de 100% bar zichtbaar wordt
        setTimeout(() => router.replace('/dashboard'), 1200);
      }
    } catch (err) {
      setNetworkError((err as Error).message);
    }
  }, [router]);

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchStatus]);

  // ----- Fact rotator -----
  useEffect(() => {
    const id = setInterval(() => {
      setFactIndex((i) => (i + 1) % EDUCATIONAL_FACTS.length);
    }, 8000);
    return () => clearInterval(id);
  }, []);

  // ----- Render -----
  const isFailed = status?.status === 'failed';
  const stageLabel = status ? STAGE_LABELS[status.current_stage] ?? status.current_stage_name : 'Starting up';
  const progress = status?.progress_percent ?? 0;
  const etaText = formatEta(status?.eta_seconds);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold tracking-wider text-indigo-400 uppercase mb-3">
            Day Zero AI Setup
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            {isFailed ? 'Something went wrong' : 'Your AI is getting to know your shop'}
          </h1>
          <p className="text-slate-400 text-base">
            {isFailed
              ? 'We hit a snag during setup. Our team has been notified.'
              : 'This takes about 15 minutes. You can leave this page open or come back later.'}
          </p>
        </div>

        {/* Progress card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">

          {!isFailed && (
            <>
              <div className="flex items-baseline justify-between mb-3">
                <p className="text-sm font-medium text-slate-300">{stageLabel}</p>
                <p className="text-sm font-mono text-indigo-400">{progress}%</p>
              </div>

              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="text-xs text-slate-500 mt-4">
                {etaText}
              </p>
            </>
          )}

          {isFailed && (
            <div className="text-center py-4">
              <p className="text-sm text-slate-300 mb-2">
                {status?.error_message ?? 'Unknown error during setup.'}
              </p>
              <p className="text-sm text-slate-400">
                Reach out to <a href="mailto:hello@marketgrow.ai" className="text-indigo-400 hover:underline">hello@marketgrow.ai</a> and we will resolve this together.
              </p>
              <button
                onClick={() => router.replace('/dashboard')}
                className="mt-6 inline-flex items-center px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-white transition-colors"
              >
                Continue to dashboard
              </button>
            </div>
          )}
        </div>

        {/* Educational fact */}
        {!isFailed && (
          <div className="mt-8 px-6 py-5 bg-slate-900/50 border border-slate-800/60 rounded-xl">
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

        {/* Network error toast (non-blocking) */}
        {networkError && (
          <p className="mt-4 text-xs text-amber-500/80 text-center">
            Reconnecting to status updates...
          </p>
        )}
      </div>

      {/* Local fade-in animation. Voeg ook globaal toe als je wilt. */}
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

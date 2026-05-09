'use client';

// ============================================================
// app/onboarding/page.tsx
//
// V0 Gap 2: 4-stappen onboarding wizard.
// Vervangt de oude plan/payment/shop flow volledig.
//
// Flow:
//   - Mount: GET /onboarding/state. Already completed/skipped: redirect.
//   - Step 1 (forced): country + sells_to.
//   - Step 2 (skipbaar all-or-nothing): business goal.
//   - Step 3 (skipbaar all-or-nothing): marketing style.
//   - Step 4 (skipbaar): connect first store.
//
// Skip vanaf step 2 markeert status='skipped' en gaat naar /dashboard.
// User kan later in Settings de open velden invullen.
// ============================================================

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Step1Country } from './components/Step1Country';
import { Step2Goal } from './components/Step2Goal';
import { Step3Marketing } from './components/Step3Marketing';
import { Step4Store } from './components/Step4Store';

interface OnboardingStateResponse {
  status:           'in_progress' | 'skipped' | 'completed';
  step:             1 | 2 | 3 | 4;
  countryCode:      string | null;
  sellsToCountries: string[] | null;
  businessGoal:     string | null;
  marketingStyle:   string | null;
  shopConnected:    boolean;
  completedAt:      string | null;
}

const STEP_TITLES: Record<number, string> = {
  1: 'Where you sell',
  2: 'Your business goal',
  3: 'Your marketing style',
  4: 'Connect your first store',
};

export default function OnboardingPage() {
  const router = useRouter();
  const [state, setState] = useState<OnboardingStateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<OnboardingStateResponse>('/onboarding/state');
        if (cancelled) return;
        if (res.data.status !== 'in_progress') {
          router.replace('/dashboard');
          return;
        }
        setState(res.data);
      } catch (e: any) {
        setError(e?.response?.data?.message ?? 'Could not load setup state.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  const advanceTo = (step: 2 | 3 | 4) => {
    setState(s => s ? { ...s, step } : s);
  };

  const handleSkip = async () => {
    if (!state || state.step < 2) return;
    setLoading(true);
    try {
      await api.post('/onboarding/skip');
      router.replace('/dashboard');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Could not skip setup.');
      setLoading(false);
    }
  };

  const handleComplete = () => {
    router.replace('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <p className="text-rose-600 text-sm mb-4">{error || 'Something went wrong.'}</p>
          <button onClick={() => window.location.reload()}
            className="text-brand-600 text-sm font-semibold hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 font-display font-700 text-lg text-slate-900">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" fill="white" />
            </div>
            MarketGrow
          </Link>

          {state.step >= 2 && (
            <button onClick={handleSkip}
              className="text-sm text-slate-500 hover:text-slate-700 font-medium"
            >
              Skip and finish later
            </button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8">
          <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-2">
            Step {state.step} of 4
          </p>
          <h1 className="font-display text-2xl md:text-3xl font-800 text-slate-900 mb-1">
            {STEP_TITLES[state.step]}
          </h1>
          <div className="flex gap-1 mt-4">
            {[1, 2, 3, 4].map(n => (
              <div key={n}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  n <= state.step ? 'bg-brand-600' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
          {state.step === 1 && (
            <Step1Country initial={{
                countryCode:      state.countryCode,
                sellsToCountries: state.sellsToCountries,
              }}
              onCompleted={() => advanceTo(2)}
            />
          )}
          {state.step === 2 && (
            <Step2Goal initial={state.businessGoal}
              onCompleted={() => advanceTo(3)}
            />
          )}
          {state.step === 3 && (
            <Step3Marketing initial={state.marketingStyle}
              onCompleted={() => advanceTo(4)}
            />
          )}
          {state.step === 4 && (
            <Step4Store countryCode={state.countryCode!}
              onCompleted={handleComplete}
            />
          )}
        </div>
      </main>
    </div>
  );
}

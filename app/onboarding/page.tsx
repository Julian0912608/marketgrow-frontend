'use client';

// ============================================================
// app/onboarding/page.tsx
//
// V0 Gap 2: 4-stappen onboarding wizard.
// V0 Gap 3 update: na complete met shopConnected=true redirecten
// we naar /dashboard/setup (Day Zero polling page) ipv /dashboard.
// V0 Gap 7 (16 mei 2026): plan keuze toegevoegd als visuele step 4.
// Backend DB step blijft 1-4, visuele wizard heeft 5 stappen.
//
// Visuele step mapping:
//   DB step 1 -> UI step 1: Where you sell
//   DB step 2 -> UI step 2: Your business goal
//   DB step 3 -> UI step 3: Your marketing style
//   DB step 4 + geen subscription -> UI step 4: Pick a plan
//   DB step 4 + subscription      -> UI step 5: Connect your store
//
// Stripe checkout flow:
//   Step 4 click -> POST /billing/checkout -> redirect Stripe URL
//   Stripe success -> /onboarding?session_id=X
//   We detecten session_id, pollen /state elke 1.5s tot
//   hasActiveSubscription=true (max ~15s) en gaan dan UI step 5.
//   Stripe cancel -> /onboarding zonder session_id, blijft Step4Plan.
//
// Skip-knop alleen op visuele step 2, 3 en 5. Niet op 4 want
// plan keuze is verplicht (Gap 7 beslissing).
//
// handleComplete redirect:
//   shopConnected=true  -> /dashboard/setup (Day Zero polling)
//   shopConnected=false -> /dashboard
// ============================================================

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Zap, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Step1Country } from './components/Step1Country';
import { Step2Goal } from './components/Step2Goal';
import { Step3Marketing } from './components/Step3Marketing';
import { Step4Plan } from './components/Step4Plan';
import { Step4Store } from './components/Step4Store';

interface OnboardingStateResponse {
  status:                'in_progress' | 'skipped' | 'completed';
  step:                  1 | 2 | 3 | 4;
  countryCode:           string | null;
  sellsToCountries:      string[] | null;
  businessGoal:          string | null;
  marketingStyle:        string | null;
  shopConnected:         boolean;
  hasActiveSubscription: boolean;
  completedAt:           string | null;
}

const STEP_TITLES: Record<number, string> = {
  1: 'Where you sell',
  2: 'Your business goal',
  3: 'Your marketing style',
  4: 'Pick a plan',
  5: 'Connect your first store',
};

const TOTAL_STEPS = 5;
const POLL_INTERVAL_MS = 1500;
const POLL_MAX_ATTEMPTS = 10;

function computeVisualStep(state: OnboardingStateResponse): 1 | 2 | 3 | 4 | 5 {
  if (state.step < 4) return state.step;
  return state.hasActiveSubscription ? 5 : 4;
}

function PageLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <OnboardingPageInner />
    </Suspense>
  );
}

function OnboardingPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<OnboardingStateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState('');
  const pollAttemptsRef = useRef(0);

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

        // Stripe checkout callback: poll until webhook landed.
        const sessionId = searchParams.get('session_id');
        if (sessionId && !res.data.hasActiveSubscription) {
          setPolling(true);
          pollAttemptsRef.current = 0;
          await pollForSubscription();
        }
      } catch (e: any) {
        setError(e?.response?.data?.message ?? 'Could not load setup state.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const pollForSubscription = async () => {
    while (pollAttemptsRef.current < POLL_MAX_ATTEMPTS) {
      pollAttemptsRef.current += 1;
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));

      try {
        const res = await api.get<OnboardingStateResponse>('/onboarding/state');
        if (res.data.hasActiveSubscription) {
          setState(res.data);
          setPolling(false);
          router.replace('/onboarding');
          return;
        }
      } catch {
        // Continue polling on transient errors
      }
    }

    setPolling(false);
    setError('Checkout is still being processed. Please refresh in a moment, or contact support if this persists.');
  };

  const advanceTo = (step: 2 | 3 | 4) => {
    setState(s => s ? { ...s, step } : s);
  };

  const handleSkip = async () => {
    if (!state) return;
    const visualStep = computeVisualStep(state);
    if (visualStep === 1 || visualStep === 4) return;

    setLoading(true);
    try {
      await api.post('/onboarding/skip');
      router.replace('/dashboard');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Could not skip setup.');
      setLoading(false);
    }
  };

  const handleComplete = (shopConnected: boolean) => {
    if (shopConnected) {
      router.replace('/dashboard/setup');
    } else {
      router.replace('/dashboard');
    }
  };

  if (loading) {
    return <PageLoading />;
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

  const visualStep = computeVisualStep(state);
  const canSkip = visualStep === 2 || visualStep === 3 || visualStep === 5;

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

          {canSkip && (
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
            Step {visualStep} of {TOTAL_STEPS}
          </p>
          <h1 className="font-display text-2xl md:text-3xl font-800 text-slate-900 mb-1">
            {STEP_TITLES[visualStep]}
          </h1>
          <div className="flex gap-1 mt-4">
            {[1, 2, 3, 4, 5].map(n => (
              <div key={n}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  n <= visualStep ? 'bg-brand-600' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
          {polling ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-brand-600 mb-4" />
              <p className="text-base font-semibold text-slate-900 mb-1">
                Activating your subscription
              </p>
              <p className="text-sm text-slate-500">
                This usually takes a few seconds. We are confirming your payment with Stripe.
              </p>
            </div>
          ) : (
            <>
              {visualStep === 1 && (
                <Step1Country initial={{
                    countryCode:      state.countryCode,
                    sellsToCountries: state.sellsToCountries,
                  }}
                  onCompleted={() => advanceTo(2)}
                />
              )}
              {visualStep === 2 && (
                <Step2Goal initial={state.businessGoal}
                  onCompleted={() => advanceTo(3)}
                />
              )}
              {visualStep === 3 && (
                <Step3Marketing initial={state.marketingStyle}
                  onCompleted={() => advanceTo(4)}
                />
              )}
              {visualStep === 4 && (
                <Step4Plan />
              )}
              {visualStep === 5 && (
                <Step4Store countryCode={state.countryCode!}
                  onCompleted={handleComplete}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

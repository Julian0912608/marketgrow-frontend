'use client';

// components/dashboard/OnboardingChecklist.tsx
//
// Smart onboarding checklist: gebruikt props (hasStores, planSlug) van het
// dashboard om de echte state af te leiden, ipv puur op backend completedSteps
// te vertrouwen (die kan stale of incompleet zijn).
//
// Hide rules:
//   1. Gebruiker heeft minstens 1 store geconnect: hide volledig (past onboarding)
//   2. localStorage.onboarding_dismissed = true: hide volledig
//   3. Alle 4 stappen done: hide volledig
//
// Step detection (via props, niet backend):
//   - account_created: altijd done
//   - payment_completed: done als planSlug niet 'starter' is
//   - shop_connected: done als hasStores
//   - first_insight: alleen uit backend completedSteps
//
// Backend call is best-effort, faalt silent. Component werkt ook zonder.

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronRight, X, Zap } from 'lucide-react';
import { api } from '@/lib/api';

interface OnboardingState {
  completedSteps: string[];
  status:         string;
}

interface Props {
  hasStores: boolean;
  planSlug:  string;
}

const STEPS = [
  {
    id:          'account_created',
    label:       'Account created',
    description: 'You are registered and logged in.',
    href:        null,
    cta:         null,
  },
  {
    id:          'payment_completed',
    label:       'Activate subscription',
    description: 'Choose a plan and start your 14-day free trial.',
    href:        '/onboarding',
    cta:         'Choose plan →',
  },
  {
    id:          'shop_connected',
    label:       'Connect your first store',
    description: 'Link Bol.com, Shopify or another platform.',
    href:        '/dashboard/integrations',
    cta:         'Connect store →',
  },
  {
    id:          'first_insight',
    label:       'View your first AI actions',
    description: 'Discover what to do today to grow faster.',
    href:        '/dashboard/ai-insights',
    cta:         'View AI actions →',
  },
];

export function OnboardingChecklist({ hasStores, planSlug }: Props) {
  const router = useRouter();
  const [state,     setState]     = useState<OnboardingState | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [mounted,   setMounted]   = useState(false);

  useEffect(() => {
    setMounted(true);
    const wasDismissed = localStorage.getItem('onboarding_dismissed') === 'true';
    if (wasDismissed) { setDismissed(true); return; }

    api.get('/onboarding/state')
      .then(res => {
        const data = res.data ?? {};
        setState({
          completedSteps: Array.isArray(data.completedSteps) ? data.completedSteps : [],
          status:         typeof data.status === 'string' ? data.status : '',
        });
      })
      .catch(() => {
        // Backend faalt: gebruik lege completedSteps zodat we toch op props kunnen leunen
        setState({ completedSteps: [], status: '' });
      });
  }, []);

  const dismiss = () => {
    localStorage.setItem('onboarding_dismissed', 'true');
    setDismissed(true);
  };

  // Voor mount: niets renderen (voorkomt hydration mismatch)
  if (!mounted) return null;

  // Past onboarding: gebruiker heeft al stores connected
  if (hasStores) return null;

  // Gebruiker heeft expliciet weggedaan
  if (dismissed) return null;

  // Backend call niet klaar
  if (!state) return null;

  // Backend zegt expliciet completed
  if (state.status === 'completed') return null;

  const completedSteps = state.completedSteps;

  const isStepDone = (stepId: string): boolean => {
    if (stepId === 'account_created')   return true;
    if (stepId === 'payment_completed') return planSlug !== 'starter' || completedSteps.includes('payment_completed');
    if (stepId === 'shop_connected')    return hasStores || completedSteps.includes('shop_connected');
    if (stepId === 'first_insight')     return completedSteps.includes('first_insight');
    return completedSteps.includes(stepId);
  };

  const completedCount = STEPS.filter(s => isStepDone(s.id)).length;

  // Alle 4 done: hide
  if (completedCount === STEPS.length) return null;

  const progress = Math.round((completedCount / STEPS.length) * 100);
  const nextStep = STEPS.find(s => !isStepDone(s.id));

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 sm:p-5 mb-6 min-w-0 overflow-hidden">

      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-brand-600/20 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-brand-400" fill="currentColor" />
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold">Get started</p>
            <p className="text-slate-400 text-xs">{completedCount} of {STEPS.length} steps completed</p>
          </div>
        </div>
        <button onClick={dismiss}
          className="w-7 h-7 rounded-lg bg-slate-700/50 hover:bg-slate-700 flex items-center justify-center transition-colors flex-shrink-0"
          aria-label="Hide checklist"
          title="Hide checklist">
          <X className="w-3.5 h-3.5 text-slate-300" />
        </button>
      </div>

      <div className="h-1.5 bg-slate-700 rounded-full mb-5 overflow-hidden">
        <div className="h-full bg-brand-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }} />
      </div>

      <div className="space-y-2">
        {STEPS.map((step) => {
          const done   = isStepDone(step.id);
          const isNext = nextStep?.id === step.id;

          return (
            <div key={step.id}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                isNext ? 'bg-brand-600/10 border border-brand-500/20' : done ? 'opacity-60' : 'opacity-50'
              }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                done ? 'bg-emerald-500' : isNext ? 'bg-brand-600' : 'bg-slate-700'
              }`}>
                {done
                  ? <Check className="w-3.5 h-3.5 text-white" />
                  : <span className="text-xs font-bold text-white">{STEPS.indexOf(step) + 1}</span>
                }
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${done ? 'text-slate-400 line-through' : 'text-white'}`}>
                  {step.label}
                </p>
                {isNext && (
                  <p className="text-xs text-slate-400 mt-0.5">{step.description}</p>
                )}
              </div>

              {isNext && step.href && (
                <button onClick={() => router.push(step.href!)}
                  className="flex items-center gap-1 text-xs font-semibold text-brand-400 hover:text-brand-300 flex-shrink-0 transition-colors">
                  {step.cta}
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

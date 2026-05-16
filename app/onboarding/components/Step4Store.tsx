'use client';

// ============================================================
// app/onboarding/components/Step4Plan.tsx
//
// V0 Gap 7 (16 mei 2026): plan keuze als verplichte step 4 in
// onboarding. User kiest Starter, Growth of Scale en wordt
// doorgestuurd naar Stripe checkout. Trial is 14 dagen, ingesteld
// in /api/billing/checkout. Geen Skip mogelijkheid.
//
// Stripe success URL: /onboarding?session_id=X.
// Parent page handles polling tot subscription actief is en
// schakelt dan over op visuele step 5 (Step4Store).
//
// Prijzen vanuit Master Plan v3.1:
//   Starter: 20 EUR / maand
//   Growth:  49 EUR / maand (pre-selected, Most popular)
//   Scale:   95 EUR / maand
// ============================================================

import { useState } from 'react';
import { Loader2, Check, ArrowRight, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';

type PlanSlug = 'starter' | 'growth' | 'scale';

interface PlanOption {
  slug:        PlanSlug;
  name:        string;
  price:       string;
  description: string;
  features:    string[];
  popular:     boolean;
}

const PLANS: PlanOption[] = [
  {
    slug:        'starter',
    name:        'Starter',
    price:       '€20',
    description: 'For founders just getting started.',
    features: [
      'Sales dashboard',
      'Order and revenue analytics',
      '500 AI credits per month',
      '1 connected store',
    ],
    popular: false,
  },
  {
    slug:        'growth',
    name:        'Growth',
    price:       '€49',
    description: 'For shops generating €5k+ per month.',
    features: [
      'Everything in Starter',
      'AI product recommendations',
      'Advertising analytics',
      '5.000 AI credits per month',
      'Up to 3 stores',
    ],
    popular: true,
  },
  {
    slug:        'scale',
    name:        'Scale',
    price:       '€95',
    description: 'For multi-store sellers ready to scale.',
    features: [
      'Everything in Growth',
      'AI advertising optimisation',
      'API access',
      'Unlimited AI credits',
      'Unlimited stores',
    ],
    popular: false,
  },
];

export function Step4Plan() {
  const [selected, setSelected] = useState<PlanSlug>('growth');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await api.post('/billing/checkout', { planSlug: selected });
      if (res.data?.url) {
        window.location.href = res.data.url;
        return;
      }
      setError('Could not start checkout. Please try again.');
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="text-sm text-slate-600 mb-6">
        Pick the plan that fits your business today. Every plan starts with a 14-day free trial, no charge until day 15.
      </p>

      <div className="space-y-3 mb-6">
        {PLANS.map(plan => {
          const isSelected = selected === plan.slug;
          return (
            <button
              key={plan.slug}
              onClick={() => setSelected(plan.slug)}
              type="button"
              className={`relative w-full text-left rounded-xl border-2 p-4 transition-all ${
                isSelected
                  ? 'border-brand-600 bg-brand-50/50'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              {plan.popular && (
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 bg-brand-100 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3" />
                  Most popular
                </span>
              )}

              <div className="flex items-start gap-3">
                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  isSelected ? 'border-brand-600 bg-brand-600' : 'border-slate-300'
                }`}>
                  {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                    <span className="text-base font-bold text-slate-900">{plan.name}</span>
                    <span className="text-base font-bold text-slate-900">{plan.price}</span>
                    <span className="text-xs text-slate-500">/ month</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">{plan.description}</p>
                  <ul className="space-y-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-1.5 text-xs text-slate-700">
                        <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="text-sm text-rose-600 mb-4">{error}</p>
      )}

      <button
        onClick={handleContinue}
        disabled={busy}
        className="w-full inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-3 rounded-xl transition-colors"
      >
        {busy ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Starting checkout...
          </>
        ) : (
          <>
            Continue to checkout
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <p className="text-xs text-slate-500 mt-3 text-center">
        14-day free trial. Cancel anytime from Settings. Card required.
      </p>
    </div>
  );
}

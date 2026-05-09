'use client';

// ============================================================
// app/onboarding/components/Step2Goal.tsx
//
// Step 2 (skipbaar): business goal archetype.
// Klik op card = direct submit + advance.
// ============================================================

import { useState } from 'react';
import { Loader2, Sun, TrendingUp, Rocket, Coffee } from 'lucide-react';
import { api } from '@/lib/api';

const GOALS = [
  {
    slug:  'lifestyle',
    title: 'Lifestyle income',
    sub:   'Reach 3-8k EUR per month and stay there. Not looking to scale infinitely.',
    Icon:  Sun,
  },
  {
    slug:  'steady',
    title: 'Steady growth',
    sub:   'Grow 20-50% per year. Stable, sustainable, profitable.',
    Icon:  TrendingUp,
  },
  {
    slug:  'scale-to-exit',
    title: 'Scale to exit',
    sub:   'Grow fast and sell in 5-7 years.',
    Icon:  Rocket,
  },
  {
    slug:  'side-project',
    title: 'Side project',
    sub:   'I have a day job. Just want to learn and earn extra income.',
    Icon:  Coffee,
  },
] as const;

interface Step2GoalProps {
  initial:     string | null;
  onCompleted: () => void;
}

export function Step2Goal({ initial, onCompleted }: Step2GoalProps) {
  const [selected, setSelected] = useState(initial ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSelect = async (slug: string) => {
    setSelected(slug);
    setSubmitting(true);
    setError('');
    try {
      await api.post('/onboarding/step-2', { businessGoal: slug });
      onCompleted();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Could not save. Try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-slate-600 text-sm">
        Pick the one that fits best. This shapes how the AI prioritises recommendations for you.
      </p>

      <div className="space-y-3">
        {GOALS.map(g => {
          const Icon = g.Icon;
          const isSelected = selected === g.slug;
          return (
            <button key={g.slug}
              onClick={() => handleSelect(g.slug)}
              disabled={submitting}
              className={`w-full text-left flex items-start gap-4 p-4 rounded-xl border-2 transition-all disabled:opacity-50 ${
                isSelected
                  ? 'border-brand-600 bg-brand-50'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isSelected ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900 text-sm mb-1">{g.title}</div>
                <div className="text-xs text-slate-500">{g.sub}</div>
              </div>
              {submitting && isSelected && (
                <Loader2 className="w-4 h-4 animate-spin text-brand-600 flex-shrink-0 mt-1" />
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}

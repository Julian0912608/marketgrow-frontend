'use client';

// ============================================================
// app/onboarding/components/Step3Marketing.tsx
//
// Step 3 (skipbaar): marketing style.
// Klik op card = direct submit + advance.
// ============================================================

import { useState } from 'react';
import { Loader2, Target, Heart, Layers } from 'lucide-react';
import { api } from '@/lib/api';

const STYLES = [
  {
    slug:  'paid',
    title: 'Aggressive paid',
    sub:   'Meta and Google. Show me ROAS-first recommendations.',
    Icon:  Target,
  },
  {
    slug:  'organic',
    title: 'Organic and content first',
    sub:   'SEO, social content, and email. Show me audience-building advice.',
    Icon:  Heart,
  },
  {
    slug:  'mix',
    title: 'A mix of both',
    sub:   'Balanced approach across channels.',
    Icon:  Layers,
  },
] as const;

interface Step3MarketingProps {
  initial:     string | null;
  onCompleted: () => void;
}

export function Step3Marketing({ initial, onCompleted }: Step3MarketingProps) {
  const [selected, setSelected] = useState(initial ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSelect = async (slug: string) => {
    setSelected(slug);
    setSubmitting(true);
    setError('');
    try {
      await api.post('/onboarding/step-3', { marketingStyle: slug });
      onCompleted();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Could not save. Try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-slate-600 text-sm">
        Same data, different recommendations. Pick the channel mix that fits how you want to grow.
      </p>

      <div className="space-y-3">
        {STYLES.map(s => {
          const Icon = s.Icon;
          const isSelected = selected === s.slug;
          return (
            <button key={s.slug}
              onClick={() => handleSelect(s.slug)}
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
                <div className="font-semibold text-slate-900 text-sm mb-1">{s.title}</div>
                <div className="text-xs text-slate-500">{s.sub}</div>
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

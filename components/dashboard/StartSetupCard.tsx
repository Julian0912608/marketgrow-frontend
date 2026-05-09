'use client';

// ============================================================
// components/dashboard/StartSetupCard.tsx
//
// Subtiele banner bovenaan dashboard voor users die de wizard
// hebben overgeslagen. Verdwijnt zodra ze in Settings de
// resterende velden hebben ingevuld (status -> completed).
//
// Linkt naar /settings?tab=business waar de SettingsPage de
// query param oppakt en direct de juiste tab opent.
// ============================================================

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';

interface OnboardingState {
  status: 'in_progress' | 'skipped' | 'completed';
}

export function StartSetupCard() {
  const [state, setState] = useState<OnboardingState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<OnboardingState>('/onboarding/state');
        if (!cancelled) setState(res.data);
      } catch {
        // Stilletjes falen, geen card tonen
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return null;
  if (!state || state.status !== 'skipped') return null;

  return (
    <div className="mb-6 bg-gradient-to-r from-brand-600/10 to-violet-600/10 border border-brand-500/20 rounded-2xl p-5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-brand-600/20 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-brand-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-display font-700 text-base mb-1">
            Tell us about your business
          </h3>
          <p className="text-slate-400 text-sm mb-4">
            Add your business goal and marketing style so the AI gives you sharper, more personalised advice.
          </p>
          <Link href="/settings?tab=business"
            className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Complete setup
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

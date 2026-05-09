'use client';

// ============================================================
// components/dashboard/OnboardingGuard.tsx
//
// Wraps every dashboard- en settings-pagina. Doet één check op
// /onboarding/state en handelt drie cases af:
//
//   - 'in_progress': redirect naar /onboarding (hard force).
//   - 'skipped':     render children, banner komt later (volgende sprint).
//   - 'completed':   render children.
//
// Op fetch-fout: stilletjes door (axios interceptor handelt 401 zelf
// met redirect naar /login). We blokkeren het dashboard niet op een
// transient onboarding-state miss.
// ============================================================

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface OnboardingState {
  status: 'in_progress' | 'skipped' | 'completed';
}

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await api.get<OnboardingState>('/onboarding/state');
        if (cancelled) return;

        if (res.data.status === 'in_progress') {
          router.replace('/onboarding');
          return;
        }

        setAllowed(true);
      } catch {
        // 401 -> interceptor stuurt naar /login
        // Andere errors -> niet blokkeren, laat de page laden
        if (!cancelled) setAllowed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!allowed) return null;

  return <>{children}</>;
}

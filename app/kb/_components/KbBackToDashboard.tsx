// ============================================================
// app/kb/_components/KbBackToDashboard.tsx
//
// Client component dat detecteert of de bezoeker is ingelogd
// (via aanwezigheid van access_token in sessionStorage).
// Zo ja: toont "Back to dashboard" link bovenaan de KB pagina.
// Zo nee: rendert niets (anonymous SEO-visitors zien marketing UI).
//
// V0 Gap 5a polish (16 mei 2026): safe-area-inset-top zodat de
// link niet onder de iOS Dynamic Island valt in standalone PWA.
// ============================================================

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

function detectLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;

  // Primary: sessionStorage access_token (confirmed location)
  const token = window.sessionStorage.getItem('access_token');
  if (token && token.length > 20) return true;

  // Fallback: localStorage mg-auth (Zustand persist)
  const mgAuth = window.localStorage.getItem('mg-auth');
  if (mgAuth) {
    try {
      const parsed = JSON.parse(mgAuth);
      const candidates = [
        parsed?.state?.accessToken,
        parsed?.state?.access_token,
        parsed?.accessToken,
      ];
      for (const c of candidates) {
        if (typeof c === 'string' && c.length > 20) return true;
      }
    } catch {
      // Niet-JSON value, skip
    }
  }

  return false;
}

export function KbBackToDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsLoggedIn(detectLoggedIn());
  }, []);

  // SSR + before hydration: render niets (geen flash)
  if (!mounted || !isLoggedIn) return null;

  return (
    <div
      className="bg-slate-900 text-white"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="max-w-5xl mx-auto px-6 py-3">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

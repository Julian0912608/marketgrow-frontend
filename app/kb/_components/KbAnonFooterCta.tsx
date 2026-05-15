// ============================================================
// app/kb/_components/KbAnonFooterCta.tsx
//
// Client component dat de "Want the full guides?" CTA toont
// alleen aan NIET-ingelogde bezoekers. Voor ingelogde users
// rendert het niets (die zijn al klant, geen sales pitch).
// ============================================================

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

function detectLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;

  const token = window.sessionStorage.getItem('access_token');
  if (token && token.length > 20) return true;

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
      // skip
    }
  }

  return false;
}

export function KbAnonFooterCta() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsLoggedIn(detectLoggedIn());
  }, []);

  // Voor crawlers en niet-ingelogden: render direct het CTA.
  // Alleen verbergen wanneer we 100% zeker weten dat user ingelogd is.
  if (mounted && isLoggedIn) return null;

  return (
    <section className="bg-slate-900 text-white">
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-3">
          Want the full guides?
        </h2>
        <p className="text-slate-300 mb-6">
          Sign up free to read complete articles, plus get AI-powered insights from
          your own store data.
        </p>
        <Link href="/register" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
          Start free trial
        </Link>
      </div>
    </section>
  );
}

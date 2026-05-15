'use client';

// ============================================================
// app/shopify/connect/page.tsx
//
// Landing page na een Shopify App Store install. De backend
// heeft het Shopify access token al opgehaald en achter een
// handoff token bewaard. Op deze pagina koppelt de gebruiker
// (of een nieuw account) de shop aan zijn MarketGrow tenant.
//
// FIX 15-mei (3): gebruikt useAuthStore.isAuth in plaats van
// raw sessionStorage check. Reden: na login update de Zustand
// store maar sessionStorage zit op een andere timing. De store
// is de single source of truth voor auth status.
//
// Flow:
//   - Mount: lees handoff + shop uit URL, sla op in localStorage
//   - GET /shopify/install/preview (raw axios) voor shop info
//   - Check Zustand useAuthStore.isAuth
//     - Ja: toon Connect knop -> POST /shopify/install/finalize
//     - Nee: toon sign-in / sign-up links met returnTo query
//   - Bij success: redirect naar /onboarding of /dashboard
// ============================================================

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { Store, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

const HANDOFF_STORAGE_KEY = 'shopify_install_handoff';

interface PreviewResponse {
  shop:       string;
  shopName:   string | null;
  existsInDb: boolean;
}

interface FinalizeResponse {
  success:       true;
  outcome:       'connected' | 'relinked' | 'already_yours';
  integrationId: string;
  shop:          string;
}

// ── Outer page: Suspense wrapper ─────────────────────────────
export default function ShopifyConnectPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ShopifyConnectInner />
    </Suspense>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
    </div>
  );
}

// ── Inner component: alle hooks + logic ──────────────────────
function ShopifyConnectInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const isAuth       = useAuthStore(s => s.isAuth);

  const [handoff, setHandoff]   = useState<string | null>(null);
  const [shop, setShop]         = useState<string | null>(null);
  const [shopName, setShopName] = useState<string | null>(null);
  const [existsInDb, setExistsInDb] = useState(false);

  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // ── Mount: lees handoff uit URL of localStorage ──────────
  useEffect(() => {
    const urlHandoff  = searchParams.get('handoff');
    const urlShop     = searchParams.get('shop');
    const urlShopName = searchParams.get('shopName');

    let activeHandoff: string | null = null;
    let activeShop:    string | null = null;
    let activeName:    string | null = urlShopName;

    if (urlHandoff && urlShop) {
      activeHandoff = urlHandoff;
      activeShop    = urlShop;
      try {
        localStorage.setItem(HANDOFF_STORAGE_KEY, JSON.stringify({
          handoff:  urlHandoff,
          shop:     urlShop,
          shopName: urlShopName,
          savedAt:  Date.now(),
        }));
      } catch { /* ignore */ }
    } else {
      try {
        const stored = localStorage.getItem(HANDOFF_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as {
            handoff:  string;
            shop:     string;
            shopName: string | null;
            savedAt:  number;
          };
          if (Date.now() - parsed.savedAt < 30 * 60 * 1000) {
            activeHandoff = parsed.handoff;
            activeShop    = parsed.shop;
            activeName    = parsed.shopName;
          }
        }
      } catch { /* ignore */ }
    }

    if (!activeHandoff || !activeShop) {
      setError('No active Shopify install in progress. Please re-install from the Shopify App Store.');
      setLoading(false);
      return;
    }

    setHandoff(activeHandoff);
    setShop(activeShop);
    setShopName(activeName);

    // Verifieer dat de handoff nog leeft op de server. KRITIEK:
    // raw axios, GEEN api client, anders schopt de 401 interceptor
    // ons naar /login zelfs als deze call slaagt.
    const apiBase = process.env.NEXT_PUBLIC_API_URL
      || 'https://marketgrowth-production.up.railway.app';

    (async () => {
      try {
        const res = await axios.get<PreviewResponse>(
          `${apiBase}/api/shopify/install/preview`,
          { params: { handoff: activeHandoff } }
        );
        if (res.data.shopName) setShopName(res.data.shopName);
        setExistsInDb(res.data.existsInDb);
        setError(null);
      } catch (e: any) {
        const msg = e?.response?.data?.error
          ?? 'Could not load Shopify install. The link may have expired.';
        setError(msg);
        try { localStorage.removeItem(HANDOFF_STORAGE_KEY); } catch { /* */ }
      } finally {
        setLoading(false);
      }
    })();
  }, [searchParams]);

  // ── Connect action ──────────────────────────────────────
  const handleConnect = async () => {
    if (!handoff) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post<FinalizeResponse>(
        '/shopify/install/finalize',
        { handoff }
      );
      try { localStorage.removeItem(HANDOFF_STORAGE_KEY); } catch { /* */ }

      // Bij 'connected' (nieuwe koppeling): start de onboarding
      // wizard. Bij 'relinked' of 'already_yours': dashboard.
      if (res.data.outcome === 'connected') {
        router.replace('/onboarding');
      } else {
        router.replace('/dashboard/integrations?reconnected=shopify');
      }
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401) {
        setError('Please sign in to connect your Shopify store.');
      } else if (status === 409) {
        setError(e?.response?.data?.error
          ?? 'This store is already linked to another MarketGrow account.');
      } else {
        setError(e?.response?.data?.error
          ?? 'Could not connect your Shopify store. Please try again.');
      }
      setSubmitting(false);
    }
  };

  // ── Renders ─────────────────────────────────────────────
  if (loading) {
    return <LoadingScreen />;
  }

  // Return URL voor sign-in / sign-up zodat we na auth terug
  // landen op deze page mét handoff in localStorage.
  const returnTo = encodeURIComponent('/shopify/connect');

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8">

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Shopify install</div>
            <div className="text-base font-semibold text-slate-900">Connect to MarketGrow</div>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg border border-red-200 bg-red-50 flex gap-2 items-start">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {shop && (
          <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-xs text-slate-500 mb-1">Store</div>
            <div className="text-sm font-medium text-slate-900">
              {shopName || shop}
            </div>
            {shopName && (
              <div className="text-xs text-slate-500 mt-0.5">{shop}</div>
            )}
            {existsInDb && !error && !isAuth && (
              <div className="text-xs text-amber-700 mt-2">
                This store is already linked to a MarketGrow account. Sign in to re-link.
              </div>
            )}
          </div>
        )}

        {!error && isAuth && (
          <>
            <p className="text-sm text-slate-600 mb-6">
              Connect this Shopify store to your MarketGrow account. We will start syncing your orders and products right away.
            </p>
            <button
              onClick={handleConnect}
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Connect store
                </>
              )}
            </button>
          </>
        )}

        {!error && !isAuth && (
          <>
            <p className="text-sm text-slate-600 mb-6">
              Sign in to your MarketGrow account, or create a new one, to finish connecting this store. We will hold your install for 15 minutes.
            </p>
            <div className="space-y-3">
              <Link
                href={`/register?returnTo=${returnTo}`}
                className="w-full inline-flex items-center justify-center px-4 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
              >
                Create MarketGrow account
              </Link>
              <Link
                href={`/login?returnTo=${returnTo}`}
                className="w-full inline-flex items-center justify-center px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 font-medium hover:bg-slate-50 transition"
              >
                Sign in
              </Link>
            </div>
            <p className="text-xs text-slate-500 mt-4 text-center">
              We will bring you back here automatically.
            </p>
          </>
        )}

        {error && (
          <Link
            href="/dashboard"
            className="block text-center text-sm text-indigo-600 hover:text-indigo-700 mt-4"
          >
            Go to dashboard
          </Link>
        )}
      </div>
    </div>
  );
}

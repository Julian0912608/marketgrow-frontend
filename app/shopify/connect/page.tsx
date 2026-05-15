'use client';

// ============================================================
// app/shopify/connect/page.tsx
//
// Landing page na een Shopify App Store install. De backend
// heeft het Shopify access token al opgehaald en achter een
// handoff token bewaard. Op deze pagina koppelt de gebruiker
// (of een nieuw account) de shop aan zijn MarketGrow tenant.
//
// Suspense wrapper is verplicht in Next.js App Router omdat
// useSearchParams() anders de static page generation breekt
// tijdens build (next.js prerender error). Zonder Suspense
// faalt 'npm run build' op Vercel.
//
// Flow:
//   - Mount: lees handoff + shop uit URL, sla op in localStorage
//   - GET /shopify/install/preview voor shop info (niet-consumerend)
//   - Check of de gebruiker is ingelogd
//     - Ja: toon Connect knop -> POST /shopify/install/finalize
//     - Nee: toon sign-in / sign-up links (handoff blijft in
//       localStorage tot na auth)
//   - Bij success: redirect naar /onboarding (zodat de wizard
//     stappen 1-3 doet en de Day Zero pipeline kan starten)
// ============================================================

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Store, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

const HANDOFF_STORAGE_KEY = 'shopify_install_handoff';

interface PreviewResponse {
  shop:     string;
  shopName: string | null;
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

  const [handoff, setHandoff]   = useState<string | null>(null);
  const [shop, setShop]         = useState<string | null>(null);
  const [shopName, setShopName] = useState<string | null>(null);

  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [isAuthed, setIsAuthed]     = useState(false);

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
          // 30 minuten geldigheid client-side. Server heeft sowieso 15.
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

    // Check auth status via een lichtgewicht endpoint. Als die
    // niet bestaat valt de catch op token-check terug.
    const accessToken = typeof window !== 'undefined'
      ? localStorage.getItem('accessToken')
      : null;
    setIsAuthed(!!accessToken);

    // Verifieer dat de handoff nog leeft op de server.
    (async () => {
      try {
        const res = await api.get<PreviewResponse>('/shopify/install/preview', {
          params: { handoff: activeHandoff },
        });
        if (res.data.shopName) setShopName(res.data.shopName);
        setError(null);
      } catch (e: any) {
        const msg = e?.response?.data?.error
          ?? 'Could not load Shopify install. The link may have expired.';
        setError(msg);
        // Cleanup stale handoff.
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
      await api.post('/shopify/install/finalize', { handoff });
      // Cleanup: handoff is geconsumeerd.
      try { localStorage.removeItem(HANDOFF_STORAGE_KEY); } catch { /* */ }
      // Stuur naar onboarding. Wizard detecteert dat shop al
      // gekoppeld is en kan Day Zero starten na step 1-3.
      router.replace('/onboarding');
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401) {
        setIsAuthed(false);
        setError('Please sign in to connect your Shopify store.');
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
          </div>
        )}

        {!error && isAuthed && (
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

        {!error && !isAuthed && (
          <>
            <p className="text-sm text-slate-600 mb-6">
              Sign in to your MarketGrow account, or create a new one, to finish connecting this store. We will hold your install for 15 minutes.
            </p>
            <div className="space-y-3">
              <Link
                href="/register"
                className="w-full inline-flex items-center justify-center px-4 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
              >
                Create MarketGrow account
              </Link>
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 font-medium hover:bg-slate-50 transition"
              >
                Sign in
              </Link>
            </div>
            <p className="text-xs text-slate-500 mt-4 text-center">
              After signing in, return to this page to finish.
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

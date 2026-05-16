'use client';

// ============================================================
// app/onboarding/components/Step4Store.tsx
//
// Step 4 (skipbaar): connect first store.
// Country-aware: Bol.com card alleen voor NL/BE via integration_bol flag.
// Refetch flags on mount: country is mogelijk net in step 1 gezet.
//
// V0 Gap 3 update: onCompleted krijgt nu shopConnected: boolean door
// zodat de parent page kan beslissen tussen /dashboard/setup (Day Zero
// polling) of /dashboard (no shop, geen Day Zero job).
// polling) of /dashboard.
//
// V0 Gap 6 update (15 mei 2026): detecteert bij mount of er al een
// store integratie bestaat (typisch na Shopify App Store install
// die de wizard heeft overgeslagen). In dat geval tonen we geen
// connect cards, maar een "Continue" knop die direct naar Day Zero
// polling gaat. Voorkomt verwarrende dubbele connect-prompt.
//
// Acties:
//   - Shopify: install POST -> complete -> Shopify OAuth redirect.
//              (geen onCompleted call: window.location.href neemt over)
//   - Bol.com: inline form -> connect POST -> complete -> onCompleted(true).
//   - Skip:    complete met shopConnected=false -> onCompleted(false).
//   - Already connected: toon banner -> Continue -> onCompleted(true)
//   - Shopify: install POST -> complete -> Shopify OAuth redirect
//   - Bol.com: inline form -> connect POST -> complete -> onCompleted(true)
//   - Skip:    complete met shopConnected=false -> onCompleted(false)
// ============================================================

import { useState, useEffect } from 'react';
import { Loader2, Store, ArrowRight, ExternalLink, X, AlertCircle } from 'lucide-react';
import { Loader2, Store, ArrowRight, ExternalLink, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useFeatureFlags } from '@/lib/featureFlags';

@@ -28,13 +34,44 @@
onCompleted: (shopConnected: boolean) => void;
}

type ActionState = 'idle' | 'shopify' | 'bol-form' | 'bol-help' | 'skip';
type ActionState = 'idle' | 'shopify' | 'bol-form' | 'bol-help' | 'skip' | 'continue';

// Een tenant integratie zoals teruggekomen van GET /integrations.
// Status van de connectie. Ads-platforms filteren we eruit.
interface IntegrationSummary {
  id:           string;
  platformSlug: string;
  shopName:     string | null;
  shopDomain:   string | null;
  status:       string;
}

// Welke platforms tellen als "store" (niet ads).
const STORE_PLATFORMS = new Set([
  'shopify', 'woocommerce', 'lightspeed', 'bigcommerce',
  'bolcom', 'magento', 'amazon', 'etsy',
]);

const PLATFORM_LABEL: Record<string, string> = {
  shopify:     'Shopify',
  woocommerce: 'WooCommerce',
  lightspeed:  'Lightspeed',
  bigcommerce: 'BigCommerce',
  bolcom:      'Bol.com',
  magento:     'Magento',
  amazon:      'Amazon',
  etsy:        'Etsy',
};

export function Step4Store({ countryCode, onCompleted }: Step4StoreProps) {
const { flags, refetch, loading: flagsLoading } = useFeatureFlags();
const [action, setAction] = useState<ActionState>('idle');
const [error, setError] = useState('');

  // Already-connected detectie.
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [existingStore, setExistingStore] = useState<IntegrationSummary | null>(null);

const [bolApiKey,    setBolApiKey]    = useState('');
const [bolApiSecret, setBolApiSecret] = useState('');
const [bolSubmitting, setBolSubmitting] = useState(false);
@@ -43,8 +80,46 @@
refetch();
}, [refetch]);

  // Mount-time: bestaande store integraties ophalen. Als er
  // al een actieve store-integratie is (geen ads), slaan we
  // de connect-cards over en tonen we een Continue knop.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<IntegrationSummary[]>('/integrations');
        if (cancelled) return;
        const list = Array.isArray(res.data) ? res.data : [];
        const activeStore = list.find(i =>
          STORE_PLATFORMS.has(i.platformSlug) && i.status === 'active'
        );
        setExistingStore(activeStore ?? null);
      } catch {
        // Niet kritiek: bij fout vallen we terug op de normale connect UI.
        setExistingStore(null);
      } finally {
        if (!cancelled) setCheckingExisting(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

const bolEnabled = flags['integration_bol'] === true;

  // Continue: gebruiker heeft al een store, finish onboarding en
  // route naar Day Zero polling page.
  const handleContinue = async () => {
    setAction('continue');
    setError('');
    try {
      await api.post('/onboarding/complete', { shopConnected: true });
      onCompleted(true);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e?.response?.data?.message ?? 'Could not finish setup.');
      setAction('idle');
    }
  };

const handleShopify = async () => {
const domain = window.prompt('Enter your Shopify store domain (e.g. mystore.myshopify.com):');
if (!domain) return;
@@ -53,9 +128,6 @@
setError('');
try {
const res = await api.post('/integrations/shopify/install', { shopDomain: domain });
      // Markeer wizard als compleet voor Shopify OAuth start. Day Zero
      // wordt na OAuth callback getriggered (achter de schermen op backend).
      // De gebruiker komt na OAuth terug op zijn eigen Shopify-flow landing.
await api.post('/onboarding/complete', { shopConnected: true });
window.location.href = res.data.installUrl;
} catch (e: any) {
@@ -97,15 +169,73 @@
}
};

  if (flagsLoading) {
  // ── Loading state ─────────────────────────────────────────
  if (flagsLoading || checkingExisting) {
return (
<div className="py-12 text-center">
<Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto" />
</div>
);
}

  // Bol form view
  // ── Already-connected state ───────────────────────────────
  // Typisch pad: gebruiker is via Shopify App Store binnengekomen,
  // de store is al gekoppeld via /shopify/connect finalize, en nu
  // landt hij in onboarding voor step 1-3. Step 4 hoeft hij niet
  // meer te doen, hij ziet hier alleen een bevestiging.
  if (existingStore) {
    const label = PLATFORM_LABEL[existingStore.platformSlug] ?? existingStore.platformSlug;
    const displayName =
      existingStore.shopName ?? existingStore.shopDomain ?? label;

    return (
      <div className="space-y-6">
        <p className="text-slate-600 text-sm">
          Your store is already connected. We will start building your AI baseline as soon as you continue.
        </p>

        <div className="flex items-start gap-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 truncate">{displayName}</p>
            <p className="text-xs text-slate-600 mt-0.5">{label} · Active</p>
            {existingStore.shopDomain && existingStore.shopName && (
              <p className="text-xs text-slate-500 mt-0.5 truncate">{existingStore.shopDomain}</p>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-rose-700">{error}</p>
          </div>
        )}

        <button
          onClick={handleContinue}
          disabled={action !== 'idle'}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 disabled:opacity-60 transition"
        >
          {action === 'continue' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Finishing up...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    );
  }

  // ── Bol form view ─────────────────────────────────────────
if (action === 'bol-form') {
return (
<div className="space-y-5">
@@ -123,30 +253,23 @@
</p>

<div>
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-1.5">
            Client ID
          </label>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Client ID</label>
<input
            type="text"
value={bolApiKey}
onChange={e => setBolApiKey(e.target.value)}
            placeholder="Your Bol.com client ID"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            disabled={bolSubmitting}
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
            placeholder="abc123..."
/>
</div>

<div>
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-1.5">
            Client Secret
          </label>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Client secret</label>
<input
            type="password"
value={bolApiSecret}
onChange={e => setBolApiSecret(e.target.value)}
            placeholder="Your Bol.com client secret"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            disabled={bolSubmitting}
            type="password"
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
            placeholder="••••••••"
/>
</div>

@@ -159,23 +282,29 @@

<button
onClick={handleBolSubmit}
          disabled={bolSubmitting || !bolApiKey.trim() || !bolApiSecret.trim()}
          className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
          disabled={bolSubmitting}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 disabled:opacity-60 transition"
>
{bolSubmitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Connecting...
            </>
) : (
            <>Connect <ArrowRight className="w-4 h-4" /></>
            <>
              Connect Bol.com
              <ArrowRight className="w-4 h-4" />
            </>
)}
</button>
</div>
);
}

  // Idle / store choice view
  // ── Default state: connect cards ──────────────────────────
return (
<div className="space-y-4">
      <p className="text-sm text-slate-600 mb-2">
      <p className="text-slate-600 text-sm">
Connect your sales channel so we can pull in your data and build your AI baseline.
</p>

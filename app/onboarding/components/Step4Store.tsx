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
//
// Acties:
//   - Shopify: install POST -> complete -> Shopify OAuth redirect.
//              (geen onCompleted call: window.location.href neemt over)
//   - Bol.com: inline form -> connect POST -> complete -> onCompleted(true).
//   - Skip:    complete met shopConnected=false -> onCompleted(false).
// ============================================================

import { useState, useEffect } from 'react';
import { Loader2, Store, ArrowRight, ExternalLink, X, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useFeatureFlags } from '@/lib/featureFlags';

interface Step4StoreProps {
  countryCode: string;
  onCompleted: (shopConnected: boolean) => void;
}

type ActionState = 'idle' | 'shopify' | 'bol-form' | 'bol-help' | 'skip';

export function Step4Store({ countryCode, onCompleted }: Step4StoreProps) {
  const { flags, refetch, loading: flagsLoading } = useFeatureFlags();
  const [action, setAction] = useState<ActionState>('idle');
  const [error, setError] = useState('');

  const [bolApiKey,    setBolApiKey]    = useState('');
  const [bolApiSecret, setBolApiSecret] = useState('');
  const [bolSubmitting, setBolSubmitting] = useState(false);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const bolEnabled = flags['integration_bol'] === true;

  const handleShopify = async () => {
    const domain = window.prompt('Enter your Shopify store domain (e.g. mystore.myshopify.com):');
    if (!domain) return;

    setAction('shopify');
    setError('');
    try {
      const res = await api.post('/integrations/shopify/install', { shopDomain: domain });
      // Markeer wizard als compleet voor Shopify OAuth start. Day Zero
      // wordt na OAuth callback getriggered (achter de schermen op backend).
      // De gebruiker komt na OAuth terug op zijn eigen Shopify-flow landing.
      await api.post('/onboarding/complete', { shopConnected: true });
      window.location.href = res.data.installUrl;
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e?.response?.data?.message ?? 'Could not start Shopify install.');
      setAction('idle');
    }
  };

  const handleBolSubmit = async () => {
    if (!bolApiKey.trim() || !bolApiSecret.trim()) {
      setError('Please enter both your client ID and client secret.');
      return;
    }
    setBolSubmitting(true);
    setError('');
    try {
      await api.post('/integrations/connect', {
        platformSlug: 'bolcom',
        apiKey:       bolApiKey.trim(),
        apiSecret:    bolApiSecret.trim(),
      });
      await api.post('/onboarding/complete', { shopConnected: true });
      onCompleted(true);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e?.response?.data?.message ?? 'Could not connect Bol.com.');
      setBolSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setAction('skip');
    setError('');
    try {
      await api.post('/onboarding/complete', { shopConnected: false });
      onCompleted(false);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Could not finish setup.');
      setAction('idle');
    }
  };

  if (flagsLoading) {
    return (
      <div className="py-12 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto" />
      </div>
    );
  }

  // Bol form view
  if (action === 'bol-form') {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Connect Bol.com</h3>
          <button onClick={() => { setAction('idle'); setError(''); }}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-slate-600">
          Find your client credentials in the Bol seller dashboard under <span className="font-medium">Settings &gt; API</span>.
        </p>

        <div>
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-1.5">
            Client ID
          </label>
          <input
            type="text"
            value={bolApiKey}
            onChange={e => setBolApiKey(e.target.value)}
            placeholder="Your Bol.com client ID"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            disabled={bolSubmitting}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-1.5">
            Client Secret
          </label>
          <input
            type="password"
            value={bolApiSecret}
            onChange={e => setBolApiSecret(e.target.value)}
            placeholder="Your Bol.com client secret"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            disabled={bolSubmitting}
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-rose-700">{error}</p>
          </div>
        )}

        <button
          onClick={handleBolSubmit}
          disabled={bolSubmitting || !bolApiKey.trim() || !bolApiSecret.trim()}
          className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {bolSubmitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
          ) : (
            <>Connect <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </div>
    );
  }

  // Idle / store choice view
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 mb-2">
        Connect your sales channel so we can pull in your data and build your AI baseline.
      </p>

      {/* Shopify card */}
      <button
        onClick={handleShopify}
        disabled={action !== 'idle'}
        className="w-full flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:border-brand-300 hover:bg-brand-50/30 transition-all text-left disabled:opacity-50"
      >
        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <Store className="w-5 h-5 text-emerald-700" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-slate-900">Shopify</p>
          <p className="text-xs text-slate-500">Recommended for most stores. Connect via OAuth.</p>
        </div>
        {action === 'shopify' ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        ) : (
          <ExternalLink className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {/* Bol card (only NL/BE) */}
      {bolEnabled && (
        <button
          onClick={() => { setAction('bol-form'); setError(''); }}
          disabled={action !== 'idle'}
          className="w-full flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:border-brand-300 hover:bg-brand-50/30 transition-all text-left disabled:opacity-50"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Store className="w-5 h-5 text-blue-700" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-900">Bol.com</p>
            <p className="text-xs text-slate-500">Connect with your seller API credentials.</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </button>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      )}

      <div className="pt-2 border-t border-slate-100">
        <button
          onClick={handleSkip}
          disabled={action !== 'idle'}
          className="text-sm text-slate-500 hover:text-slate-700 font-medium disabled:opacity-50"
        >
          {action === 'skip' ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Finishing up...
            </span>
          ) : (
            "I'll connect a store later"
          )}
        </button>
      </div>
    </div>
  );
}

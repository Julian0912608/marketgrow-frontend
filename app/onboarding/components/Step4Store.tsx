'use client';

// ============================================================
// app/onboarding/components/Step4Store.tsx
//
// Step 4 (skipbaar): connect first store.
// Country-aware: Bol.com card alleen voor NL/BE via integration_bol flag.
// Refetch flags on mount: country is mogelijk net in step 1 gezet.
//
// Acties:
//   - Shopify: install POST -> complete -> redirect naar Shopify OAuth.
//   - Bol.com: inline form -> connect POST -> complete -> dashboard.
//   - Skip:    complete met shopConnected=false -> dashboard.
// ============================================================

import { useState, useEffect } from 'react';
import { Loader2, Store, ArrowRight, ExternalLink, X, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useFeatureFlags } from '@/lib/featureFlags';

interface Step4StoreProps {
  countryCode: string;
  onCompleted: () => void;
}

type ActionState = 'idle' | 'shopify' | 'bol-form' | 'bol-help' | 'skip';

export function Step4Store({ countryCode, onCompleted }: Step4StoreProps) {
  const { flags, refetch, loading: flagsLoading } = useFeatureFlags();
  const [action, setAction] = useState<ActionState>('idle');
  const [error, setError] = useState('');

  const [bolApiKey,    setBolApiKey]    = useState('');
  const [bolApiSecret, setBolApiSecret] = useState('');
  const [bolSubmitting, setBolSubmitting] = useState(false);

  // Country is mogelijk net in step 1 gezet, provider kan oude flags hebben
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
      // Markeer wizard pas als compleet zodra install URL succesvol is opgehaald
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
      onCompleted();
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
      onCompleted();
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
          <label className="block text-sm font-semibold text-slate-900 mb-1.5">Client ID</label>
          <input type="text"
            value={bolApiKey}
            onChange={e => setBolApiKey(e.target.value)}
            placeholder="abc12345-..."
            className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1.5">Client Secret</label>
          <input type="password"
            value={bolApiSecret}
            onChange={e => setBolApiSecret(e.target.value)}
            placeholder="••••••••••••••••"
            className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <button onClick={handleBolSubmit}
          disabled={bolSubmitting}
          className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm"
        >
          {bolSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Connect Bol.com'}
        </button>
      </div>
    );
  }

  // Bol help view
  if (action === 'bol-help') {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Become a Bol.com seller</h3>
          <button onClick={() => setAction('idle')}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-sm text-slate-600">
          <p>
            Bol.com is a marketplace for NL and BE. To sell on Bol you need a registered seller account, which requires a KvK number and a Dutch or Belgian VAT registration.
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Register your business at the Chamber of Commerce (KvK).</li>
            <li>Apply as a seller at <span className="font-medium">verkopen.bol.com</span>.</li>
            <li>Wait for approval, usually 1 to 3 working days.</li>
            <li>Once approved, generate API credentials in the seller dashboard.</li>
          </ol>
        </div>

        <a href="https://verkopen.bol.com/nl/registreer/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-brand-600 text-sm font-semibold hover:underline"
        >
          Open Bol seller registration
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        <button onClick={() => setAction('idle')}
          className="w-full py-3 px-6 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-sm"
        >
          Back
        </button>
      </div>
    );
  }

  // Default cards view
  return (
    <div className="space-y-5">
      <p className="text-slate-600 text-sm">
        Connect your first store so the AI can read your sales history and write your baseline marketing plan.
      </p>

      <button onClick={handleShopify}
        disabled={action !== 'idle'}
        className="w-full text-left flex items-center gap-4 p-5 rounded-xl border-2 border-slate-200 hover:border-brand-600 hover:bg-brand-50 transition-all disabled:opacity-50"
      >
        <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
          <Store className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-slate-900 text-sm mb-1">Shopify</div>
          <div className="text-xs text-slate-500">OAuth connection. Recommended for most stores.</div>
        </div>
        {action === 'shopify'
          ? <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
          : <ArrowRight className="w-4 h-4 text-slate-400" />}
      </button>

      {bolEnabled && (
        <div className="space-y-2">
          <button onClick={() => { setAction('bol-form'); setError(''); }}
            disabled={action !== 'idle'}
            className="w-full text-left flex items-center gap-4 p-5 rounded-xl border-2 border-slate-200 hover:border-brand-600 hover:bg-brand-50 transition-all disabled:opacity-50"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-slate-900 text-sm mb-1">Bol.com</div>
              <div className="text-xs text-slate-500">Marketplace seller account with API credentials.</div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>
          <button onClick={() => setAction('bol-help')}
            className="text-xs text-slate-500 hover:text-slate-700 ml-1"
          >
            Don't have a Bol seller account yet? Show me how
          </button>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="pt-3 border-t border-slate-100">
        <button onClick={handleSkip}
          disabled={action !== 'idle'}
          className="w-full text-center text-sm text-slate-500 hover:text-slate-700 font-medium disabled:opacity-50"
        >
          {action === 'skip'
            ? <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            : `I'll connect later`}
        </button>
      </div>
    </div>
  );
}

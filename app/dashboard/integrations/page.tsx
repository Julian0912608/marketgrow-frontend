'use client';

import { useState, useEffect } from 'react';
import {
  RefreshCw, Trash2, Plus, CheckCircle, AlertCircle,
  Clock, Loader2, Megaphone,
} from 'lucide-react';
import { api } from '@/lib/api';

// ── Platform config ───────────────────────────────────────────
const PLATFORMS = [
  { id: 'shopify',     name: 'Shopify',     type: 'oauth',       color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', fields: [] },
  { id: 'bolcom',      name: 'Bol.com',     type: 'apikey',      color: 'bg-blue-500/10 border-blue-500/20 text-blue-400',         fields: ['apiKey', 'apiSecret'] },
  { id: 'etsy',        name: 'Etsy',        type: 'oauth',       color: 'bg-orange-500/10 border-orange-500/20 text-orange-400',   fields: [] },
  { id: 'woocommerce', name: 'WooCommerce', type: 'apikey',      color: 'bg-purple-500/10 border-purple-500/20 text-purple-400',   fields: ['storeUrl', 'apiKey', 'apiSecret'] },
  { id: 'amazon',      name: 'Amazon',      type: 'coming_soon', color: 'bg-amber-500/10 border-amber-500/20 text-amber-400',      fields: [] },
  { id: 'pinterest',   name: 'Pinterest',   type: 'coming_soon', color: 'bg-rose-500/10 border-rose-500/20 text-rose-400',         fields: [] },
];

const FIELD_LABELS: Record<string, string> = {
  apiKey:    'API Key',
  apiSecret: 'API Secret',
  storeUrl:  'Store URL (https://...)',
};

// Advertising platforms — kunnen meerdere zijn
interface AdvIntegration {
  id:       string;
  platform: string;
  name:     string;
  color:    string;
}

// UPDATE: meta_ads toegevoegd
const ADV_PLATFORMS: Record<string, { name: string; color: string }> = {
  bolcom_ads:  { name: 'Bol.com Ads',  color: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
  google_ads:  { name: 'Google Ads',   color: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
  meta_ads:    { name: 'Meta Ads',     color: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
};

function StatusBadge({ status, errorMessage }: { status: string; errorMessage?: string }) {
  const config: Record<string, { icon: any; color: string; label: string }> = {
    active:       { icon: CheckCircle, color: 'text-emerald-400', label: 'Active' },
    error:        { icon: AlertCircle, color: 'text-rose-400',    label: 'Error' },
    syncing:      { icon: RefreshCw,   color: 'text-brand-400',   label: 'Syncing' },
    disconnected: { icon: Clock,       color: 'text-slate-400',   label: 'Disconnected' },
  };
  const cfg = config[status] ?? { icon: Clock, color: 'text-slate-400', label: status };
  return (
    <div className="flex flex-col gap-0.5">
      <div className={`flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
        <cfg.icon className="w-3.5 h-3.5" />
        {cfg.label}
      </div>
      {status === 'error' && errorMessage && (
        <div className="text-xs text-rose-400/70 max-w-xs truncate">{errorMessage}</div>
      )}
    </div>
  );
}

export default function IntegrationsPage() {
  const [connections,   setConnections]   = useState<any[]>([]);
  const [connecting,    setConnecting]    = useState<string | null>(null);
  const [formData,      setFormData]      = useState<Record<string, string>>({});
  const [loading,       setLoading]       = useState(false);
  const [syncing,       setSyncing]       = useState<string | null>(null);
  const [error,         setError]         = useState('');

  // Advertising state
  const [advIntegrations, setAdvIntegrations] = useState<AdvIntegration[]>([]);
  const [advConnecting,   setAdvConnecting]   = useState(false);
  const [advForm,         setAdvForm]         = useState({ clientId: '', clientSecret: '' });
  const [advLoading,      setAdvLoading]      = useState(false);
  const [advSyncing,      setAdvSyncing]      = useState<string | null>(null);
  const [metaConnecting,  setMetaConnecting]  = useState(false);

  const load = async () => {
    try {
      const res  = await api.get('/integrations');
      const data = res.data.connections ?? res.data ?? [];
      setConnections(data);

      // Haal alle advertising koppelingen op
      const advs: AdvIntegration[] = data
        .filter((c: any) => ADV_PLATFORMS[c.platformSlug ?? c.platform])
        .map((c: any) => {
          const slug    = c.platformSlug ?? c.platform;
          const advInfo = ADV_PLATFORMS[slug];
          return { id: c.id, platform: slug, name: advInfo.name, color: advInfo.color };
        });
      setAdvIntegrations(advs);
    } catch {}
  };

  useEffect(() => {
    load();

    // Toon banner als we van een OAuth callback komen
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'meta_ads') {
      setError('');
      // Strip query parameters voor schone URL
      window.history.replaceState({}, '', '/dashboard/integrations');
    } else if (params.get('error')) {
      setError(decodeURIComponent(params.get('error') || ''));
      window.history.replaceState({}, '', '/dashboard/integrations');
    }
  }, []);

  const handleShopifyInstall = async () => {
    const domain = prompt('Enter your Shopify store domain (e.g. mystore.myshopify.com)');
    if (!domain) return;
    try {
      const res = await api.post('/integrations/shopify/install', { shopDomain: domain });
      window.location.href = res.data.installUrl;
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to connect Shopify');
    }
  };

  const handleConnect = async (platformId: string) => {
    setLoading(true);
    setError('');
    try {
      await api.post('/integrations/connect', { platformSlug: platformId, ...formData });
      setConnecting(null);
      setFormData({});
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error ?? err.response?.data?.message ?? 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (id: string) => {
    setSyncing(id);
    try {
      await api.post(`/integrations/${id}/sync`, { jobType: 'full_sync' });
      setTimeout(() => load(), 2000);
    } catch {}
    setSyncing(null);
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm('Disconnect this integration? All synced data will remain.')) return;
    try {
      await api.delete(`/integrations/${id}`);
      await load();
    } catch {}
  };

  const handleAdvConnect = async () => {
    if (!advForm.clientId || !advForm.clientSecret) return;
    setAdvLoading(true);
    setError('');
    try {
      await api.post('/integrations/advertising/bolcom/connect', {
        clientId:     advForm.clientId,
        clientSecret: advForm.clientSecret,
      });
      setAdvConnecting(false);
      setAdvForm({ clientId: '', clientSecret: '' });
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Advertising connection failed');
    } finally {
      setAdvLoading(false);
    }
  };

  // ── Meta Ads OAuth start ──────────────────────────────────
  const handleMetaConnect = async () => {
    setMetaConnecting(true);
    setError('');
    try {
      const res = await api.post('/integrations/advertising/meta/connect');
      if (res.data?.authUrl) {
        // Redirect naar Facebook
        window.location.href = res.data.authUrl;
      } else {
        setError('Geen auth URL ontvangen — controleer META_APP_ID env var');
        setMetaConnecting(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Meta Ads verbinding starten mislukt');
      setMetaConnecting(false);
    }
  };

  const handleAdvSync = async (platform: string, integrationId?: string) => {
    setAdvSyncing(platform);
    try {
      if (platform === 'bolcom_ads' && integrationId) {
        const res = await api.post(`/integrations/advertising/bolcom/${integrationId}/sync`);
        alert(`Sync complete: ${res.data.campaigns} campaigns, €${res.data.totalSpend?.toFixed(2)} spend`);
      } else if (platform === 'meta_ads') {
        alert('Meta Ads sync wordt geactiveerd in een volgende update.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Sync failed');
    } finally {
      setAdvSyncing(null);
    }
  };

  const handleAdvDisconnect = async (id: string, name: string) => {
    if (!confirm(`Disconnect ${name}? All synced ad data will remain.`)) return;
    try {
      await api.delete(`/integrations/${id}`);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Disconnect failed');
    }
  };

  const connectedPlatforms = new Set(
    connections
      .filter((c: any) => !ADV_PLATFORMS[c.platformSlug ?? c.platform])
      .map((c: any) => c.platform ?? c.platformSlug)
  );

  const storeConnections = connections.filter(
    (c: any) => !ADV_PLATFORMS[c.platformSlug ?? c.platform]
  );

  const isMetaConnected = advIntegrations.some(a => a.platform === 'meta_ads');
  const isBolcomAdsConnected = advIntegrations.some(a => a.platform === 'bolcom_ads');

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-800 text-white mb-1">Integrations</h1>
        <p className="text-slate-400 text-sm">Connect your stores and marketplaces to start syncing data.</p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm px-4 py-3 rounded-xl mb-6 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-2 underline text-xs">Close</button>
        </div>
      )}

      {/* Connected stores */}
      {storeConnections.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Connected stores</h2>
          <div className="space-y-3">
            {storeConnections.map((c: any) => (
              <div key={c.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {(c.shopName || c.platformName || c.platformSlug || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">
                      {c.shopName || c.platformName || c.platformSlug}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <StatusBadge status={c.status} errorMessage={c.errorMessage} />
                      <span className="text-xs text-slate-500">{c.ordersCount ?? 0} orders</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSync(c.id)}
                    disabled={syncing === c.id}
                    className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                    title="Sync"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncing === c.id ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleDisconnect(c.id)}
                    className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-rose-600/20 flex items-center justify-center text-slate-400 hover:text-rose-400 transition-colors"
                    title="Disconnect"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add platform */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Add platform</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLATFORMS.map(platform => {
            const isConnected  = connectedPlatforms.has(platform.id);
            const isConnecting = connecting === platform.id;

            return (
              <div key={platform.id} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-display font-800 text-sm ${platform.color}`}>
                    {platform.name[0]}
                  </div>
                  {isConnected && (
                    <div className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Connected
                    </div>
                  )}
                </div>
                <h3 className="font-display font-700 text-white mb-1">{platform.name}</h3>

                {platform.type === 'coming_soon' ? (
                  <p className="text-xs text-slate-500 mt-2">Coming soon</p>
                ) : isConnecting ? (
                  <div className="space-y-2 mt-3">
                    {platform.fields.map(field => (
                      <input
                        key={field}
                        type={field.toLowerCase().includes('secret') || field.toLowerCase().includes('token') ? 'password' : 'text'}
                        placeholder={FIELD_LABELS[field] ?? field}
                        value={formData[field] ?? ''}
                        onChange={e => setFormData(f => ({ ...f, [field]: e.target.value }))}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    ))}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleConnect(platform.id)}
                        disabled={loading}
                        className="flex-1 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                      >
                        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        Connect
                      </button>
                      <button
                        onClick={() => { setConnecting(null); setFormData({}); }}
                        className="px-3 py-2 bg-slate-700 text-slate-400 text-xs rounded-lg hover:bg-slate-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => platform.type === 'oauth' && platform.id === 'shopify'
                      ? handleShopifyInstall()
                      : platform.type === 'oauth'
                      ? handleConnect(platform.id)
                      : setConnecting(platform.id)}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white text-xs font-medium py-2 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {isConnected ? 'Add another' : 'Connect'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Advertising */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Advertising</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* Connected advertising platforms */}
          {advIntegrations.map(adv => (
            <div key={adv.id} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${adv.color}`}>
                  <Megaphone className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Connected
                </div>
              </div>
              <h3 className="font-display font-700 text-white mb-1">{adv.name}</h3>
              <p className="text-xs text-slate-500 mb-3">
                {adv.platform === 'meta_ads'
                  ? 'Facebook + Instagram campaign automation'
                  : 'Campaign performance, spend and ROAS'}
              </p>
              <div className="flex gap-2">
                {(adv.platform === 'bolcom_ads' || adv.platform === 'meta_ads') && (
                  <button
                    onClick={() => handleAdvSync(adv.platform, adv.id)}
                    disabled={advSyncing === adv.platform}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white text-xs font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${advSyncing === adv.platform ? 'animate-spin' : ''}`} />
                    {advSyncing === adv.platform ? 'Syncing...' : 'Sync now'}
                  </button>
                )}
                <button
                  onClick={() => handleAdvDisconnect(adv.id, adv.name)}
                  className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-rose-600/20 flex items-center justify-center text-slate-400 hover:text-rose-400 transition-colors shrink-0"
                  title="Disconnect"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Bol.com Ads connect form (alleen als nog niet connected) */}
          {!isBolcomAdsConnected && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl border bg-blue-500/10 border-blue-500/20 flex items-center justify-center">
                  <Megaphone className="w-4 h-4 text-blue-400" />
                </div>
              </div>
              <h3 className="font-display font-700 text-white mb-1">Bol.com Ads</h3>
              <p className="text-xs text-slate-500 mb-3">Campaign performance, spend and ROAS</p>

              {advConnecting ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Advertising Client ID"
                    value={advForm.clientId}
                    onChange={e => setAdvForm(f => ({ ...f, clientId: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <input
                    type="password"
                    placeholder="Advertising Client Secret"
                    value={advForm.clientSecret}
                    onChange={e => setAdvForm(f => ({ ...f, clientSecret: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleAdvConnect}
                      disabled={advLoading || !advForm.clientId || !advForm.clientSecret}
                      className="flex-1 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      {advLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                      Connect
                    </button>
                    <button
                      onClick={() => { setAdvConnecting(false); setAdvForm({ clientId: '', clientSecret: '' }); }}
                      className="px-3 py-2 bg-slate-700 text-slate-400 text-xs rounded-lg hover:bg-slate-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 pt-1">
                    Find your credentials at{' '}
                    <a href="https://retailer.bol.com" target="_blank" rel="noopener noreferrer" className="text-brand-400 underline">
                      retailer.bol.com
                    </a>
                    {' '}→ Settings → API credentials → Advertising
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => setAdvConnecting(true)}
                  className="w-full flex items-center justify-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white text-xs font-medium py-2 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Connect
                </button>
              )}
            </div>
          )}

          {/* Meta Ads connect tile (alleen als nog niet connected) */}
          {!isMetaConnected && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl border bg-blue-500/10 border-blue-500/20 flex items-center justify-center">
                  <Megaphone className="w-4 h-4 text-blue-400" />
                </div>
              </div>
              <h3 className="font-display font-700 text-white mb-1">Meta Ads</h3>
              <p className="text-xs text-slate-500 mb-3">Facebook + Instagram campaign automation</p>

              <button
                onClick={handleMetaConnect}
                disabled={metaConnecting}
                className="w-full flex items-center justify-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white text-xs font-medium py-2 rounded-lg transition-colors disabled:opacity-60"
              >
                {metaConnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                {metaConnecting ? 'Redirecting...' : 'Connect with Facebook'}
              </button>
              <p className="text-xs text-slate-500 pt-2">
                You will be redirected to Facebook to grant access to your Business Manager.
              </p>
            </div>
          )}

          {/* Coming soon */}
          {[
            { id: 'tiktok_ads',  name: 'TikTok Ads',  color: 'bg-slate-700/50 border-slate-600/50 text-slate-400' },
          ].map(p => (
            <div key={p.id} className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-5 opacity-50">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${p.color}`}>
                <Megaphone className="w-4 h-4" />
              </div>
              <h3 className="font-display font-700 text-slate-400 mb-1">{p.name}</h3>
              <p className="text-xs text-slate-600">Coming soon</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

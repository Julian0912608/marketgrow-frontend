'use client';

// app/dashboard/ads/page.tsx
//
// PR 2 UPDATE:
//   - handleSync werkt nu voor zowel bolcom_ads als meta_ads
//   - Haalt integration_id op via /api/integrations om de correcte
//     :integrationId/sync URL te kunnen aanroepen

import { useState, useEffect } from 'react';
import {
  Megaphone, TrendingUp, MousePointer,
  RefreshCw, ArrowUpRight, ArrowDownRight,
  Zap, BarChart3, Loader2,
} from 'lucide-react';
import { api } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────
interface Campaign {
  id:           string;
  name:         string;
  platform:     string;
  status:       string;
  spend:        number;
  revenue:      number;
  roas:         number;
  impressions:  number;
  clicks:       number;
  ctr:          number;
  cpc:          number;
  conversions:  number;
}

interface PlatformGroup {
  platform:    string;
  label:       string;
  color:       string;
  accent:      string;
  campaigns:   Campaign[];
  totalSpend:  number;
  totalRevenue: number;
  overallRoas: number;
  totalClicks: number;
  totalImpressions: number;
}

// ── Config ─────────────────────────────────────────────────────
const PLATFORM_CONFIG: Record<string, { label: string; color: string; accent: string }> = {
  bolcom_ads:  { label: 'Bol.com Ads',  color: 'bg-blue-500/15 border-blue-500/30',     accent: 'text-blue-400' },
  google_ads:  { label: 'Google Ads',   color: 'bg-rose-500/15 border-rose-500/30',     accent: 'text-rose-400' },
  meta_ads:    { label: 'Meta Ads',     color: 'bg-indigo-500/15 border-indigo-500/30', accent: 'text-indigo-400' },
  tiktok_ads:  { label: 'TikTok Ads',   color: 'bg-slate-700/50 border-slate-600',      accent: 'text-slate-300' },
};

function formatEur(val: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(val ?? 0);
}

function formatNum(val: number) {
  return new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 0 }).format(val ?? 0);
}

function RoasBadge({ roas }: { roas: number }) {
  const cls = roas >= 4 ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
            : roas >= 2 ? 'text-amber-400 bg-amber-400/10 border-amber-400/20'
            :             'text-rose-400 bg-rose-400/10 border-rose-400/20';
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cls}`}>
      {roas?.toFixed(1)}×
    </span>
  );
}

function TrendIcon({ val }: { val: number }) {
  return val >= 0
    ? <ArrowUpRight className="w-3 h-3 text-emerald-400" />
    : <ArrowDownRight className="w-3 h-3 text-rose-400" />;
}

// ── Platform Block ──────────────────────────────────────────────
function PlatformBlock({ group, onSync, syncing }: {
  group: PlatformGroup;
  onSync?: () => void;
  syncing?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = PLATFORM_CONFIG[group.platform] ?? { label: group.platform, color: 'bg-slate-700/50 border-slate-600', accent: 'text-slate-300' };

  return (
    <div className={`border rounded-2xl overflow-hidden ${cfg.color}`}>
      {/* Header */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm ${cfg.accent}`}>
              {group.label[0]}
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">{group.label}</h3>
              <p className="text-xs text-slate-500">{group.campaigns.length} campagne{group.campaigns.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onSync && (
              <button
                onClick={onSync}
                disabled={syncing}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                title="Sync campagnes"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* KPI blokken */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="bg-slate-900/50 rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-1">Spend</p>
            <p className="text-sm font-bold text-white">{formatEur(group.totalSpend)}</p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-1">Revenue</p>
            <p className="text-sm font-bold text-white">{formatEur(group.totalRevenue)}</p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-1">ROAS</p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-white">{group.overallRoas.toFixed(1)}×</p>
              <RoasBadge roas={group.overallRoas} />
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-1">Clicks</p>
            <p className="text-sm font-bold text-white">{formatNum(group.totalClicks)}</p>
          </div>
        </div>
      </div>

      {/* Campagnes tabel */}
      {group.campaigns.length > 0 && (
        <>
          <div
            className="px-5 pb-3 cursor-pointer flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            onClick={() => setExpanded(!expanded)}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            {expanded ? 'Verberg campagnes' : `Toon ${group.campaigns.length} campagne${group.campaigns.length !== 1 ? 's' : ''}`}
          </div>

          {expanded && (
            <div className="border-t border-slate-700/50">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left px-5 py-2.5 text-slate-500 font-medium">Campagne</th>
                      <th className="text-right px-3 py-2.5 text-slate-500 font-medium">Spend</th>
                      <th className="text-right px-3 py-2.5 text-slate-500 font-medium">Revenue</th>
                      <th className="text-right px-3 py-2.5 text-slate-500 font-medium">ROAS</th>
                      <th className="text-right px-3 py-2.5 text-slate-500 font-medium">Clicks</th>
                      <th className="text-right px-5 py-2.5 text-slate-500 font-medium">CTR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {group.campaigns.map(c => (
                      <tr key={c.id} className="hover:bg-slate-800/30">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${c.status === 'active' ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                            <span className="text-white font-medium truncate max-w-[180px]">{c.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right text-slate-300">{formatEur(parseFloat(String(c.spend   ?? 0)) || 0)}</td>
                        <td className="px-3 py-3 text-right text-slate-300">{formatEur(parseFloat(String(c.revenue ?? 0)) || 0)}</td>
                        <td className="px-3 py-3 text-right">
                          <RoasBadge roas={parseFloat(String(c.roas ?? 0)) || 0} />
                        </td>
                        <td className="px-3 py-3 text-right text-slate-300">{formatNum(parseInt(String(c.clicks ?? 0)) || 0)}</td>
                        <td className="px-5 py-3 text-right text-slate-400">{(parseFloat(String(c.ctr ?? 0)) || 0).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────
export default function AdsPage() {
  const [campaigns,   setCampaigns]   = useState<Campaign[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [syncing,     setSyncing]     = useState<string | null>(null);
  const [noData,      setNoData]      = useState(false);
  const [period,      setPeriod]      = useState('30d');
  const [customFrom,  setCustomFrom]  = useState('');
  const [customTo,    setCustomTo]    = useState('');
  const [showCustom,  setShowCustom]  = useState(false);
  const [syncError,   setSyncError]   = useState('');
  const [syncSuccess, setSyncSuccess] = useState('');

  const load = async (p = period, from = customFrom, to = customTo) => {
    setLoading(true);
    try {
      const params = p === 'custom' && from && to
        ? `period=custom&from=${from}&to=${to}`
        : `period=${p}`;
      const res = await api.get(`/analytics/ads?${params}`);
      const data = res.data.campaigns ?? [];
      setCampaigns(data);
      setNoData(data.length === 0);
    } catch {
      setNoData(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (period !== 'custom') load(period);
  }, [period]);

  const handlePeriod = (p: string) => {
    setPeriod(p);
    setShowCustom(p === 'custom');
    if (p !== 'custom') load(p);
  };

  const handleCustomApply = () => {
    if (customFrom && customTo) load('custom', customFrom, customTo);
  };

  // ── Sync trigger met integration_id lookup ──────────────────
  const handleSync = async (platform: string) => {
    setSyncing(platform);
    setSyncError('');
    setSyncSuccess('');

    try {
      // Stap 1: zoek integration_id op voor dit platform
      const integrationsRes = await api.get('/integrations');
      const integrations = integrationsRes.data ?? [];
      const integration = integrations.find(
        (i: any) => (i.platformSlug ?? i.platform) === platform && i.status === 'active'
      );

      if (!integration) {
        setSyncError(`${PLATFORM_CONFIG[platform]?.label ?? platform} integratie niet gevonden`);
        setSyncing(null);
        return;
      }

      // Stap 2: roep platform-specifieke sync URL aan
      let url: string;
      if (platform === 'bolcom_ads') {
        url = `/integrations/advertising/bolcom/${integration.id}/sync`;
      } else if (platform === 'meta_ads') {
        url = `/integrations/advertising/meta/${integration.id}/sync`;
      } else {
        setSyncError(`Sync niet ondersteund voor ${platform}`);
        setSyncing(null);
        return;
      }

      const res = await api.post(url);
      const campaigns = res.data.campaigns ?? 0;
      const platformLabel = PLATFORM_CONFIG[platform]?.label ?? platform;
      setSyncSuccess(`${platformLabel}: ${campaigns} campagnes bijgewerkt`);
      await load();
    } catch (e: any) {
      setSyncError(e.response?.data?.error ?? 'Sync mislukt');
    }
    setSyncing(null);
  };

  // Groepeer campagnes per platform
  const platformGroups: PlatformGroup[] = Object.entries(
    campaigns.reduce((acc, c) => {
      const key = c.platform;
      if (!acc[key]) acc[key] = [];
      acc[key].push(c);
      return acc;
    }, {} as Record<string, Campaign[]>)
  ).map(([platform, cams]) => {
    const totalSpend   = cams.reduce((s, c) => s + (parseFloat(String(c.spend   ?? 0)) || 0), 0);
    const totalRevenue = cams.reduce((s, c) => s + (parseFloat(String(c.revenue ?? 0)) || 0), 0);
    const totalClicks  = cams.reduce((s, c) => s + (parseInt(String(c.clicks      ?? 0)) || 0), 0);
    const totalImp     = cams.reduce((s, c) => s + (parseInt(String(c.impressions ?? 0)) || 0), 0);
    const cfg = PLATFORM_CONFIG[platform] ?? { label: platform, color: '', accent: '' };
    return {
      platform,
      label:           cfg.label,
      color:           cfg.color,
      accent:          cfg.accent,
      campaigns:       cams,
      totalSpend,
      totalRevenue,
      overallRoas:     totalSpend > 0 ? totalRevenue / totalSpend : 0,
      totalClicks,
      totalImpressions: totalImp,
    };
  }).sort((a, b) => b.totalSpend - a.totalSpend);

  // Totaal over alle platforms
  const grandSpend   = platformGroups.reduce((s, g) => s + g.totalSpend, 0);
  const grandRevenue = platformGroups.reduce((s, g) => s + g.totalRevenue, 0);
  const grandRoas    = grandSpend > 0 ? grandRevenue / grandSpend : 0;
  const grandClicks  = platformGroups.reduce((s, g) => s + g.totalClicks, 0);

  // Helper: welke platforms ondersteunen sync
  const supportsSync = (platform: string): boolean =>
    platform === 'bolcom_ads' || platform === 'meta_ads';

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-800 text-white mb-1">Advertising</h1>
          <p className="text-slate-400 text-sm">Alle advertentiekanalen gecombineerd</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700/50 rounded-xl p-1">
            {[
              { id: '7d',     label: '7d' },
              { id: '30d',    label: '30d' },
              { id: '90d',    label: '90d' },
              { id: 'custom', label: 'Custom' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => handlePeriod(p.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  period === p.id ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Custom date range */}
      {showCustom && (
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <input
            type="date"
            value={customFrom}
            onChange={e => setCustomFrom(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <span className="text-slate-500 text-sm">tot</span>
          <input
            type="date"
            value={customTo}
            onChange={e => setCustomTo(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button
            onClick={handleCustomApply}
            disabled={!customFrom || !customTo}
            className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Toepassen
          </button>
        </div>
      )}

      {/* Sync feedback */}
      {syncSuccess && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm">
          {syncSuccess}
          <button onClick={() => setSyncSuccess('')} className="ml-auto text-emerald-400 hover:text-white">×</button>
        </div>
      )}
      {syncError && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-300 text-sm">
          {syncError}
          <button onClick={() => setSyncError('')} className="ml-auto text-rose-400 hover:text-white">×</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
        </div>
      ) : noData ? (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-10 text-center">
          <Megaphone className="w-10 h-10 text-slate-600 mx-auto mb-4" />
          <h2 className="text-white font-semibold mb-2">Geen advertentiedata</h2>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            Koppel een advertentieplatform (Bol.com Ads, Meta Ads of Google Ads) via de Integraties pagina om data te zien.
          </p>
        </div>
      ) : (
        <>
          {/* Overall KPIs */}
          {platformGroups.length > 1 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total spend',   value: formatEur(grandSpend),   icon: Megaphone, color: 'text-slate-400' },
                { label: 'Total revenue', value: formatEur(grandRevenue), icon: TrendingUp, color: 'text-emerald-400' },
                { label: 'Blended ROAS',  value: `${grandRoas.toFixed(1)}×`, icon: Zap, color: grandRoas >= 3 ? 'text-emerald-400' : grandRoas >= 1.5 ? 'text-amber-400' : 'text-rose-400' },
                { label: 'Total clicks',  value: formatNum(grandClicks),  icon: MousePointer, color: 'text-blue-400' },
              ].map(kpi => (
                <div key={kpi.label} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                    <p className="text-xs text-slate-500">{kpi.label}</p>
                  </div>
                  <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Per-platform blokken */}
          <div className="space-y-4">
            {platformGroups.map(group => (
              <PlatformBlock
                key={group.platform}
                group={group}
                onSync={supportsSync(group.platform) ? () => handleSync(group.platform) : undefined}
                syncing={syncing === group.platform}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

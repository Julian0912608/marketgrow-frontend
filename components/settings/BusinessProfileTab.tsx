'use client';

// ============================================================
// components/settings/BusinessProfileTab.tsx
//
// Edit-versie van de 4 onboarding-velden. Hergebruikt PATCH
// /api/onboarding/profile.
//
// Validatie sluit aan bij backend zod schema:
//   - country: 1 uit ALLOWED_COUNTRY_CODES
//   - sellsTo: min 1, max 30
//   - goal en style: optioneel
// ============================================================

import { useState, useEffect } from 'react';
import {
  Loader2, X, Sun, TrendingUp, Rocket, Coffee,
  Target, Heart, Layers,
} from 'lucide-react';
import { api } from '@/lib/api';

// Sync houden met app/onboarding/components/Step1Country.tsx
const COUNTRIES = [
  { code: 'AT', name: 'Austria' },        { code: 'BE', name: 'Belgium' },
  { code: 'BG', name: 'Bulgaria' },       { code: 'HR', name: 'Croatia' },
  { code: 'CY', name: 'Cyprus' },         { code: 'CZ', name: 'Czech Republic' },
  { code: 'DK', name: 'Denmark' },        { code: 'EE', name: 'Estonia' },
  { code: 'FI', name: 'Finland' },        { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },        { code: 'GR', name: 'Greece' },
  { code: 'HU', name: 'Hungary' },        { code: 'IE', name: 'Ireland' },
  { code: 'IT', name: 'Italy' },          { code: 'LV', name: 'Latvia' },
  { code: 'LT', name: 'Lithuania' },      { code: 'LU', name: 'Luxembourg' },
  { code: 'MT', name: 'Malta' },          { code: 'NL', name: 'Netherlands' },
  { code: 'PL', name: 'Poland' },         { code: 'PT', name: 'Portugal' },
  { code: 'RO', name: 'Romania' },        { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' },       { code: 'ES', name: 'Spain' },
  { code: 'SE', name: 'Sweden' },         { code: 'GB', name: 'United Kingdom' },
  { code: 'NO', name: 'Norway' },         { code: 'CH', name: 'Switzerland' },
] as const;

const SELLS_TO_OPTIONS = [
  ...COUNTRIES,
  { code: 'GLOBAL', name: 'Global (other countries)' },
] as const;

const GOALS = [
  { slug: 'lifestyle',     title: 'Lifestyle income',         sub: '3-8k EUR per month, not chasing infinite scale.', Icon: Sun },
  { slug: 'steady',        title: 'Steady growth',            sub: '20-50% per year, sustainable.',                  Icon: TrendingUp },
  { slug: 'scale-to-exit', title: 'Scale to exit',            sub: 'Grow fast, sell in 5-7 years.',                  Icon: Rocket },
  { slug: 'side-project',  title: 'Side project',             sub: 'Day job, learn and earn extra.',                 Icon: Coffee },
] as const;

const STYLES = [
  { slug: 'paid',    title: 'Aggressive paid',         sub: 'Meta and Google. ROAS-first.',          Icon: Target },
  { slug: 'organic', title: 'Organic and content',    sub: 'SEO, social content, email.',           Icon: Heart },
  { slug: 'mix',     title: 'A mix of both',          sub: 'Balanced across channels.',             Icon: Layers },
] as const;

interface OnboardingState {
  countryCode:      string | null;
  sellsToCountries: string[] | null;
  businessGoal:     string | null;
  marketingStyle:   string | null;
}

interface BusinessProfileTabProps {
  showToast: (type: 'success' | 'error', msg: string) => void;
}

export function BusinessProfileTab({ showToast }: BusinessProfileTabProps) {
  const [country, setCountry] = useState('');
  const [sellsTo, setSellsTo] = useState<string[]>([]);
  const [goal,    setGoal]    = useState<string | null>(null);
  const [style,   setStyle]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<OnboardingState>('/onboarding/state');
        if (cancelled) return;
        setCountry(res.data.countryCode ?? '');
        setSellsTo(res.data.sellsToCountries ?? []);
        setGoal(res.data.businessGoal);
        setStyle(res.data.marketingStyle);
      } catch {
        if (!cancelled) showToast('error', 'Could not load business profile.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSellsTo = (code: string) => {
    setSellsTo(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleSave = async () => {
    if (!country) {
      showToast('error', 'Select your country.');
      return;
    }
    if (sellsTo.length === 0) {
      showToast('error', 'Select at least one country you sell to.');
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        countryCode:      country,
        sellsToCountries: sellsTo,
      };
      if (goal)  body.businessGoal   = goal;
      if (style) body.marketingStyle = style;

      await api.patch('/onboarding/profile', body);
      showToast('success', 'Business profile saved.');
    } catch (e: any) {
      const msg = e?.response?.data?.issues?.[0]?.message
               ?? e?.response?.data?.message
               ?? 'Could not save.';
      showToast('error', msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 flex items-center justify-center h-32">
        <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Where you sell */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <h2 className="font-display font-700 text-white mb-1">Where you sell</h2>
        <p className="text-xs text-slate-400 mb-5">
          Determines which integrations and content we show you. Changing this may unlock or hide platform-specific features.
        </p>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Country you are based in
            </label>
            <select value={country} onChange={e => setCountry(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">Select country</option>
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Countries you sell to
            </label>

            {sellsTo.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3 p-3 bg-slate-900 rounded-lg border border-slate-700">
                {sellsTo.map(code => {
                  const opt = SELLS_TO_OPTIONS.find(o => o.code === code);
                  return (
                    <span key={code}
                      className="inline-flex items-center gap-1 bg-brand-600/20 text-brand-300 text-xs font-medium px-2 py-1 rounded-md"
                    >
                      {opt?.name ?? code}
                      <button onClick={() => toggleSellsTo(code)}
                        className="hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-1 max-h-48 overflow-y-auto border border-slate-700 rounded-lg p-2">
              {SELLS_TO_OPTIONS.map(opt => (
                <label key={opt.code}
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-700/50 rounded cursor-pointer text-xs"
                >
                  <input type="checkbox"
                    checked={sellsTo.includes(opt.code)}
                    onChange={() => toggleSellsTo(opt.code)}
                    className="w-3.5 h-3.5 accent-brand-600"
                  />
                  <span className="text-slate-300">{opt.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Business goal */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <h2 className="font-display font-700 text-white mb-1">Business goal</h2>
        <p className="text-xs text-slate-400 mb-5">
          Shapes how the AI prioritises recommendations.
        </p>

        <div className="space-y-2">
          {GOALS.map(g => {
            const Icon = g.Icon;
            const isSelected = goal === g.slug;
            return (
              <button key={g.slug} onClick={() => setGoal(g.slug)}
                className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-brand-500 bg-brand-500/10'
                    : 'border-slate-700 hover:border-slate-600 bg-slate-900/30'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isSelected ? 'bg-brand-600 text-white' : 'bg-slate-700 text-slate-400'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white text-sm">{g.title}</div>
                  <div className="text-xs text-slate-400">{g.sub}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Marketing style */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <h2 className="font-display font-700 text-white mb-1">Marketing style</h2>
        <p className="text-xs text-slate-400 mb-5">
          Same data, different recommendations.
        </p>

        <div className="space-y-2">
          {STYLES.map(s => {
            const Icon = s.Icon;
            const isSelected = style === s.slug;
            return (
              <button key={s.slug} onClick={() => setStyle(s.slug)}
                className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-brand-500 bg-brand-500/10'
                    : 'border-slate-700 hover:border-slate-600 bg-slate-900/30'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isSelected ? 'bg-brand-600 text-white' : 'bg-slate-700 text-slate-400'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white text-sm">{s.title}</div>
                  <div className="text-xs text-slate-400">{s.sub}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <button onClick={handleSave} disabled={saving}
        className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
      >
        {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {saving ? 'Saving...' : 'Save changes'}
      </button>
    </div>
  );
}

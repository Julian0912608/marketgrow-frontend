'use client';

// ============================================================
// app/onboarding/components/Step1Country.tsx
//
// Step 1 (forced): country + sells-to countries.
// Country list moet 1-op-1 matchen met backend ALLOWED_COUNTRY_CODES.
// ============================================================

import { useState } from 'react';
import { ArrowRight, Loader2, X } from 'lucide-react';
import { api } from '@/lib/api';

const COUNTRIES = [
  { code: 'AT', name: 'Austria' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'HR', name: 'Croatia' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'DK', name: 'Denmark' },
  { code: 'EE', name: 'Estonia' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'GR', name: 'Greece' },
  { code: 'HU', name: 'Hungary' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IT', name: 'Italy' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'MT', name: 'Malta' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'RO', name: 'Romania' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'ES', name: 'Spain' },
  { code: 'SE', name: 'Sweden' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'NO', name: 'Norway' },
  { code: 'CH', name: 'Switzerland' },
] as const;

const SELLS_TO_OPTIONS = [
  ...COUNTRIES,
  { code: 'GLOBAL', name: 'Global (other countries)' },
] as const;

interface Step1CountryProps {
  initial: {
    countryCode:      string | null;
    sellsToCountries: string[] | null;
  };
  onCompleted: () => void;
}

export function Step1Country({ initial, onCompleted }: Step1CountryProps) {
  const [country, setCountry] = useState(initial.countryCode ?? '');
  const [sellsTo, setSellsTo] = useState<string[]>(initial.sellsToCountries ?? []);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleCountryChange = (code: string) => {
    setCountry(code);
    if (sellsTo.length === 0 && code) {
      setSellsTo([code]);
    }
  };

  const toggleSellsTo = (code: string) => {
    setSellsTo(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleSubmit = async () => {
    if (!country) {
      setError('Please select the country you are based in.');
      return;
    }
    if (sellsTo.length === 0) {
      setError('Select at least one country you sell to.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/onboarding/step-1', {
        countryCode:      country,
        sellsToCountries: sellsTo,
      });
      onCompleted();
    } catch (e: any) {
      const issues = e?.response?.data?.issues;
      if (issues?.length) {
        setError(issues.map((i: any) => i.message).join(' '));
      } else {
        setError(e?.response?.data?.message ?? 'Could not save. Try again.');
      }
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <p className="text-slate-600 text-sm">
        This determines which integrations and content we show you. You can change it later in settings.
      </p>

      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-2">
          Where are you based?
        </label>
        <select value={country}
          onChange={e => handleCountryChange(e.target.value)}
          className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        >
          <option value="">Select your country</option>
          {COUNTRIES.map(c => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-2">
          Which countries do you sell to?
        </label>
        <p className="text-xs text-slate-500 mb-3">
          Select all that apply. We will tailor compliance and integration guidance accordingly.
        </p>

        {sellsTo.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            {sellsTo.map(code => {
              const opt = SELLS_TO_OPTIONS.find(o => o.code === code);
              return (
                <span key={code}
                  className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 text-xs font-medium px-2 py-1 rounded-md"
                >
                  {opt?.name ?? code}
                  <button onClick={() => toggleSellsTo(code)}
                    className="hover:text-brand-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-1 max-h-64 overflow-y-auto border border-slate-200 rounded-lg p-2">
          {SELLS_TO_OPTIONS.map(opt => (
            <label key={opt.code}
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer text-sm"
            >
              <input type="checkbox"
                checked={sellsTo.includes(opt.code)}
                onChange={() => toggleSellsTo(opt.code)}
                className="w-4 h-4 accent-brand-600"
              />
              <span className="text-slate-700">{opt.name}</span>
            </label>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <button onClick={handleSubmit}
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all text-sm"
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>Continue <ArrowRight className="w-4 h-4" /></>
        )}
      </button>
    </div>
  );
}

'use client';

// ============================================================
// app/admin/feature-flags/page.tsx
//
// V0 Gap 1 admin: Country-aware feature flag matrix beheer.
//
// Layout:
//   Rows    = feature keys (1 per feature)
//   Cols    = global (NULL) + per country override
//   Cells   = toggle on/off (klik = optimistic update + PUT)
//   Delete  = X knop op country overrides verwijdert de row
//   Add country override = dropdown met ISO codes naast row
//   Add new feature row  = footer form (key, enabled global default)
//
// Auth: middleware.ts redirected naar /admin/login als geen session.
// API:  via /api/admin-proxy/admin/feature-flags
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2, RefreshCw, X, Plus, Check, AlertCircle,
  ChevronLeft, Globe2, Trash2,
} from 'lucide-react';
import Link from 'next/link';

// ── Types ─────────────────────────────────────────────────────
interface FlagRow {
  id:              string;
  feature_key:     string;
  country_code:    string | null;
  enabled:         boolean;
  default_enabled: boolean;
  description:     string | null;
  updated_at:      string;
}

interface ListResponse {
  rows:      FlagRow[];
  countries: string[];
  fetchedAt: string;
}

// ISO 3166-1 alpha-2 voor Europese targetmarkt — uitbreidbaar.
const COUNTRY_OPTIONS = [
  'NL', 'BE', 'DE', 'FR', 'ES', 'IT', 'AT', 'PT',
  'IE', 'LU', 'PL', 'SE', 'DK', 'FI', 'NO',
];

// ── API helpers ───────────────────────────────────────────────
const API = '/api/admin-proxy/admin/feature-flags';

async function apiList(): Promise<ListResponse> {
  const res = await fetch(API, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Load failed: ${res.status}`);
  return res.json();
}

async function apiUpsert(body: {
  feature_key: string;
  country_code: string | null;
  enabled: boolean;
  description?: string | null;
}): Promise<void> {
  const res = await fetch(API, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Upsert failed: ${res.status}`);
  }
}

async function apiDelete(body: {
  feature_key: string;
  country_code: string | null;
}): Promise<void> {
  const res = await fetch(API, {
    method:  'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Delete failed: ${res.status}`);
  }
}

// ── Component ─────────────────────────────────────────────────
export default function AdminFeatureFlagsPage() {
  const [rows,        setRows]        = useState<FlagRow[]>([]);
  const [countries,   setCountries]   = useState<string[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [saving,      setSaving]      = useState<string | null>(null);
  const [fetchedAt,   setFetchedAt]   = useState('');

  // New feature form state
  const [newKey,         setNewKey]         = useState('');
  const [newDesc,        setNewDesc]        = useState('');
  const [newEnabled,     setNewEnabled]     = useState(false);
  const [newSubmitting,  setNewSubmitting]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiList();
      setRows(data.rows);
      setCountries(data.countries);
      setFetchedAt(data.fetchedAt);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load feature flags');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Derive matrix structure: { feature_key: { global: row?, byCountry: { NL: row, ... } } }
  const featureKeys = Array.from(new Set(rows.map(r => r.feature_key))).sort();

  const getRow = (key: string, country: string | null): FlagRow | undefined => {
    return rows.find(r =>
      r.feature_key === key &&
      ((country === null && r.country_code === null) || r.country_code === country)
    );
  };

  // Build matrix cell key voor saving lock
  const cellKey = (key: string, country: string | null) =>
    `${key}::${country ?? '_global'}`;

  // ── Toggle / upsert ─────────────────────────────────────────
  const handleToggle = async (key: string, country: string | null, currentEnabled: boolean) => {
    const lockKey = cellKey(key, country);
    setSaving(lockKey);
    setError('');

    // Optimistic update
    setRows(prev => prev.map(r => {
      if (r.feature_key === key &&
          ((country === null && r.country_code === null) || r.country_code === country)) {
        return { ...r, enabled: !currentEnabled };
      }
      return r;
    }));

    try {
      await apiUpsert({
        feature_key:  key,
        country_code: country,
        enabled:      !currentEnabled,
      });
    } catch (e: any) {
      setError(e.message ?? 'Toggle failed');
      // Revert optimistic
      await load();
    } finally {
      setSaving(null);
    }
  };

  // ── Add country override ───────────────────────────────────
  const handleAddCountryOverride = async (key: string, country: string) => {
    const lockKey = cellKey(key, country);
    setSaving(lockKey);
    setError('');
    try {
      // Default: zet override op true (typisch use case is "enable in dit land")
      await apiUpsert({
        feature_key:  key,
        country_code: country,
        enabled:      true,
      });
      await load();
    } catch (e: any) {
      setError(e.message ?? 'Add override failed');
    } finally {
      setSaving(null);
    }
  };

  // ── Delete country override (global mag niet) ──────────────
  const handleDeleteOverride = async (key: string, country: string) => {
    if (!confirm(`Remove ${country} override for "${key}"?`)) return;
    const lockKey = cellKey(key, country);
    setSaving(lockKey);
    setError('');
    try {
      await apiDelete({ feature_key: key, country_code: country });
      await load();
    } catch (e: any) {
      setError(e.message ?? 'Delete failed');
    } finally {
      setSaving(null);
    }
  };

  // ── Add new feature ─────────────────────────────────────────
  const handleAddFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;
    if (!/^[a-z0-9_]+$/.test(newKey)) {
      setError('feature_key must be snake_case (a-z, 0-9, _)');
      return;
    }

    setNewSubmitting(true);
    setError('');
    try {
      await apiUpsert({
        feature_key:  newKey.trim(),
        country_code: null,
        enabled:      newEnabled,
        description:  newDesc.trim() || null,
      });
      setNewKey('');
      setNewDesc('');
      setNewEnabled(false);
      await load();
    } catch (e: any) {
      setError(e.message ?? 'Create failed');
    } finally {
      setNewSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin-auth/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  };

  // ── Render ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              title="Back to admin"
            >
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            </Link>
            <h1 className="text-base font-bold text-slate-900">Feature flags</h1>
            <span className="text-xs text-slate-400">
              {fetchedAt && `Updated ${new Date(fetchedAt).toLocaleTimeString('nl-NL')}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
            </button>
            <button
              onClick={handleLogout}
              className="text-xs text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </span>
            <button onClick={() => setError('')}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Info banner */}
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 text-sm px-4 py-3 rounded-xl mb-6">
          <strong className="font-semibold">How resolution works:</strong>{' '}
          For each tenant, the country-specific row wins if present. Otherwise the global (NULL) row applies.
          If neither exists, the flag defaults to <code className="bg-white px-1 rounded">false</code>.
          Cache: changes propagate within ~5 seconds (Redis invalidate on every write).
        </div>

        {/* Matrix */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-slate-700 sticky left-0 bg-slate-50 z-10 min-w-[240px]">
                    Feature key
                  </th>
                  <th className="px-3 py-3 font-semibold text-slate-700 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Globe2 className="w-3.5 h-3.5" />
                      Global
                    </div>
                  </th>
                  {countries.map(c => (
                    <th key={c} className="px-3 py-3 font-semibold text-slate-700 text-center min-w-[80px]">
                      {c}
                    </th>
                  ))}
                  <th className="px-3 py-3 font-semibold text-slate-700 text-left min-w-[200px]">
                    Add country
                  </th>
                </tr>
              </thead>
              <tbody>
                {featureKeys.map(key => {
                  const globalRow = getRow(key, null);
                  const description = globalRow?.description
                    ?? rows.find(r => r.feature_key === key)?.description;

                  return (
                    <tr key={key} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      {/* Feature key + description */}
                      <td className="px-5 py-3 sticky left-0 bg-white hover:bg-slate-50/50 z-10">
                        <div className="font-mono text-xs text-slate-900 font-medium">{key}</div>
                        {description && (
                          <div className="text-xs text-slate-500 mt-0.5 max-w-xs truncate" title={description}>
                            {description}
                          </div>
                        )}
                      </td>

                      {/* Global cell */}
                      <td className="px-3 py-3 text-center">
                        <ToggleCell
                          row={globalRow}
                          locked={saving === cellKey(key, null)}
                          onToggle={() => globalRow && handleToggle(key, null, globalRow.enabled)}
                        />
                      </td>

                      {/* Country override cells */}
                      {countries.map(c => {
                        const row = getRow(key, c);
                        const lk = cellKey(key, c);
                        return (
                          <td key={c} className="px-3 py-3 text-center">
                            {row ? (
                              <div className="flex items-center justify-center gap-1">
                                <ToggleCell
                                  row={row}
                                  locked={saving === lk}
                                  onToggle={() => handleToggle(key, c, row.enabled)}
                                />
                                <button
                                  onClick={() => handleDeleteOverride(key, c)}
                                  disabled={saving === lk}
                                  className="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors disabled:opacity-30"
                                  title={`Remove ${c} override`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-300 text-xs">—</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Add country */}
                      <td className="px-3 py-3">
                        <AddCountrySelect
                          existing={countries}
                          onAdd={(c) => handleAddCountryOverride(key, c)}
                          locked={Object.values(COUNTRY_OPTIONS).some(c =>
                            saving === cellKey(key, c as string)
                          )}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add new feature */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mt-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Add new feature flag</h2>
          <form onSubmit={handleAddFeature} className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <input
              type="text"
              placeholder="feature_key (e.g. weekly_briefing)"
              value={newKey}
              onChange={e => setNewKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              className="md:col-span-3 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              maxLength={100}
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              className="md:col-span-6 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              maxLength={500}
            />
            <label className="md:col-span-2 flex items-center gap-2 px-3 text-sm text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={newEnabled}
                onChange={e => setNewEnabled(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Default ON
            </label>
            <button
              type="submit"
              disabled={!newKey.trim() || newSubmitting}
              className="md:col-span-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              {newSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </button>
          </form>
          <p className="text-xs text-slate-500 mt-3">
            Creates a <code className="bg-slate-100 px-1 rounded">country_code = NULL</code> (global) row.
            Add country overrides via the matrix.
          </p>
        </div>
      </main>
    </div>
  );
}

// ── Sub components ────────────────────────────────────────────
function ToggleCell({
  row, locked, onToggle,
}: {
  row?: FlagRow;
  locked: boolean;
  onToggle: () => void;
}) {
  if (!row) {
    return <span className="text-slate-300 text-xs">—</span>;
  }
  return (
    <button
      onClick={onToggle}
      disabled={locked}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${
        row.enabled ? 'bg-emerald-500' : 'bg-slate-300'
      }`}
      title={row.enabled ? 'Click to disable' : 'Click to enable'}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
          row.enabled ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
      {locked && (
        <Loader2 className="absolute -right-5 top-0.5 w-3.5 h-3.5 animate-spin text-slate-400" />
      )}
    </button>
  );
}

function AddCountrySelect({
  existing, onAdd, locked,
}: {
  existing: string[];
  onAdd: (country: string) => void;
  locked: boolean;
}) {
  const [value, setValue] = useState('');
  const available = COUNTRY_OPTIONS.filter(c => !existing.includes(c));

  const submit = () => {
    if (value) {
      onAdd(value);
      setValue('');
    }
  };

  return (
    <div className="flex items-center gap-1">
      <select
        value={value}
        onChange={e => setValue(e.target.value)}
        disabled={locked || available.length === 0}
        className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
      >
        <option value="">+ Country</option>
        {available.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <button
        onClick={submit}
        disabled={!value || locked}
        className="p-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded disabled:opacity-30 transition-colors"
        title="Add country override"
      >
        <Check className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

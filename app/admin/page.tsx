'use client';

// ============================================================
// Admin Monitoring Dashboard — app/admin/page.tsx
//
// Auth: gaat via /api/admin-proxy/* (Vercel server route).
// Pause/Cancel/Reactivate: fail-fast, Stripe call eerst.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users, TrendingUp, AlertCircle, CheckCircle,
  RefreshCw, Search, X, Zap,
  CreditCard, Activity, Settings,
  ArrowUpRight, ArrowDownRight, Eye,
  RotateCcw, ExternalLink, Flag, Briefcase,
  Loader2, Pause, Play, XCircle,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────
interface Tenant {
  id:             string;
  name:           string;
  email:          string;
  slug:           string;
  plan_slug:      'starter' | 'growth' | 'scale';
  status:         'active' | 'suspended' | 'cancelled';
  billing_status: 'active' | 'trialing' | 'past_due' | 'cancelled';
  integrations:   number;
  ai_credits_used: number;
  ai_credits_limit: number | null;
  created_at:     string;
  last_active_at: string | null;
  stripe_customer_id: string | null;
  mrr_cents:      number;
}

interface KPIs {
  mrr:              number;
  mrr_growth:       number;
  active_tenants:   number;
  trialing_tenants: number;
  past_due:         number;
  churn_30d:        number;
  new_30d:          number;
  trial_conversion: number;
  mrr_by_plan: {
    starter: number;
    growth:  number;
    scale:   number;
  };
}

interface OnboardingDetails {
  status:           'in_progress' | 'skipped' | 'completed';
  step:             number;
  completedAt:      string | null;
  countryCode:      string | null;
  sellsToCountries: string[] | null;
  businessGoal:     string | null;
  marketingStyle:   string | null;
  shopConnected:    boolean;
}

interface BillingStatus {
  tenantStatus:          'active' | 'suspended' | 'cancelled';
  pausedAt:              string | null;
  subscriptionStatus:    'active' | 'trialing' | 'past_due' | 'cancelled' | null;
  hasStripeSub:          boolean;
  hasStripeCustomer:     boolean;
  stripeStatus:          string | null;
  stripeMissing:         boolean;
  stripePauseCollection: boolean;
  driftDetected:         boolean;
  canPause:              boolean;
  canCancel:             boolean;
  canReactivate:         boolean;
}

// ── Display labels ────────────────────────────────────────────
const COUNTRY_NAMES: Record<string, string> = {
  AT: 'Austria',         BE: 'Belgium',         BG: 'Bulgaria',
  HR: 'Croatia',         CY: 'Cyprus',          CZ: 'Czech Republic',
  DK: 'Denmark',         EE: 'Estonia',         FI: 'Finland',
  FR: 'France',          DE: 'Germany',         GR: 'Greece',
  HU: 'Hungary',         IE: 'Ireland',         IT: 'Italy',
  LV: 'Latvia',          LT: 'Lithuania',       LU: 'Luxembourg',
  MT: 'Malta',           NL: 'Netherlands',     PL: 'Poland',
  PT: 'Portugal',        RO: 'Romania',         SK: 'Slovakia',
  SI: 'Slovenia',        ES: 'Spain',           SE: 'Sweden',
  GB: 'United Kingdom',  NO: 'Norway',          CH: 'Switzerland',
  GLOBAL: 'Global (other countries)',
};

const GOAL_LABELS: Record<string, string> = {
  'lifestyle':     'Lifestyle income',
  'steady':        'Steady growth',
  'scale-to-exit': 'Scale to exit',
  'side-project':  'Side project',
};

const STYLE_LABELS: Record<string, string> = {
  'paid':    'Aggressive paid',
  'organic': 'Organic and content first',
  'mix':     'A mix of both',
};

const ONBOARDING_STATUS_COLORS: Record<string, string> = {
  completed:   'bg-emerald-100 text-emerald-700',
  skipped:     'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
};

const ONBOARDING_STATUS_LABELS: Record<string, string> = {
  completed:   'Voltooid',
  skipped:     'Overgeslagen',
  in_progress: 'Bezig',
};

// ── API helper ────────────────────────────────────────────────
const adminApi = {
  base: '/api/admin-proxy',

  async get<T>(path: string): Promise<T> {
    const res = await fetch(this.base + path, {
      method:      'GET',
      cache:       'no-store',
      credentials: 'include',
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(this.base + path, {
      method:      'POST',
      cache:       'no-store',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify(body),
    });
    if (!res.ok) {
      let msg = `${res.status}`;
      try {
        const err = await res.json();
        msg = err.message ?? err.error ?? msg;
      } catch {}
      throw new Error(msg);
    }
    return res.json();
  },
};

// ── Kleine herbruikbare componenten ──────────────────────────
function KPICard({
  title, value, sub, trend, icon: Icon, color,
}: {
  title: string;
  value: string;
  sub?: string;
  trend?: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-900 mb-1">{value}</div>
      {(sub || trend !== undefined) && (
        <div className="flex items-center gap-2">
          {trend !== undefined && (
            <span className={`flex items-center text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {trend >= 0
                ? <ArrowUpRight className="w-3 h-3" />
                : <ArrowDownRight className="w-3 h-3" />
              }
              {Math.abs(trend)}%
            </span>
          )}
          {sub && <span className="text-xs text-slate-400">{sub}</span>}
        </div>
      )}
    </div>
  );
}

const PLAN_COLORS: Record<string, string> = {
  starter: 'bg-slate-100 text-slate-700',
  growth:  'bg-brand-100 text-brand-700',
  scale:   'bg-violet-100 text-violet-700',
};

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-emerald-100 text-emerald-700',
  trialing:  'bg-amber-100 text-amber-700',
  past_due:  'bg-red-100 text-red-700',
  suspended: 'bg-slate-100 text-slate-500',
  cancelled: 'bg-red-50 text-red-400',
};

// ── Onboarding sectie ────────────────────────────────────────
function OnboardingSection({ tenantId }: { tenantId: string }) {
  const [data, setData] = useState<OnboardingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminApi.get<OnboardingDetails>(`/admin/tenants/${tenantId}/onboarding`);
        if (!cancelled) setData(res);
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? 'Ophalen mislukt');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tenantId]);

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-900">Onboarding</h3>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-center">
          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-900">Onboarding</h3>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-700">
          {error ?? 'Geen data'}
        </div>
      </div>
    );
  }

  const sellsToDisplay = data.sellsToCountries && data.sellsToCountries.length > 0
    ? data.sellsToCountries.map(c => COUNTRY_NAMES[c] ?? c).join(', ')
    : null;

  const completedDate = data.completedAt
    ? new Date(data.completedAt).toLocaleDateString('nl-NL', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-900">Onboarding</h3>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ONBOARDING_STATUS_COLORS[data.status] ?? ''}`}>
          {ONBOARDING_STATUS_LABELS[data.status] ?? data.status}
        </span>
      </div>

      <div className="bg-slate-50 rounded-xl p-4 space-y-3">
        <div>
          <div className="text-xs text-slate-500 mb-0.5">Gevestigd in</div>
          <div className="text-sm font-medium text-slate-900">
            {data.countryCode
              ? COUNTRY_NAMES[data.countryCode] ?? data.countryCode
              : <span className="text-slate-400 italic">Niet ingevuld</span>
            }
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500 mb-0.5">Verkoopt aan</div>
          <div className="text-sm font-medium text-slate-900">
            {sellsToDisplay ?? <span className="text-slate-400 italic">Niet ingevuld</span>}
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500 mb-0.5">Business goal</div>
          <div className="text-sm font-medium text-slate-900">
            {data.businessGoal
              ? GOAL_LABELS[data.businessGoal] ?? data.businessGoal
              : <span className="text-slate-400 italic">Niet ingevuld</span>
            }
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500 mb-0.5">Marketing style</div>
          <div className="text-sm font-medium text-slate-900">
            {data.marketingStyle
              ? STYLE_LABELS[data.marketingStyle] ?? data.marketingStyle
              : <span className="text-slate-400 italic">Niet ingevuld</span>
            }
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            {data.shopConnected
              ? <><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Store gekoppeld</>
              : <><X className="w-3.5 h-3.5 text-slate-400" /> Geen store gekoppeld</>
            }
          </div>
          {completedDate && (
            <div className="text-slate-500">
              Afgerond op {completedDate}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Billing actions sectie ───────────────────────────────────
function BillingActionsSection({
  tenantId, onRefresh,
}: {
  tenantId: string;
  onRefresh: () => void;
}) {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<'pause' | 'cancel' | 'reactivate' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<'cancel' | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.get<BillingStatus>(`/admin/tenants/${tenantId}/billing-status`);
      setStatus(res);
    } catch (e: any) {
      setError(e.message ?? 'Ophalen mislukt');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (action: 'pause' | 'cancel' | 'reactivate') => {
    setActing(action);
    setError(null);
    try {
      await adminApi.post(`/admin/tenants/${tenantId}/${action}`, {});
      await load();
      onRefresh();
      setConfirm(null);
    } catch (e: any) {
      setError(e.message ?? 'Actie mislukt');
    } finally {
      setActing(null);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-900">Abonnement beheren</h3>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-center">
          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-900">Abonnement beheren</h3>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-700">
          {error ?? 'Geen data'}
        </div>
      </div>
    );
  }

  let statusLabel = '';
  let statusColor = '';
  if (status.tenantStatus === 'active') {
    statusLabel = 'Actief';
    statusColor = 'bg-emerald-100 text-emerald-700';
  } else if (status.tenantStatus === 'suspended' && status.pausedAt) {
    statusLabel = 'Gepauzeerd';
    statusColor = 'bg-amber-100 text-amber-700';
  } else if (status.tenantStatus === 'suspended') {
    statusLabel = 'Opgeschort (legacy)';
    statusColor = 'bg-slate-100 text-slate-500';
  } else {
    statusLabel = 'Geannuleerd';
    statusColor = 'bg-red-50 text-red-400';
  }

  const pausedDate = status.pausedAt
    ? new Date(status.pausedAt).toLocaleDateString('nl-NL', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-900">Abonnement beheren</h3>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      <div className="bg-slate-50 rounded-xl p-4 space-y-3">

        {pausedDate && (
          <div className="text-xs text-slate-600">
            Gepauzeerd sinds {pausedDate}
          </div>
        )}

        {/* DRIFT WAARSCHUWING: DB en Stripe matchen niet */}
        {status.driftDetected && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              Drift gedetecteerd
            </div>
            <div>
              DB zegt <strong>{status.tenantStatus}</strong>, maar Stripe sub is{' '}
              {status.stripeMissing ? <strong>verdwenen</strong> : <><strong>{status.stripeStatus}</strong></>}.
              Klik &quot;Definitief annuleren&quot; om de DB te syncen.
            </div>
          </div>
        )}

        {!status.hasStripeSub && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
            Geen Stripe subscription gekoppeld. Pause / reactivate niet beschikbaar.
          </div>
        )}

        {error && (
          <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {confirm === 'cancel' ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-3">
            <p className="text-xs text-red-700">
              <strong>Permanent annuleren?</strong> De Stripe subscription wordt gecanceld.
              Klant kan alleen terugkeren via een nieuwe checkout.
            </p>
            <div className="flex gap-2">
              <button onClick={() => handleAction('cancel')}
                disabled={acting !== null}
                className="bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-50"
              >
                {acting === 'cancel' && <Loader2 className="w-3 h-3 animate-spin" />}
                <XCircle className="w-3 h-3" />
                Ja, definitief annuleren
              </button>
              <button onClick={() => setConfirm(null)}
                disabled={acting !== null}
                className="text-slate-600 hover:text-slate-900 text-xs px-3 py-1.5"
              >
                Terug
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">

            {status.canPause && (
              <button onClick={() => handleAction('pause')}
                disabled={acting !== null}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-sm font-medium text-amber-800 transition-colors text-left disabled:opacity-50"
              >
                {acting === 'pause'
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Pause className="w-4 h-4" />
                }
                Pauzeren (geen incasso, omkeerbaar)
              </button>
            )}

            {status.canReactivate && (
              <button onClick={() => handleAction('reactivate')}
                disabled={acting !== null}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-sm font-medium text-emerald-800 transition-colors text-left disabled:opacity-50"
              >
                {acting === 'reactivate'
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Play className="w-4 h-4" />
                }
                Heractiveren (incasso hervat volgende cycle)
              </button>
            )}

            {status.canCancel && (
              <button onClick={() => setConfirm('cancel')}
                disabled={acting !== null}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 hover:bg-red-100 text-sm font-medium text-red-700 transition-colors text-left disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                {status.driftDetected
                  ? 'Definitief annuleren (DB syncen met Stripe)'
                  : 'Definitief annuleren (Stripe sub. weg)'
                }
              </button>
            )}

            {!status.canPause && !status.canReactivate && !status.canCancel && (
              <p className="text-xs text-slate-500 italic">
                Geen acties beschikbaar voor deze tenant.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
// ── Klant detail / beheer panel ───────────────────────────────
function TenantPanel({
  tenant, onClose, onRefresh,
}: {
  tenant: Tenant;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [msg,     setMsg]     = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const act = async (label: string, fn: () => Promise<void>) => {
    setLoading(label);
    setMsg(null);
    try {
      await fn();
      setMsg({ type: 'ok', text: `${label} succesvol` });
      onRefresh();
    } catch (e: any) {
      setMsg({ type: 'err', text: e.message });
    } finally {
      setLoading(null);
    }
  };

  const changePlan = (slug: string) =>
    act('Plan wijzigen', () =>
      adminApi.post(`/admin/tenants/${tenant.id}/change-plan`, { planSlug: slug })
    );

  const resetCredits = () =>
    act('Credits resetten', () =>
      adminApi.post(`/admin/tenants/${tenant.id}/reset-credits`, {})
    );

  const impersonate = async () => {
    const res = await adminApi.post<{ token: string; url: string }>(
      `/admin/tenants/${tenant.id}/impersonate`, {}
    );
    window.open(res.url + '?impersonate=' + res.token, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-end z-50">
      <div className="bg-white h-full w-full max-w-md overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="font-bold text-slate-900">{tenant.name}</h2>
            <p className="text-sm text-slate-500">{tenant.email}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {msg && (
            <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-lg ${
              msg.type === 'ok'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {msg.type === 'ok'
                ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
                : <AlertCircle className="w-4 h-4 flex-shrink-0" />
              }
              {msg.text}
            </div>
          )}

          {/* Overzicht */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Plan',         value: tenant.plan_slug },
              { label: 'Status',       value: tenant.billing_status },
              { label: 'Integraties',  value: String(tenant.integrations) },
              { label: 'AI credits',   value: tenant.ai_credits_limit
                                              ? `${tenant.ai_credits_used} / ${tenant.ai_credits_limit}`
                                              : `${tenant.ai_credits_used} / ∞` },
              { label: 'MRR',          value: `€${(tenant.mrr_cents / 100).toFixed(0)}` },
              { label: 'Lid sinds',    value: new Date(tenant.created_at).toLocaleDateString('nl-NL') },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3">
                <div className="text-xs text-slate-500 mb-1">{label}</div>
                <div className="text-sm font-semibold text-slate-900">{value}</div>
              </div>
            ))}
          </div>

          {/* Onboarding */}
          <OnboardingSection tenantId={tenant.id} />

          {/* Billing actions (NIEUW) */}
          <BillingActionsSection tenantId={tenant.id} onRefresh={onRefresh} />

          {/* Plan wijzigen */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Plan wijzigen</h3>
            <div className="grid grid-cols-3 gap-2">
              {(['starter', 'growth', 'scale'] as const).map(slug => (
                <button key={slug}
                  onClick={() => changePlan(slug)}
                  disabled={loading === 'Plan wijzigen' || tenant.plan_slug === slug}
                  className={`py-2 rounded-lg text-xs font-semibold transition-all capitalize ${
                    tenant.plan_slug === slug
                      ? 'bg-brand-600 text-white cursor-default'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50'
                  }`}
                >
                  {loading === 'Plan wijzigen' && tenant.plan_slug !== slug
                    ? '...'
                    : slug
                  }
                </button>
              ))}
            </div>
          </div>

          {/* Overige acties (zonder suspend, die zit nu in BillingActionsSection) */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Overige acties</h3>
            <div className="space-y-2">
              <button onClick={impersonate}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-700 transition-colors text-left"
              >
                <Eye className="w-4 h-4 text-slate-500" />
                Inloggen als klant (impersonation)
                <ExternalLink className="w-3.5 h-3.5 ml-auto text-slate-400" />
              </button>

              <button onClick={resetCredits}
                disabled={loading === 'Credits resetten'}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-700 transition-colors text-left disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4 text-slate-500" />
                {loading === 'Credits resetten' ? 'Bezig...' : 'AI credits deze maand resetten'}
              </button>
            </div>
          </div>

          {/* Stripe link */}
          {tenant.stripe_customer_id && (
            <a href={`https://dashboard.stripe.com/customers/${tenant.stripe_customer_id}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              <CreditCard className="w-4 h-4" />
              Bekijk in Stripe dashboard
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Hoofd dashboard ───────────────────────────────────────────
export default function AdminDashboard() {
  const [kpis,            setKpis]            = useState<KPIs | null>(null);
  const [tenants,         setTenants]         = useState<Tenant[]>([]);
  const [filtered,        setFiltered]        = useState<Tenant[]>([]);
  const [selectedTenant,  setSelectedTenant]  = useState<Tenant | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [search,          setSearch]          = useState('');
  const [planFilter,      setPlanFilter]      = useState('all');
  const [statusFilter,    setStatusFilter]    = useState('all');
  const [activeTab,       setActiveTab]       = useState<'tenants' | 'health'>('tenants');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [kpisData, tenantsData] = await Promise.all([
        adminApi.get<KPIs>('/admin/kpis'),
        adminApi.get<Tenant[]>('/admin/tenants'),
      ]);
      setKpis(kpisData);
      setTenants(tenantsData);
      setFiltered(tenantsData);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    let result = tenants;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q)
      );
    }
    if (planFilter !== 'all')   result = result.filter(t => t.plan_slug === planFilter);
    if (statusFilter !== 'all') result = result.filter(t => t.billing_status === statusFilter);
    setFiltered(result);
  }, [search, planFilter, statusFilter, tenants]);

  const totalMRR = kpis?.mrr ?? 0;

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" fill="white" />
            </div>
            <div>
              <span className="font-bold text-slate-900">MarketGrow</span>
              <span className="text-xs font-medium text-slate-400 ml-2 bg-slate-100 px-2 py-0.5 rounded-full">
                Admin
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/feature-flags"
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Flag className="w-4 h-4" />
              Feature flags
            </Link>
            <button onClick={loadData}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Vernieuwen
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {kpis && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KPICard title="Maandelijkse omzet"
              value={`€${totalMRR.toLocaleString('nl-NL')}`}
              trend={kpis.mrr_growth} sub="vs vorige maand"
              icon={TrendingUp} color="bg-emerald-100 text-emerald-600"
            />
            <KPICard title="Actieve klanten"
              value={String(kpis.active_tenants)}
              sub={`${kpis.trialing_tenants} in trial`}
              icon={Users} color="bg-brand-100 text-brand-600"
            />
            <KPICard title="Nieuwe klanten (30d)"
              value={String(kpis.new_30d)}
              sub={`${kpis.trial_conversion}% trial→paid`}
              icon={Activity} color="bg-violet-100 text-violet-600"
            />
            <KPICard title="Betalingsproblemen"
              value={String(kpis.past_due)}
              sub={`${kpis.churn_30d} opgezegd (30d)`}
              icon={AlertCircle} color="bg-amber-100 text-amber-600"
            />
          </div>
        )}

        {kpis && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-8">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">MRR per plan</h3>
            <div className="grid grid-cols-3 gap-4">
              {(['starter', 'growth', 'scale'] as const).map(slug => {
                const planMRR = kpis.mrr_by_plan[slug];
                const pct     = totalMRR > 0 ? Math.round((planMRR / totalMRR) * 100) : 0;
                return (
                  <div key={slug}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${PLAN_COLORS[slug]}`}>
                        {slug}
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        €{planMRR.toLocaleString('nl-NL')}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{pct}% van totaal</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-1 bg-white rounded-xl border border-slate-200 p-1 w-fit mb-6">
          {([
            { id: 'tenants', label: 'Klanten' },
            { id: 'health',  label: 'Platform gezondheid' },
          ] as const).map(tab => (
            <button key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'tenants' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">

            <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text"
                  placeholder="Zoek op naam, e-mail of slug..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <select value={planFilter} onChange={e => setPlanFilter(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="all">Alle plannen</option>
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="scale">Scale</option>
              </select>

              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="all">Alle statussen</option>
                <option value="active">Actief</option>
                <option value="trialing">Trial</option>
                <option value="past_due">Betaling achterstallig</option>
                <option value="cancelled">Opgezegd</option>
              </select>

              <span className="text-xs text-slate-400 ml-auto">
                {filtered.length} van {tenants.length} klanten
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Klant', 'Plan', 'Status', 'Integraties', 'AI credits', 'MRR', 'Lid sinds', ''].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                        Laden...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                        Geen klanten gevonden
                      </td>
                    </tr>
                  ) : filtered.map(tenant => (
                    <tr key={tenant.id}
                      className="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedTenant(tenant)}
                    >
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-900">{tenant.name}</div>
                        <div className="text-xs text-slate-400">{tenant.email}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${PLAN_COLORS[tenant.plan_slug]}`}>
                          {tenant.plan_slug}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[tenant.billing_status] ?? ''}`}>
                          {tenant.billing_status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{tenant.integrations}</td>
                      <td className="px-5 py-4 text-slate-600">
                        {tenant.ai_credits_limit
                          ? `${tenant.ai_credits_used} / ${tenant.ai_credits_limit}`
                          : `${tenant.ai_credits_used} / ∞`
                        }
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-900">
                        €{(tenant.mrr_cents / 100).toFixed(0)}
                      </td>
                      <td className="px-5 py-4 text-slate-400 text-xs">
                        {new Date(tenant.created_at).toLocaleDateString('nl-NL')}
                      </td>
                      <td className="px-5 py-4">
                        <button onClick={e => { e.stopPropagation(); setSelectedTenant(tenant); }}
                          className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          <Settings className="w-4 h-4 text-slate-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'health' && (
          <div className="grid grid-cols-2 gap-4">
            {[
              { title: 'Job queue (BullMQ)',    endpoint: '/admin/health/queue' },
              { title: 'Redis cache',           endpoint: '/admin/health/redis' },
              { title: 'Database connections',  endpoint: '/admin/health/db' },
              { title: 'API response tijden',   endpoint: '/admin/health/latency' },
            ].map(({ title, endpoint }) => (
              <HealthCard key={endpoint} title={title} endpoint={endpoint} />
            ))}
          </div>
        )}
      </div>

      {selectedTenant && (
        <TenantPanel tenant={selectedTenant}
          onClose={() => setSelectedTenant(null)}
          onRefresh={loadData}
        />
      )}
    </div>
  );
}

function HealthCard({ title, endpoint }: { title: string; endpoint: string }) {
  const [data,    setData]    = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.get<Record<string, unknown>>(endpoint);
      setData(result);
    } catch {
      setData({ error: 'Ophalen mislukt' });
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <button onClick={load} className="p-1 hover:bg-slate-100 rounded transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      {loading ? (
        <div className="h-16 flex items-center justify-center">
          <RefreshCw className="w-4 h-4 animate-spin text-slate-300" />
        </div>
      ) : data ? (
        <pre className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3 overflow-auto max-h-32 font-mono">
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}

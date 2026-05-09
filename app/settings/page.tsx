'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  User, CreditCard, Bell, Shield, Briefcase,
  Check, Loader2, X, CheckCircle,
  Download, Trash2, AlertTriangle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { BusinessProfileTab } from '@/components/settings/BusinessProfileTab';

interface BillingOverview {
  planSlug:          string;
  planName:          string;
  status:            string;
  currentPeriodEnd:  string;
  cancelAtPeriodEnd: boolean;
  invoices: {
    id:          string;
    date:        string;
    amount:      number;
    currency:    string;
    status:      string;
    downloadUrl: string | null;
  }[];
}

const PLANS = [
  {
    slug: 'starter', name: 'Starter', price: 20,
    features: ['1 store', '100 AI credits / month', 'Sales dashboard', 'Order analytics', 'Email support'],
  },
  {
    slug: 'growth', name: 'Growth', price: 49, popular: true,
    features: ['3 stores', '2,000 AI credits / month', 'Everything in Starter', 'AI recommendations', 'Ad analytics', 'Customer LTV', 'Priority support'],
  },
  {
    slug: 'scale', name: 'Scale', price: 150,
    features: ['Unlimited stores', 'Unlimited AI credits', 'Everything in Growth', 'AI ad optimisation', 'White-label dashboard', 'Team accounts', 'API access'],
  },
];

const TABS = [
  { id: 'profile',       label: 'Profile',       icon: User },
  { id: 'business',      label: 'Business',      icon: Briefcase },
  { id: 'billing',       label: 'Billing',       icon: CreditCard },
  { id: 'security',      label: 'Security',      icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

const card  = 'bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6';
const input = 'w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors';

// Inner component zodat we useSearchParams kunnen gebruiken zonder
// Suspense boundary issues op build
function SettingsPageInner() {
  const { user, updateUser, clearAuth } = useAuthStore();
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [activeTab,         setActiveTab]         = useState('profile');
  const [billing,           setBilling]           = useState<BillingOverview | null>(null);
  const [billingLoading,    setBillingLoading]    = useState(false);
  const [upgradeLoading,    setUpgradeLoading]    = useState<string | null>(null);
  const [cancelLoading,     setCancelLoading]     = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading,     setDeleteLoading]     = useState(false);
  const [toast,             setToast]             = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Profile
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName,  setLastName]  = useState(user?.lastName  ?? '');
  const [profileLoading, setProfileLoading] = useState(false);

  // Security
  const [currentPw, setCurrentPw] = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  // Pak query param ?tab=xxx en open die tab. Werkt ook als de
  // gebruiker via de StartSetupCard linkt naar /settings?tab=business.
  useEffect(() => {
    const tab = searchParams?.get('tab');
    if (tab && TABS.some(t => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchBilling = async () => {
    setBillingLoading(true);
    try {
      const res = await api.get('/billing/overview');
      setBilling(res.data);
    } catch {}
    setBillingLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'billing') fetchBilling();
  }, [activeTab]);

  useEffect(() => {
    setFirstName(user?.firstName ?? '');
    setLastName(user?.lastName   ?? '');
  }, [user]);

  const handleProfileSave = async () => {
    setProfileLoading(true);
    try {
      const res = await api.patch('/auth/profile', { firstName, lastName });
      updateUser({ firstName: res.data.firstName, lastName: res.data.lastName });
      showToast('success', 'Profile updated!');
    } catch {
      showToast('error', 'Something went wrong.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPw.length < 8) { showToast('error', 'New password must be at least 8 characters.'); return; }
    if (newPw !== confirmPw) { showToast('error', 'Passwords do not match.'); return; }
    setPwLoading(true);
    try {
      await api.post('/auth/change-password', { currentPassword: currentPw, newPassword: newPw });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      showToast('success', 'Password updated!');
    } catch (e: any) {
      showToast('error', e.response?.data?.message ?? 'Something went wrong.');
    } finally {
      setPwLoading(false);
    }
  };

  const handleUpgrade = async (planSlug: string) => {
    setUpgradeLoading(planSlug);
    try {
      if (!billing) {
        const res = await api.post('/billing/checkout', { planSlug });
        window.location.href = res.data.url;
      } else {
        await api.post('/billing/change-plan', { planSlug });
        await fetchBilling();
        showToast('success', `Plan changed to ${planSlug}!`);
      }
    } catch (e: any) {
      showToast('error', e.response?.data?.message ?? 'Something went wrong.');
    } finally {
      setUpgradeLoading(null);
    }
  };

  const handleCancel = async () => {
    setCancelLoading(true);
    try {
      const res = await api.post('/billing/portal');
      window.location.href = res.data.url;
    } catch (e: any) {
      showToast('error', e.response?.data?.message ?? 'Something went wrong.');
    } finally {
      setCancelLoading(false);
      setShowCancelConfirm(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await api.delete('/auth/account');
      clearAuth();
      router.push('/');
    } catch (e: any) {
      showToast('error', e.response?.data?.message ?? 'Something went wrong. Contact hello@marketgrow.ai to delete your account.');
      setShowDeleteConfirm(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  const currentPlan = billing?.planSlug ?? (user as any)?.planSlug ?? 'starter';
  const isTrialing  = billing?.status === 'trialing';
  const isCancelled = billing?.cancelAtPeriodEnd ?? false;

  return (
    <div className="p-6 max-w-4xl mx-auto">

      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'success'
            ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/20 border border-rose-500/30 text-rose-300'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="mb-8">
        <h1 className="font-display text-2xl font-800 text-white mb-1">Settings</h1>
        <p className="text-slate-400 text-sm">Manage your account and subscription</p>
      </div>

      <div className="flex gap-1 mb-8 bg-slate-800/50 rounded-xl p-1 w-fit overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {activeTab === 'profile' && (
        <div className={card}>
          <h2 className="font-display font-700 text-white mb-6">Profile</h2>
          <div className="space-y-4 max-w-md">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">First name</label>
                <input value={firstName} onChange={e => setFirstName(e.target.value)} className={input} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Last name</label>
                <input value={lastName} onChange={e => setLastName(e.target.value)} className={input} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
              <input value={user?.email ?? ''} disabled className={`${input} opacity-50 cursor-not-allowed`} />
            </div>
            <button onClick={handleProfileSave}
              disabled={profileLoading}
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {profileLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {profileLoading ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      )}

      {/* Business tab */}
      {activeTab === 'business' && (
        <BusinessProfileTab showToast={showToast} />
      )}

      {/* Billing tab */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          {billingLoading ? (
            <div className={`${card} flex items-center justify-center h-32`}>
              <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
            </div>
          ) : billing ? (
            <div className={card}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-display font-700 text-white">Current plan</h2>
                  <p className="text-sm text-slate-400 mt-0.5">
                    {billing.planName} — €{PLANS.find(p => p.slug === billing.planSlug)?.price ?? '?'}/month
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  isTrialing  ? 'bg-amber-500/20 text-amber-400'   :
                  isCancelled ? 'bg-rose-500/20 text-rose-400'     :
                                'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {isTrialing ? 'Trial' : isCancelled ? 'Cancelled' : 'Active'}
                </span>
              </div>

              {billing.currentPeriodEnd && (
                <p className="text-xs text-slate-500 mb-4">
                  {isCancelled ? 'Access until' : 'Next billing on'}{' '}
                  {new Date(billing.currentPeriodEnd).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              )}

              {!isCancelled && (
                <button onClick={() => setShowCancelConfirm(true)}
                  className="text-xs text-slate-500 hover:text-rose-400 transition-colors"
                >
                  Cancel subscription
                </button>
              )}

              {showCancelConfirm && (
                <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                  <p className="text-sm text-rose-300 mb-3">
                    You'll be redirected to the billing portal to cancel. You keep access until the end of your current period.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={handleCancel}
                      disabled={cancelLoading}
                      className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1"
                    >
                      {cancelLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                      Go to billing portal
                    </button>
                    <button onClick={() => setShowCancelConfirm(false)}
                      className="text-slate-400 hover:text-white text-xs px-3 py-1.5"
                    >
                      Keep subscription
                    </button>
                  </div>
                </div>
              )}

              {/* Invoices */}
              {billing.invoices.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-700/50">
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">Invoices</h3>
                  <div className="space-y-2">
                    {billing.invoices.map(inv => (
                      <div key={inv.id} className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0">
                        <div>
                          <p className="text-sm text-white">
                            {new Date(inv.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                          <p className="text-xs text-slate-500 capitalize">{inv.status}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-white">
                            €{inv.amount.toFixed(2)}
                          </span>
                          {inv.downloadUrl && (
                            <a href={inv.downloadUrl} target="_blank" rel="noopener noreferrer"
                              className="w-7 h-7 rounded-lg bg-slate-700/50 hover:bg-slate-700 flex items-center justify-center transition-colors"
                            >
                              <Download className="w-3.5 h-3.5 text-slate-400" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Plan picker */}
          <div>
            <h2 className="font-display font-700 text-white mb-4">
              {billing ? 'Change plan' : 'Choose a plan'}
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {PLANS.map(plan => {
                const isCurrent = currentPlan === plan.slug;
                return (
                  <div key={plan.slug}
                    className={`${card} relative ${(plan as any).popular ? 'border-brand-500/50' : ''}`}
                  >
                    {(plan as any).popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                        Most popular
                      </div>
                    )}
                    <div className="mb-4">
                      <div className="font-display font-700 text-white text-lg">{plan.name}</div>
                      <div className="text-2xl font-display font-800 text-white mt-1">
                        €{plan.price}
                        <span className="text-sm font-normal text-slate-400">/month</span>
                      </div>
                    </div>
                    <ul className="space-y-2 mb-6">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-center gap-2 text-xs text-slate-300">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button onClick={() => { if (!isCurrent) handleUpgrade(plan.slug); }}
                      disabled={isCurrent || upgradeLoading !== null}
                      className={`w-full py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                        isCurrent
                          ? 'bg-slate-700/50 text-slate-500 cursor-default'
                          : 'bg-brand-600 hover:bg-brand-700 text-white'
                      }`}
                    >
                      {upgradeLoading === plan.slug && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      {isCurrent ? 'Current plan' : `Switch to ${plan.name}`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Security tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className={card}>
            <h2 className="font-display font-700 text-white mb-6">Change password</h2>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Current password</label>
                <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} className={input} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">New password</label>
                <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} className={input} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Confirm new password</label>
                <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} className={input} />
              </div>
              <button onClick={handlePasswordChange}
                disabled={pwLoading || !currentPw || !newPw || !confirmPw}
                className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {pwLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {pwLoading ? 'Updating...' : 'Update password'}
              </button>
            </div>
          </div>

          {/* Delete account */}
          <div className={`${card} border-rose-500/20`}>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div>
                <h2 className="font-display font-700 text-white">Delete account</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
            </div>

            {!showDeleteConfirm ? (
              <button onClick={() => setShowDeleteConfirm(true)}
                className="text-xs text-rose-400 hover:text-rose-300 border border-rose-500/30 hover:border-rose-500/50 px-3 py-1.5 rounded-lg transition-colors"
              >
                Delete my account
              </button>
            ) : (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                <p className="text-sm text-rose-300 mb-3 font-medium">
                  Are you absolutely sure? All your data, integrations and history will be permanently deleted.
                </p>
                <div className="flex gap-2">
                  <button onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                    className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1"
                  >
                    {deleteLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                    <Trash2 className="w-3 h-3" />
                    Yes, delete everything
                  </button>
                  <button onClick={() => setShowDeleteConfirm(false)}
                    className="text-slate-400 hover:text-white text-xs px-3 py-1.5"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notifications tab */}
      {activeTab === 'notifications' && (
        <div className={card}>
          <h2 className="font-display font-700 text-white mb-6">Notifications</h2>
          <div className="space-y-4 max-w-md">
            {[
              { label: 'Daily AI briefing', desc: 'Receive your daily AI actions every morning at 7:00', default: true },
              { label: 'Weekly report', desc: 'Monday morning overview of last week\'s performance', default: true },
              { label: 'Trial reminders', desc: 'Reminders before your trial expires', default: true },
              { label: 'Sync alerts', desc: 'Notifications when a store sync fails', default: false },
            ].map(item => (
              <div key={item.label} className="flex items-start justify-between gap-4 py-3 border-b border-slate-700/30 last:border-0">
                <div>
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
                <div className={`w-10 h-5 rounded-full flex-shrink-0 mt-0.5 ${item.default ? 'bg-brand-600' : 'bg-slate-700'} flex items-center ${item.default ? 'justify-end pr-0.5' : 'justify-start pl-0.5'}`}>
                  <div className="w-4 h-4 bg-white rounded-full" />
                </div>
              </div>
            ))}
            <p className="text-xs text-slate-500 pt-2">
              To manage notification preferences in detail, contact <a href="mailto:hello@marketgrow.ai" className="text-brand-400 hover:underline">hello@marketgrow.ai</a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="p-6 max-w-4xl mx-auto flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
      </div>
    }>
      <SettingsPageInner />
    </Suspense>
  );
}

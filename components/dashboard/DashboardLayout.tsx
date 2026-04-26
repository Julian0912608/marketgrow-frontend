'use client';

// components/dashboard/DashboardLayout.tsx
//
// FIX: Nav items zijn nu gated op plan.
// Locked items tonen een slot-icoon en openen de upgrade modal.
// Globale content generatie indicator: toont spinner als AI bezig is.
//
// PR 3a: Meta Studio nav item toegevoegd (gated op 'ad-analytics' = Growth+)

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, TrendingUp, ShoppingBag, Megaphone,
  Plug, Settings, LogOut, Zap, Bell, Menu, Sparkles,
  Instagram, Store, Lock, Users, Wand2,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { usePermissions } from '@/lib/usePermissions';
import { useContentStore } from '@/lib/contentStore';
import { api } from '@/lib/api';
import { UpgradeModal } from '@/components/UpgradeModal';
import { TrialBanner } from '@/components/dashboard/TrialBanner';

import { Loader2 } from 'lucide-react';

// Kleine spinner naast "Social Content" in de sidebar als er gegenereerd wordt
function GeneratingBadge() {
  const status = useContentStore(s => s.status);
  if (status !== 'generating') return null;
  return <Loader2 className="w-3 h-3 animate-spin text-purple-400 flex-shrink-0" />;
}

// feature = null betekent altijd beschikbaar (settings, integrations, etc.)
const navItems = [
  { label: 'Overview',       href: '/dashboard',                feature: null,                   icon: LayoutDashboard },
  { label: 'Shops',          href: '/dashboard/shops',          feature: 'multi-shop',           icon: Store },
  { label: 'Sales',          href: '/dashboard/analytics',      feature: 'order-analytics',      icon: TrendingUp },
  { label: 'Products',       href: '/dashboard/products',       feature: 'order-analytics',      icon: ShoppingBag },
  { label: 'Advertising',    href: '/dashboard/ads',            feature: 'ad-analytics',         icon: Megaphone },
  { label: 'AI Insights',    href: '/dashboard/ai-insights',    feature: 'ai-recommendations',   icon: Sparkles },
  { label: 'Social Content', href: '/dashboard/social-content', feature: 'ai-recommendations',   icon: Instagram },
  { label: 'Meta Studio',    href: '/dashboard/meta-studio',    feature: 'ad-analytics',         icon: Wand2 },
  { label: 'Team',           href: '/dashboard/team',           feature: 'team-accounts',        icon: Users },
  { label: 'Integrations',   href: '/dashboard/integrations',   feature: null,                   icon: Plug },
  { label: 'Settings',       href: '/settings',                 feature: null,                   icon: Settings },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname   = usePathname();
  const router     = useRouter();
  const { user, updateUser, clearAuth } = useAuthStore();
  const { can, requiredPlan, planSlug } = usePermissions();
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<{ feature: string; requiredPlan: string } | null>(null);

  useEffect(() => {
    const refreshUser = async () => {
      try {
        const res = await api.get('/auth/me');
        updateUser({
          userId:    res.data.userId,
          email:     res.data.email,
          firstName: res.data.firstName,
          lastName:  res.data.lastName,
          planSlug:  res.data.planSlug,
          role:      res.data.role,
        });
      } catch {
        // 401 handled by axios interceptor
      }
    };
    refreshUser();
  }, []);

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    clearAuth();
    router.push('/login');
  };

  const handleLockedClick = (feature: string) => {
    const needed = requiredPlan(feature);
    window.dispatchEvent(new CustomEvent('upgrade-required', {
      detail: {
        feature,
        requiredPlan: needed ?? 'growth',
        message: `This feature is available on the ${needed ?? 'Growth'} plan and above.`,
      },
    }));
  };

  const Sidebar = () => (
    <aside className="w-60 bg-slate-950 flex flex-col h-full border-r border-slate-800">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/30">
            <Zap className="w-4 h-4 text-white" fill="white" />
          </div>
          <span className="font-display font-700 text-white text-base">MarketGrow</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const locked = item.feature !== null && !can(item.feature);
          const active =
            pathname === item.href ||
            (item.href !== '/dashboard' && item.href !== '/settings' && pathname.startsWith(item.href));

          // Generatie indicator op Social Content nav item
          const isContentItem = item.href === '/dashboard/social-content';

          if (locked) {
            return (
              <button
                key={item.href}
                onClick={() => handleLockedClick(item.feature!)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-slate-600 hover:text-slate-400 hover:bg-slate-800/30 group"
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                <Lock className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-brand-600/15 text-brand-400 border border-brand-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isContentItem && <GeneratingBadge />}
            </Link>
          );
        })}

        {/* Upgrade nudge voor Starter */}
        {planSlug === 'starter' && (
          <div className="mt-4 mx-1 p-3 rounded-xl bg-brand-600/10 border border-brand-600/20">
            <p className="text-xs font-semibold text-brand-400 mb-1">Upgrade to Growth</p>
            <p className="text-xs text-slate-500 mb-2">Unlock AI insights, ad analytics and more.</p>
            <Link
              href="/settings?tab=billing"
              className="block text-center text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white py-1.5 rounded-lg transition-colors"
            >
              View plans →
            </Link>
          </div>
        )}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1">
          <div className="w-7 h-7 rounded-full bg-brand-600/20 border border-brand-600/30 flex items-center justify-center text-xs font-bold text-brand-400">
            {user?.firstName?.[0]?.toUpperCase()}{user?.lastName?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-white truncate">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-xs text-slate-500 capitalize">{planSlug} plan</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">

      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-60 flex-shrink-0"><Sidebar /></div>
          <div className="flex-1 bg-black/60" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <button className="relative w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <Bell className="w-4 h-4" />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-slate-900/50">
          <TrialBanner />
          {children}
        </main>
      </div>

      {/* Upgrade modal — luistert globaal naar upgrade-required events */}
      <UpgradeModal />
    </div>
  );
}

'use client';

// ============================================================
// app/login/page.tsx
//
// FIX 15-mei: respecteert ?returnTo=... query param zodat een
// Shopify install flow (of andere deep links) na login naadloos
// doorgaan. Anti-open-redirect: alleen interne paths (startsWith '/').
//
// Suspense wrapper is verplicht omdat useSearchParams() anders
// de static page generation breekt tijdens Vercel build.
// ============================================================

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Zap, Eye, EyeOff, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

const schema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(1, 'Required'),
});

type FormData = z.infer<typeof schema>;

// ── Outer page: Suspense wrapper ─────────────────────────────
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginFallback() {
  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
    </div>
  );
}

// ── Inner component: alle hooks + form logic ─────────────────
function LoginPageInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const setAuth      = useAuthStore(s => s.setAuth);

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // Anti-open-redirect: alleen interne paden accepteren.
  const safeReturnTo = (() => {
    const raw = searchParams.get('returnTo');
    if (!raw) return null;
    if (!raw.startsWith('/') || raw.startsWith('//')) return null;
    return raw;
  })();

  // Pass returnTo door naar register page voor consistente flow.
  const registerHref = safeReturnTo
    ? `/register?returnTo=${encodeURIComponent(safeReturnTo)}`
    : '/register';

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      const res = await api.post('/auth/login', data);
      setAuth(res.data.user, res.data.accessToken);
      router.push(safeReturnTo ?? '/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Invalid email or password.');
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-display font-700 text-xl text-slate-900">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" fill="white" />
            </div>
            MarketGrowth
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="mb-6">
            <h1 className="font-display text-2xl font-800 text-slate-900">Welcome back</h1>
            <p className="text-slate-500 text-sm mt-1">
              {safeReturnTo === '/shopify/connect'
                ? 'Sign in to finish connecting your Shopify store.'
                : 'Sign in to your account'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Email</label>
              <input
                {...register('email')}
                type="email"
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                placeholder="jane@company.com"
                autoComplete="email"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-700">Password</label>
                <Link href="/forgot-password" className="text-xs text-brand-600 hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  placeholder="Your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isSubmitting ? 'Signing in...' : 'Sign in →'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6">
            Don't have an account?{' '}
            <Link href={registerHref} className="text-brand-600 hover:underline font-medium">Start free trial</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

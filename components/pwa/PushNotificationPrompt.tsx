'use client';

// ============================================================
// components/pwa/PushNotificationPrompt.tsx
//
// V0 Gap 5b: inline banner that asks the user to enable push
// notifications. Mounted in app/dashboard/layout.tsx next to
// the A2HSPrompt.
//
// Trigger order (all must be true to show):
//   1. Service worker is registered
//   2. Browser supports Notification + PushManager
//   3. Notification.permission === 'default' (not granted, not denied)
//   4. Not in dismiss cooldown (see push-prompt-cooldown.ts)
//   5. Backend says shouldShowPrompt=true (24h-after-signup + not subscribed)
//
// On accept:
//   - Request permission
//   - Subscribe via pushManager with VAPID public key
//   - POST subscription to /api/notifications/subscribe
//
// On dismiss:
//   - markPushPromptDismissed() schedules 7d cooldown (30d on 2nd dismiss)
// ============================================================

import { useEffect, useState } from 'react';
import { X, Bell, Loader2 } from 'lucide-react';
import {
  isPushPromptInCooldown,
  markPushPromptDismissed,
  markPushPromptPermanentlyDenied,
} from '@/lib/pwa/push-prompt-cooldown';

// ── Helpers ──────────────────────────────────────────────────

// VAPID public key is a base64url string. PushManager.subscribe()
// wants it as Uint8Array.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

function findAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const direct = window.sessionStorage.getItem('access_token');
    if (direct && direct.length > 20) return direct;
  } catch {}
  try {
    const raw = window.localStorage.getItem('mg-auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      const token  = parsed?.state?.accessToken;
      if (typeof token === 'string' && token.length > 20) return token;
    }
  } catch {}
  return null;
}

const apiBase = () =>
  process.env.NEXT_PUBLIC_API_URL
  ?? 'https://marketgrowth-production.up.railway.app';

// ── Component ────────────────────────────────────────────────

export function PushNotificationPrompt() {
  const [visible, setVisible] = useState(false);
  const [busy,    setBusy]    = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    void evaluate();

    async function evaluate() {
      // 1. SSR / non-browser bail-out
      if (typeof window === 'undefined') return;

      // 2. Browser capability check
      if (!('serviceWorker' in navigator)) return;
      if (!('PushManager' in window))      return;
      if (!('Notification' in window))     return;

      // 3. Permission state
      if (Notification.permission === 'granted') return;
      if (Notification.permission === 'denied') {
        markPushPromptPermanentlyDenied();
        return;
      }

      // 4. Frontend cooldown
      if (isPushPromptInCooldown()) return;

      // 5. VAPID key must be configured for subscribe to work
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey || vapidKey.length < 20) return;

      // 6. Service worker registered?
      // Note: getRegistration() returns Promise<ServiceWorkerRegistration | undefined>,
      // so we coerce to null with ?? null for our local typing.
      let registration: ServiceWorkerRegistration | null = null;
      try {
        registration = (await navigator.serviceWorker.getRegistration()) ?? null;
      } catch {
        return;
      }
      if (!registration) return;

      // 7. Auth token present (we are on dashboard so this should be true)
      const token = findAccessToken();
      if (!token) return;

      // 8. Backend eligibility (24h-after-signup + has no active sub)
      try {
        const res = await fetch(`${apiBase()}/api/notifications/eligibility`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json() as { shouldShowPrompt: boolean };
        if (!data.shouldShowPrompt) return;
      } catch {
        return;
      }

      setVisible(true);
    }
  }, []);

  const handleEnable = async () => {
    setBusy(true);
    setError(null);

    try {
      const permission = await Notification.requestPermission();

      if (permission === 'denied') {
        markPushPromptPermanentlyDenied();
        setVisible(false);
        return;
      }

      if (permission !== 'granted') {
        // 'default' = user dismissed native prompt without choosing.
        markPushPromptDismissed();
        setVisible(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const vapidKey     = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidKey) {
        setError('Push key not configured.');
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const subJson = subscription.toJSON();
      const token   = findAccessToken();
      if (!token) {
        setError('Session expired. Please log in again.');
        return;
      }

      const res = await fetch(`${apiBase()}/api/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          endpoint:  subJson.endpoint,
          keys: {
            p256dh: subJson.keys?.p256dh,
            auth:   subJson.keys?.auth,
          },
          userAgent: navigator.userAgent.substring(0, 500),
        }),
      });

      if (!res.ok) {
        setError('Could not save subscription. Try again later.');
        return;
      }

      setVisible(false);
    } catch (err) {
      setError((err as Error).message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const handleDismiss = () => {
    markPushPromptDismissed();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-sm z-50 animate-fade-up">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white mb-1">
              Get your daily briefing on time
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Enable notifications so your morning briefing lands at 07:00, every day. We will only send what matters.
            </p>

            {error ? (
              <p className="text-xs text-rose-400 mb-2">{error}</p>
            ) : null}

            <div className="flex items-center gap-2">
              <button onClick={handleEnable} disabled={busy} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium disabled:opacity-60 disabled:cursor-not-allowed">
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
                {busy ? 'Enabling...' : 'Enable notifications'}
              </button>
              <button onClick={handleDismiss} disabled={busy} className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 text-xs">
                Not now
              </button>
            </div>
          </div>

          <button onClick={handleDismiss} disabled={busy} aria-label="Dismiss" className="text-slate-500 hover:text-slate-300 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

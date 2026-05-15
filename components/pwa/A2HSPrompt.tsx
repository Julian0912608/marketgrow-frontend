'use client';

// components/pwa/A2HSPrompt.tsx
//
// Add-To-Home-Screen prompt voor de MarketGrow dashboard.
// Gemount in dashboard/layout.tsx zodat hij alleen voor ingelogde
// gebruikers triggert, niet op marketing pages.
//
// Trigger logica:
//   1. Service worker is geregistreerd
//   2. App draait niet al in standalone mode
//   3. Browser heeft beforeinstallprompt gefired
//   4. Sessie count >= A2HS_MIN_SESSIONS (3)
//   5. Niet recent dismissed (cooldown van 30 dagen)
//
// iOS Safari fired GEEN beforeinstallprompt. Voor V0 laten we iOS over
// aan een toekomstige iteratie (instructie-card met Share -> Add).

import { useEffect, useState } from 'react';
import { X, Smartphone, Download } from 'lucide-react';
import {
  bumpSessionCount,
  getSessionCount,
  isA2HSInCooldown,
  isInstalledStandalone,
  markA2HSDismissed,
  A2HS_MIN_SESSIONS,
} from '@/lib/pwa/session-counter';

// Chrome beforeinstallprompt event interface
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

export function A2HSPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible,  setVisible]  = useState(false);

  useEffect(() => {
    // Skip als al installed
    if (isInstalledStandalone()) return;

    // Bump sessie count (één keer per tab)
    bumpSessionCount();

    // Cooldown check
    if (isA2HSInCooldown()) return;

    const onBefore = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferred(promptEvent);

      // Toon alleen als sessie threshold is gehaald
      if (getSessionCount() >= A2HS_MIN_SESSIONS) {
        setVisible(true);
      }
    };

    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
    };

    window.addEventListener('beforeinstallprompt', onBefore);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBefore);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const result = await deferred.userChoice;
      if (result.outcome === 'dismissed') {
        markA2HSDismissed();
      }
    } catch {
      // Stilletjes falen
    } finally {
      setDeferred(null);
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    markA2HSDismissed();
    setVisible(false);
  };

  if (!visible || !deferred) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-sm z-50 animate-fade-up">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white mb-1">
              Install MarketGrow
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Add to your home screen for instant access to daily briefings and offline support.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleInstall}
                className="flex items-center gap-1.5 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white px-3 py-2 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="text-xs font-medium text-slate-400 hover:text-white px-3 py-2 rounded-lg transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="text-slate-500 hover:text-white transition-colors p-1 -mt-1 -mr-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

// components/pwa/ServiceWorkerRegister.tsx
//
// Registreert de service worker op /sw.js zodra de pagina geladen is.
// Wordt in de RootLayout gemount en draait dus op elke pagina.
// In dev (NODE_ENV !== 'production') wordt registratie overgeslagen om
// caching tijdens lokale development te voorkomen.

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    // Geen SW in dev — voorkomt vastlopen op stale caches tijdens hot reload
    if (process.env.NODE_ENV !== 'production') return;

    // Wacht op load zodat de SW registratie geen kritieke renderpad blokkeert
    const register = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          // Optionele update-cyclus: check periodiek op nieuwe versies
          // Bij detectie installeert de browser de nieuwe SW; bij refresh wordt
          // hij actief (omdat we skipWaiting() in install() doen).
          if (reg.update) {
            try { reg.update(); } catch {}
          }
        })
        .catch(() => {
          // Stilletjes falen — SW is een progressive enhancement
        });
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register, { once: true });
    }
  }, []);

  return null;
}

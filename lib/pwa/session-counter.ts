// lib/pwa/session-counter.ts
//
// Sessie teller voor de Add-To-Home-Screen prompt.
// Telt elke nieuwe browser tab als één sessie (sessionStorage flag
// voorkomt dubbele tellingen binnen dezelfde tab bij hot navigatie).
//
// V0 Gap 5a: gebruikt door A2HSPrompt om de prompt pas vanaf de 3e
// sessie te tonen. Geen DB-kolom nodig, dit is puur UX timing.

const SESSION_COUNT_KEY     = 'mg-session-count';
const SESSION_COUNTED_FLAG  = 'mg-session-counted';
const A2HS_DISMISSED_KEY    = 'mg-a2hs-dismissed-at';

// Hoeveel sessies nodig zijn voor de A2HS prompt
export const A2HS_MIN_SESSIONS = 3;

// Hoe lang we wachten voor we opnieuw prompten na dismissal
export const A2HS_DISMISS_COOLDOWN_DAYS = 30;

// ── Sessie tellen (idempotent per tab) ──────────────────────
export function bumpSessionCount(): number {
  if (typeof window === 'undefined') return 0;

  try {
    // Al geteld in deze tab? Skip.
    if (sessionStorage.getItem(SESSION_COUNTED_FLAG) === '1') {
      return getSessionCount();
    }

    const current = getSessionCount();
    const next    = current + 1;

    localStorage.setItem(SESSION_COUNT_KEY, String(next));
    sessionStorage.setItem(SESSION_COUNTED_FLAG, '1');

    return next;
  } catch {
    return 0;
  }
}

// ── Sessie count uitlezen ──────────────────────────────────
export function getSessionCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(SESSION_COUNT_KEY);
    const n   = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

// ── A2HS dismissal ─────────────────────────────────────────
export function markA2HSDismissed(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(A2HS_DISMISSED_KEY, String(Date.now()));
  } catch {}
}

export function isA2HSInCooldown(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(A2HS_DISMISSED_KEY);
    if (!raw) return false;
    const dismissedAt = parseInt(raw, 10);
    if (!Number.isFinite(dismissedAt)) return false;
    const cooldownMs = A2HS_DISMISS_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
    return Date.now() - dismissedAt < cooldownMs;
  } catch {
    return false;
  }
}

// ── PWA installed detection ────────────────────────────────
export function isInstalledStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      return true;
    }
    // iOS Safari
    if ((window.navigator as any).standalone === true) {
      return true;
    }
  } catch {}
  return false;
}

// ============================================================
// lib/pwa/push-prompt-cooldown.ts
//
// V0 Gap 5b: dismiss-cooldown logic for the push permission prompt.
//
// Backend handles the 24h-after-signup rule and the
// "already subscribed?" check via /api/notifications/eligibility.
// This module layers a frontend-only dismiss cooldown on top:
//
//   - First dismiss:  silent for 7 days
//   - Second dismiss: silent for 30 days
//   - Browser denied: silent forever (we cannot prompt again anyway)
//
// State lives in localStorage so it persists across sessions on
// the same device, which is the correct grain for permission UX.
// ============================================================

const STORAGE_KEY            = 'mg-push-prompt-state';
const FIRST_COOLDOWN_DAYS    = 7;
const SECOND_COOLDOWN_DAYS   = 30;
const PERMANENT_COOLDOWN_DAYS = 365 * 10; // effectively forever

interface PromptState {
  dismissCount:       number;
  lastDismissedAt:    string | null;  // ISO string
  permanentlyDenied:  boolean;
}

const DEFAULT_STATE: PromptState = {
  dismissCount:      0,
  lastDismissedAt:   null,
  permanentlyDenied: false,
};

function safeGet(): PromptState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<PromptState>;
    return {
      dismissCount:      typeof parsed.dismissCount === 'number' ? parsed.dismissCount : 0,
      lastDismissedAt:   typeof parsed.lastDismissedAt === 'string' ? parsed.lastDismissedAt : null,
      permanentlyDenied: !!parsed.permanentlyDenied,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function safeSet(state: PromptState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota / privacy mode failures
  }
}

// ── Public API ───────────────────────────────────────────────

export function getPushPromptState(): PromptState {
  return safeGet();
}

export function markPushPromptDismissed(): void {
  const state = safeGet();
  safeSet({
    ...state,
    dismissCount:    state.dismissCount + 1,
    lastDismissedAt: new Date().toISOString(),
  });
}

export function markPushPromptPermanentlyDenied(): void {
  safeSet({
    ...safeGet(),
    permanentlyDenied: true,
    lastDismissedAt:   new Date().toISOString(),
  });
}

export function clearPushPromptState(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export function isPushPromptInCooldown(): boolean {
  const state = safeGet();

  if (state.permanentlyDenied) return true;
  if (!state.lastDismissedAt)  return false;

  const lastMs = Date.parse(state.lastDismissedAt);
  if (isNaN(lastMs)) return false;

  const cooldownDays =
    state.dismissCount >= 2
      ? SECOND_COOLDOWN_DAYS
      : state.dismissCount >= 1
        ? FIRST_COOLDOWN_DAYS
        : 0;

  if (cooldownDays === 0) return false;

  const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;
  return Date.now() - lastMs < cooldownMs;
}

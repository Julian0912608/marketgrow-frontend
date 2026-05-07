'use client';

// ============================================================
// lib/featureFlags.tsx
//
// Country-aware feature flags voor de frontend.
// Backend endpoint: GET /api/feature-flags (zie batch 2).
//
// Drie public exports:
//   - FeatureFlagsProvider  : 1x wrappen rond authenticated pages
//   - useFeatureFlag(key)   : returns boolean
//   - useFeatureFlags()     : returns { flags, countryCode, loading, error, refetch }
//   - <FeatureFlag flag>    : wrapper component voor JSX gating
//
// Caching: in-memory via React Context. 1 fetch per app-session.
// Refetch op demand via context.refetch() (bv. na admin toggle).
// ============================================================

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { api } from '@/lib/api';

interface FeatureFlagsResponse {
  countryCode: string | null;
  flags:       Record<string, boolean>;
  fetchedAt:   string;
}

interface FeatureFlagsState {
  flags:       Record<string, boolean>;
  countryCode: string | null;
  loading:     boolean;
  error:       string | null;
  refetch:     () => Promise<void>;
}

const FeatureFlagsContext = createContext<FeatureFlagsState>({
  flags:       {},
  countryCode: null,
  loading:     true,
  error:       null,
  refetch:     async () => {},
});

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const [flags,       setFlags]       = useState<Record<string, boolean>>({});
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await api.get<FeatureFlagsResponse>('/feature-flags');
      setFlags(res.data?.flags ?? {});
      setCountryCode(res.data?.countryCode ?? null);
    } catch (err: any) {
      // 401 wordt door de axios interceptor afgehandeld (redirect naar login).
      // Voor andere errors: laat alle flags op default false staan
      // (closed by default = principe uit Architecture Plan).
      const status = err?.response?.status;
      if (status && status !== 401) {
        setError(err?.message ?? 'Failed to load feature flags');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <FeatureFlagsContext.Provider
      value={{ flags, countryCode, loading, error, refetch: load }}
    >
      {children}
    </FeatureFlagsContext.Provider>
  );
}

// Hook: snelle boolean check voor 1 flag.
// Tijdens loading: returns false (closed by default).
export function useFeatureFlag(key: string): boolean {
  const { flags } = useContext(FeatureFlagsContext);
  return flags[key] === true;
}

// Hook: volledige state voor wie countryCode of loading nodig heeft.
export function useFeatureFlags(): FeatureFlagsState {
  return useContext(FeatureFlagsContext);
}

interface FeatureFlagProps {
  flag:      string;
  children:  ReactNode;
  fallback?: ReactNode;
}

// JSX gate. Tijdens loading: niets (voorkomt flicker).
// Na load: children als flag true is, anders fallback (default: niets).
export function FeatureFlag({ flag, children, fallback = null }: FeatureFlagProps) {
  const { flags, loading } = useFeatureFlags();
  if (loading) return null;
  if (flags[flag] === true) return <>{children}</>;
  return <>{fallback}</>;
}

import { FeatureFlagsProvider } from '@/lib/featureFlags';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <FeatureFlagsProvider>
      {children}
    </FeatureFlagsProvider>
  );
}

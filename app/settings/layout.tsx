import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { FeatureFlagsProvider } from '@/lib/featureFlags';
import { OnboardingGuard } from '@/components/dashboard/OnboardingGuard';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingGuard>
      <FeatureFlagsProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </FeatureFlagsProvider>
    </OnboardingGuard>
  );
}

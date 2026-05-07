import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { FeatureFlagsProvider } from '@/lib/featureFlags';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <FeatureFlagsProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </FeatureFlagsProvider>
  );
}

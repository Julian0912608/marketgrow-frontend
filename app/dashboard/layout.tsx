import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { FeatureFlagsProvider } from '@/lib/featureFlags';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <FeatureFlagsProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </FeatureFlagsProvider>
  );
}

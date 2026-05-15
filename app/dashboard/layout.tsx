import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { FeatureFlagsProvider } from '@/lib/featureFlags';
import { OnboardingGuard } from '@/components/dashboard/OnboardingGuard';
import { A2HSPrompt } from '@/components/pwa/A2HSPrompt';
import { PushNotificationPrompt } from '@/components/pwa/PushNotificationPrompt';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingGuard>
      <FeatureFlagsProvider>
        <DashboardLayout>{children}</DashboardLayout>
        <A2HSPrompt />
        <PushNotificationPrompt />
      </FeatureFlagsProvider>
    </OnboardingGuard>
  );
}

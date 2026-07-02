import { FeatureErrorBoundary } from '@/components/common/FeatureErrorBoundary';
import { useAuthStore } from '@/features/auth/store/authStore';

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <FeatureErrorBoundary featureName="Dashboard">
      <div>
        <h1 className="mb-2 text-2xl font-semibold">Dashboard</h1>
        <p className="text-slate-400">
          Welcome{user?.full_name ? `, ${user.full_name}` : ''}. Auto-generated dashboards
          arrive in Phase 5.
        </p>
      </div>
    </FeatureErrorBoundary>
  );
}

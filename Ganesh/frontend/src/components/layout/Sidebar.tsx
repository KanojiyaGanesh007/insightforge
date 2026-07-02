import { NavLink } from 'react-router-dom';

import { useAuthStore } from '@/features/auth/store/authStore';
import { paths } from '@/routes/paths';
import { useAppStore } from '@/store/appStore';
import clsx from 'clsx';

const navItems = [
  { to: paths.dashboard, label: 'Dashboard', protected: true },
  { to: paths.datasets, label: 'Datasets', protected: true },
  { to: paths.dataQuality, label: 'Data Quality', protected: true },
  { to: paths.analytics, label: 'AI Insights', protected: true },
  { to: paths.visualizations, label: 'Visualizations', protected: true },
  { to: paths.dashboards, label: 'Dashboards', protected: true },
  { to: paths.ml, label: 'ML Center', protected: true },
  { to: paths.reports, label: 'Reports', protected: true },
  { to: paths.notifications, label: 'Notifications', protected: true },
  { to: paths.goals, label: 'Goals', protected: true },
  { to: paths.profile, label: 'Profile', protected: true },
  { to: paths.audit, label: 'Audit Logs', protected: true, admin: true },
] as const;

export function Sidebar() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <aside
      className={clsx(
        'border-r border-slate-800 bg-slate-900/50 transition-all',
        collapsed ? 'w-16' : 'w-56',
      )}
    >
      <nav className="flex flex-col gap-1 p-3">
        {navItems
          .filter((item) => !('admin' in item && item.admin) || user?.is_superuser)
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-brand-600/20 text-brand-400'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200',
                )
              }
            >
              {!collapsed && item.label}
            </NavLink>
          ))}
      </nav>
    </aside>
  );
}

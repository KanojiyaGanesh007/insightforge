import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { AppShell } from '@/components/layout/AppShell';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { PageLoader } from '@/components/ui/PageLoader';
import {
  ForgotPasswordPage,
  LoginPage,
  ProfilePage,
  RegisterPage,
  ResetPasswordPage,
  VerifyEmailPage,
} from '@/features/auth';
import { DashboardPage } from '@/pages/DashboardPage';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';

import { paths } from './paths';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';

// Lazy-loaded feature pages (Phase 2+)
const DatasetsPage = lazy(() =>
  import('@/features/datasets/pages/DatasetsPage').then((m) => ({ default: m.DatasetsPage })),
);
const DatasetQualityPage = lazy(() =>
  import('@/features/data-quality/pages/DatasetQualityPage').then((m) => ({ default: m.DatasetQualityPage })),
);
const DatasetIntelligencePage = lazy(() =>
  import('@/features/datasets/pages/DatasetIntelligencePage').then((m) => ({ default: m.DatasetIntelligencePage })),
);
const AssistantPage = lazy(() =>
  import('@/features/assistant/pages/AssistantPage').then((m) => ({ default: m.AssistantPage })),
);
const DashboardHubPage = lazy(() =>
  import('@/features/dashboards/pages/DashboardHubPage').then((m) => ({ default: m.DashboardHubPage })),
);
const DashboardViewPage = lazy(() =>
  import('@/features/dashboards/pages/DashboardViewPage').then((m) => ({ default: m.DashboardViewPage })),
);
const VisualizationStudioPage = lazy(() =>
  import('@/features/visualizations/pages/VisualizationStudioPage').then((m) => ({ default: m.VisualizationStudioPage })),
);

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: paths.home,
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      {
        element: <PublicRoute />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              { path: paths.login, element: <LoginPage /> },
              { path: paths.register, element: <RegisterPage /> },
              { path: paths.forgotPassword, element: <ForgotPasswordPage /> },
              { path: paths.resetPassword, element: <ResetPasswordPage /> },
              { path: paths.verifyEmail, element: <VerifyEmailPage /> },
            ],
          },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          { path: paths.dashboard, element: <DashboardPage /> },
          { path: paths.profile, element: <ProfilePage /> },
          {
            path: paths.datasets,
            element: (
              <Lazy>
                <DatasetsPage />
              </Lazy>
            ),
          },
          {
            path: paths.datasetQuality,
            element: (
              <Lazy>
                <DatasetQualityPage />
              </Lazy>
            ),
          },
          {
            path: paths.datasetIntelligence,
            element: (
              <Lazy>
                <DatasetIntelligencePage />
              </Lazy>
            ),
          },
          {
            path: paths.assistant,
            element: (
              <Lazy>
                <AssistantPage />
              </Lazy>
            ),
          },
          {
            path: paths.dashboards,
            element: (
              <Lazy>
                <DashboardHubPage />
              </Lazy>
            ),
          },
          {
            path: paths.dashboardView,
            element: (
              <Lazy>
                <DashboardViewPage />
              </Lazy>
            ),
          },
          {
            path: paths.visualizationStudio,
            element: (
              <Lazy>
                <VisualizationStudioPage />
              </Lazy>
            ),
          },
          // Additional protected routes added per implementation phase
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  { path: '/404', element: <Navigate to={paths.home} replace /> },
]);

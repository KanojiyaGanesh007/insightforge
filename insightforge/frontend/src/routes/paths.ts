/** Centralized route path constants */

export const paths = {
  home: '/',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  verifyEmail: '/verify-email',
  dashboard: '/dashboard',
  profile: '/settings/profile',

  // Feature routes (Phase 2+)
  datasets: '/datasets',
  datasetQuality: '/datasets/:id/quality',
  datasetIntelligence: '/datasets/:id/intelligence',
  dataQuality: '/data-quality',
  analytics: '/analytics',
  assistant: '/assistant',
  visualizations: '/visualizations',
  visualizationStudio: '/visualizations/studio',
  dashboards: '/dashboards',
  dashboardView: '/dashboards/:id',
  ml: '/ml',
  reports: '/reports',
  notifications: '/notifications',
  goals: '/goals',
  users: '/users',
  audit: '/audit',
  settings: '/settings',
} as const;

export type AppPath = (typeof paths)[keyof typeof paths];

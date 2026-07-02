import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <Outlet />
    </div>
  );
}

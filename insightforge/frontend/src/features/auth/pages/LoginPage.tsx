import { Link } from 'react-router-dom';

import { paths } from '@/routes/paths';

import { LoginForm } from '../components/LoginForm';

export function LoginPage() {
  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="mb-2 text-2xl font-semibold">Sign in</h1>
      <p className="mb-6 text-sm text-slate-400">
        Welcome to {import.meta.env.VITE_APP_NAME}
      </p>
      <LoginForm />
      <p className="mt-4 text-center text-sm text-slate-500">
        No account?{' '}
        <Link to={paths.register} className="text-brand-500 hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}

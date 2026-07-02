import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';

import { paths } from '@/routes/paths';

import { useAuth } from '../hooks/useAuth';

export function LoginForm() {
  const { login, isLoggingIn, loginError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm text-slate-400">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="password" className="text-sm text-slate-400">
            Password
          </label>
          <Link to={paths.forgotPassword} className="text-xs text-brand-400 hover:underline">
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
      </div>
      {loginError && <p className="text-sm text-red-400">{loginError}</p>}
      <button
        type="submit"
        disabled={isLoggingIn}
        className="w-full rounded-lg bg-brand-600 py-2 text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
      >
        {isLoggingIn ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}

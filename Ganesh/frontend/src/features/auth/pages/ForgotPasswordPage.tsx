import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';

import { paths } from '@/routes/paths';

import { useAuth } from '../hooks/useAuth';

export function ForgotPasswordPage() {
  const { forgotPassword, isForgotPasswordSent, forgotPasswordError } = useAuth();
  const [email, setEmail] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    forgotPassword({ email });
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="mb-2 text-2xl font-semibold text-white">Reset password</h1>
      <p className="mb-6 text-sm text-slate-400">
        Enter your email and we will send you a reset link if an account exists.
      </p>
      {isForgotPasswordSent ? (
        <p className="rounded-lg border border-emerald-800 bg-emerald-950/50 p-4 text-sm text-emerald-300">
          If an account exists for that email, a reset link has been sent. Check your inbox or server
          logs in development.
        </p>
      ) : (
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
          {forgotPasswordError && <p className="text-sm text-red-400">{forgotPasswordError}</p>}
          <button
            type="submit"
            className="w-full rounded-lg bg-brand-600 py-2 text-sm font-medium hover:bg-brand-700"
          >
            Send reset link
          </button>
        </form>
      )}
      <p className="mt-4 text-center text-sm text-slate-500">
        <Link to={paths.login} className="text-brand-400 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

import { type FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { paths } from '@/routes/paths';

import { useAuth } from '../hooks/useAuth';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { resetPassword, resetPasswordError, isResetPasswordDone } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return;
    resetPassword({ token, new_password: password });
  };

  if (!token) {
    return (
      <p className="text-sm text-red-400">
        Missing reset token. Use the link from your email or request a new one from{' '}
        <Link to={paths.forgotPassword} className="text-brand-400 hover:underline">
          forgot password
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="mb-6 text-2xl font-semibold text-white">Choose a new password</h1>
      {isResetPasswordDone ? (
        <p className="text-sm text-emerald-300">Password updated. Redirecting to sign in…</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="mb-1 block text-sm text-slate-400">
              New password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="confirm" className="mb-1 block text-sm text-slate-400">
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
          {password !== confirm && confirm.length > 0 && (
            <p className="text-sm text-amber-400">Passwords do not match</p>
          )}
          {resetPasswordError && <p className="text-sm text-red-400">{resetPasswordError}</p>}
          <button
            type="submit"
            disabled={password !== confirm}
            className="w-full rounded-lg bg-brand-600 py-2 text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
          >
            Update password
          </button>
        </form>
      )}
    </div>
  );
}

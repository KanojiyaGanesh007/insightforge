import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';

import { paths } from '@/routes/paths';

import { useAuth } from '../hooks/useAuth';

export function RegisterPage() {
  const { register, isRegistering, registerError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    register({ email, password, full_name: fullName });
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="mb-2 text-2xl font-semibold">Create account</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          placeholder="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        />
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        />
        <input
          type="password"
          placeholder="Password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        />
        {registerError && <p className="text-sm text-red-400">{registerError}</p>}
        <button
          type="submit"
          disabled={isRegistering}
          className="w-full rounded-lg bg-brand-600 py-2 text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
        >
          {isRegistering ? 'Creating…' : 'Register'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to={paths.login} className="text-brand-500 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

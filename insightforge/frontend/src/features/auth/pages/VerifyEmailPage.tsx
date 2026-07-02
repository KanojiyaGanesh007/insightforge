import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { paths } from '@/routes/paths';

import { useAuth } from '../hooks/useAuth';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { verifyEmail, isVerifyEmailDone, verifyEmailError } = useAuth();
  const started = useRef(false);

  useEffect(() => {
    if (token && !started.current) {
      started.current = true;
      verifyEmail(token);
    }
  }, [token, verifyEmail]);

  if (!token) {
    return <p className="text-sm text-red-400">Missing verification token.</p>;
  }

  if (isVerifyEmailDone) {
    return (
      <div className="mx-auto max-w-md text-center">
        <p className="mb-4 text-emerald-300">Email verified successfully.</p>
        <Link to={paths.dashboard} className="text-brand-400 hover:underline">
          Go to dashboard
        </Link>
      </div>
    );
  }

  if (verifyEmailError) {
    return <p className="text-sm text-red-400">{verifyEmailError}</p>;
  }

  return <p className="text-sm text-slate-400">Verifying your email…</p>;
}

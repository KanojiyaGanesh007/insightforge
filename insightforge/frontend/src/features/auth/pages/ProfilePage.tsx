import { type FormEvent, useState } from 'react';

import { useAuth, useProfile } from '../hooks/useAuth';

export function ProfilePage() {
  const { data: profile, isLoading } = useProfile();
  const { updateProfile, resendVerification } = useAuth();
  const [fullName, setFullName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSaved(false);
    updateProfile({
      full_name: fullName || profile?.full_name,
      current_password: currentPassword || undefined,
      new_password: newPassword || undefined,
    });
    setSaved(true);
    setCurrentPassword('');
    setNewPassword('');
  };

  if (isLoading || !profile) {
    return <p className="text-slate-400">Loading profile…</p>;
  }

  const displayName = fullName || profile.full_name;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold text-white">Profile</h1>
      <div className="mb-6 rounded-lg border border-slate-800 bg-slate-900/50 p-4 text-sm">
        <p>
          <span className="text-slate-500">Email:</span> {profile.email}
        </p>
        <p className="mt-1">
          <span className="text-slate-500">Roles:</span>{' '}
          {(profile.roles ?? []).join(', ') || '—'}
        </p>
        <p className="mt-1">
          <span className="text-slate-500">Verified:</span>{' '}
          {profile.email_verified ? 'Yes' : 'No'}
          {!profile.email_verified && (
            <button
              type="button"
              onClick={() => resendVerification()}
              className="ml-2 text-brand-400 hover:underline"
            >
              Resend verification
            </button>
          )}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="fullName" className="mb-1 block text-sm text-slate-400">
            Full name
          </label>
          <input
            id="fullName"
            type="text"
            defaultValue={displayName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>
        <hr className="border-slate-800" />
        <p className="text-sm text-slate-500">Change password (optional)</p>
        <div>
          <label htmlFor="current" className="mb-1 block text-sm text-slate-400">
            Current password
          </label>
          <input
            id="current"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="new" className="mb-1 block text-sm text-slate-400">
            New password
          </label>
          <input
            id="new"
            type="password"
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>
        {saved && <p className="text-sm text-emerald-400">Profile updated.</p>}
        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium hover:bg-brand-700"
        >
          Save changes
        </button>
      </form>
    </div>
  );
}

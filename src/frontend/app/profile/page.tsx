'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/lib/components/Header';
import Footer from '@/lib/components/Footer';
import Button from '@/lib/components/Button';
import { useAuth } from '@/lib/hooks/useAuth';
import { useUpdateProfile } from '@/lib/hooks/useAuthMutations';
import { useUserTeams, type UserTeamSummary } from '@/lib/hooks/useTeams';
import type { UserProfile } from '@/lib/api/client';

export default function ProfilePage() {
  const { user, loading, error, logout, isLoggingOut, refetch } = useAuth();
  const updateProfile = useUpdateProfile();
  const { data: myTeams = [], isLoading: teamsLoading } = useUserTeams({ enabled: Boolean(user) });
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const profileCompletion = useMemo(() => {
    if (!user) return 0;
    const fields: Array<keyof Pick<UserProfile, 'name' | 'surname' | 'email'>> = ['name', 'surname', 'email'];
    const filled = fields.filter((field) => Boolean(user[field]));
    return Math.round((filled.length / fields.length) * 100);
  }, [user]);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleSubmit = (values: { name?: string; surname?: string; email?: string }) => {
    setFormError(null);
    setSuccessMessage(null);

    updateProfile.mutate(values, {
      onSuccess: () => {
        setSuccessMessage('Profile updated successfully.');
        void refetch();
      },
      onError: (mutationError) => {
        setFormError(mutationError instanceof Error ? mutationError.message : 'Failed to update profile');
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-600">
            Loading your profile...
          </div>
        ) : error ? (
          <div className="bg-white border border-red-200 rounded-lg p-12 text-center text-red-600">
            {error}
          </div>
        ) : !user ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-lg text-gray-700 mb-4">
              You need to sign in to view your profile.
            </p>
            <Button variant="primary" href="/login">
              Sign In
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white border border-gray-200 rounded-lg p-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  {user.username?.charAt(0).toUpperCase()}
                </div>
                <div className="space-y-3">
                  <div>
                    <h1 className="text-3xl font-bold text-black">{user.username}</h1>
                    <p className="text-sm text-gray-500">
                      Two-factor auth: {user.totpConfirmed ? 'Enabled' : 'Pending setup'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                      Profile completion
                    </p>
                    <p className="text-2xl font-bold text-black">{profileCompletion}%</p>
                    <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden w-64 max-w-full">
                      <div
                        className="h-2 bg-primary rounded-full transition-all"
                        style={{ width: `${profileCompletion}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => logout()}
                  className="min-w-[140px]"
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? 'Signing out...' : 'Sign Out'}
                </Button>
                <Button variant="primary" href="/challenges">
                  Browse Challenges
                </Button>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-black">Account details</h2>
                  <p className="text-gray-600">Keep your profile information up to date.</p>
                </div>
                <div className="flex items-center gap-3">
                  {successMessage && (
                    <span className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-1">
                      {successMessage}
                    </span>
                  )}
                  <button
                    type="button"
                    className="text-sm font-medium text-primary hover:underline"
                    onClick={() => setIsDetailsOpen((prev) => !prev)}
                  >
                    {isDetailsOpen ? 'Hide' : 'Edit'}
                  </button>
                </div>
              </div>

              {isDetailsOpen && (
                <div className="mt-6">
                  <ProfileDetailsForm
                    key={user.id}
                    user={user}
                    isSubmitting={updateProfile.isPending}
                    errorMessage={formError}
                    onSubmit={handleSubmit}
                  />
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-black">My teams</h2>
                <Link href="/challenges" className="text-sm text-primary hover:underline">
                  Find a challenge
                </Link>
              </div>
              <TeamsTable teams={myTeams} loading={teamsLoading} />
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

interface ProfileDetailsFormProps {
  user: UserProfile;
  isSubmitting: boolean;
  errorMessage: string | null;
  onSubmit: (values: { name?: string; surname?: string; email?: string }) => void;
}

function ProfileDetailsForm({ user, isSubmitting, errorMessage, onSubmit }: ProfileDetailsFormProps) {
  const [formState, setFormState] = useState({
    name: user.name ?? '',
    surname: user.surname ?? '',
    email: user.email ?? '',
  });

  const handleChange = (field: 'name' | 'surname' | 'email', value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({
      name: formState.name || undefined,
      surname: formState.surname || undefined,
      email: formState.email || undefined,
    });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">First name</label>
          <input
            type="text"
            value={formState.name}
            onChange={(event) => handleChange('name', event.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Add your first name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Last name</label>
          <input
            type="text"
            value={formState.surname}
            onChange={(event) => handleChange('surname', event.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Add your last name"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
        <input
          type="email"
          value={formState.email}
          onChange={(event) => handleChange('email', event.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="you@example.com"
        />
      </div>

      {errorMessage && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {errorMessage}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save changes'}
        </Button>
        <p className="text-sm text-gray-500">
          Need to change your username? Contact the administrators.
        </p>
      </div>
    </form>
  );
}

interface TeamsTableProps {
  teams: UserTeamSummary[];
  loading: boolean;
}

function TeamsTable({ teams, loading }: TeamsTableProps) {
  if (loading) {
    return <p className="text-gray-600">Loading your teams...</p>;
  }

  if (!teams || teams.length === 0) {
    return (
      <p className="text-gray-600">
        You are not part of any teams yet. Visit a challenge page to create or join one.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr className="text-left text-sm text-gray-600">
            <th className="px-4 py-3 font-semibold">Hackathon</th>
            <th className="px-4 py-3 font-semibold">Team</th>
            <th className="px-4 py-3 font-semibold">Role</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Members</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-sm">
          {teams.map((team) => (
            <tr
              key={team.id}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => {
                if (team.hackathon?.id) {
                  window.location.href = `/challenges/${team.hackathon.id}`;
                }
              }}
            >
              <td className="px-4 py-3">
                <div className="font-medium text-black">{team.hackathon?.title ?? 'Unknown hackathon'}</div>
                <div className="text-xs text-gray-500">
                  ID: {team.hackathon?.id ?? 'N/A'}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="font-medium text-black">{team.name}</div>
                <div className="text-xs text-gray-500 font-mono">Code: {team.invitationCode}</div>
              </td>
              <td className="px-4 py-3">
                {team.isCaptain ? (
                  <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-50 rounded-full">
                    Captain
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs font-semibold text-gray-700 bg-gray-100 rounded-full">
                    Member
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                {team.isAccepted ? (
                  <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-50 rounded-full">
                    Accepted
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-50 rounded-full">
                    Pending
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-gray-700">{team.memberCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

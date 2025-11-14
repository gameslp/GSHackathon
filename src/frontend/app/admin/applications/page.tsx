'use client';

import { useMemo, useState } from 'react';
import Header from '@/lib/components/Header';
import Footer from '@/lib/components/Footer';
import Button from '@/lib/components/Button';
import { useAuth } from '@/lib/hooks/useAuth';
import { useHackathons } from '@/lib/hooks/useHackathons';
import {
  useHackathonTeams,
  useTeamDetail,
  useAcceptTeam,
  useRejectTeam,
} from '@/lib/hooks/useAdmin';

const LIMIT = 10;

export default function AdminApplicationsPage() {
  const { user, loading, error } = useAuth();
  const [selectedHackathonId, setSelectedHackathonId] = useState<number | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | 'accepted' | 'pending'>('all');

  const hackathonQueryParams = useMemo(() => ({ query: { limit: 50 } }), []);
  const { data: hackathonResponse, isLoading: hackathonLoading } = useHackathons(hackathonQueryParams);
  const hackathons = useMemo(() => hackathonResponse?.hackathons ?? [], [hackathonResponse]);
  const activeHackathonId = useMemo(() => {
    if (selectedHackathonId && hackathons.some((hackathon) => hackathon.id === selectedHackathonId)) {
      return selectedHackathonId;
    }
    return hackathons[0]?.id ?? null;
  }, [hackathons, selectedHackathonId]);

  const teamQueryParams = useMemo(() => ({ query: { page, limit: LIMIT } }), [page]);
  const { data: teamsResponse, isLoading: teamsLoading } = useHackathonTeams(
    activeHackathonId ?? 0,
    teamQueryParams
  );
  const teams = useMemo(() => teamsResponse?.teams ?? [], [teamsResponse]);
  const pagination = teamsResponse?.pagination;

  const filteredTeams = useMemo(() => {
    if (statusFilter === 'all') {
      return teams;
    }
    if (statusFilter === 'accepted') {
      return teams.filter((team) => team.isAccepted);
    }
    return teams.filter((team) => !team.isAccepted);
  }, [teams, statusFilter]);

  const activeTeamId = useMemo(() => {
    if (selectedTeamId && filteredTeams.some((team) => team.id === selectedTeamId)) {
      return selectedTeamId;
    }
    return filteredTeams[0]?.id ?? null;
  }, [filteredTeams, selectedTeamId]);

  const {
    data: teamDetailResponse,
    isLoading: teamDetailLoading,
  } = useTeamDetail(activeTeamId ?? 0);
  const teamDetail = activeTeamId ? teamDetailResponse?.team : null;

  const acceptTeam = useAcceptTeam();
  const rejectTeam = useRejectTeam();

  const handleDecision = (decision: 'accept' | 'reject') => {
    if (!activeTeamId) return;
    const mutation = decision === 'accept' ? acceptTeam : rejectTeam;
    mutation.mutate({
      teamId: activeTeamId,
      hackathonId: activeHackathonId ?? undefined,
    });
  };

  if (loading || hackathonLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-600">
            Loading admin dashboard...
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="bg-white border border-red-200 rounded-lg p-12 text-center text-red-600">
            {error}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-lg text-gray-700 mb-4">You must be signed in as an admin.</p>
            <Button variant="primary" href="/login">
              Sign In
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="bg-white border border-yellow-200 rounded-lg p-12 text-center">
            <p className="text-lg text-gray-700">
              You do not have access to the admin applications dashboard.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-black">Team applications</h1>
              <p className="text-gray-600">
                Review team submissions and manage access for each hackathon.
              </p>
            </div>
            <div className="flex gap-3">
              <select
                value={activeHackathonId ?? ''}
                onChange={(event) => {
                  setSelectedHackathonId(Number(event.target.value));
                  setSelectedTeamId(null);
                  setPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm"
              >
                {hackathons.map((hackathon) => (
                  <option key={hackathon.id} value={hackathon.id}>
                    {hackathon.title}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as typeof statusFilter);
                  setSelectedTeamId(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm"
              >
                <option value="all">All teams</option>
                <option value="pending">Pending review</option>
                <option value="accepted">Accepted</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-black">Teams</h2>
                <span className="text-sm text-gray-500">
                  {filteredTeams.length} of {teams.length} ({pagination?.total ?? 0} total)
                </span>
              </div>
              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {teamsLoading ? (
                  <div className="p-6 text-center text-gray-500">Loading teams...</div>
                ) : filteredTeams.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">No teams to review.</div>
                ) : (
                  filteredTeams.map((team) => (
                    <button
                      key={team.id}
                      className={`w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors ${
                        activeTeamId === team.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedTeamId(team.id!)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-lg font-semibold text-black">{team.name}</p>
                          <p className="text-sm text-gray-600">
                            Invitation code: <span className="font-mono">{team.invitationCode}</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Created on {new Date(team.createdAt!).toLocaleString()}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            team.isAccepted
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {team.isAccepted ? 'Accepted' : 'Pending'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Members: <strong>{team.memberCount ?? team.members?.length ?? 0}</strong>
                      </p>
                    </button>
                  ))
                )}
              </div>
              {pagination && (
                <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between text-sm text-gray-600">
                  <button
                    className="text-primary disabled:text-gray-400"
                    disabled={page <= 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  >
                    Previous
                  </button>
                  <span>
                    Page {page} of {pagination.totalPages ?? 1}
                  </span>
                  <button
                    className="text-primary disabled:text-gray-400"
                    disabled={pagination.totalPages ? page >= pagination.totalPages : true}
                    onClick={() => setPage((prev) => prev + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              {!activeTeamId ? (
                <div className="text-gray-500 text-center py-20">
                  Select a team to view details.
                </div>
              ) : teamDetailLoading ? (
                <div className="text-gray-500 text-center py-20">Loading team details...</div>
              ) : !teamDetail ? (
                <div className="text-gray-500 text-center py-20">
                  Unable to load team information.
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-black">{teamDetail.name}</h2>
                      <p className="text-sm text-gray-600">
                        Invitation code:{' '}
                        <span className="font-mono text-black">{teamDetail.invitationCode}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Members: {teamDetail.members?.length ?? 0} /{' '}
                        {teamDetail.hackathon?.teamMax ?? '-'}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        teamDetail.isAccepted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {teamDetail.isAccepted ? 'Accepted' : 'Pending review'}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-black">Members</h3>
                    {teamDetail.members?.map((member) => (
                      <div key={member.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-black">{member.username}</p>
                            <p className="text-sm text-gray-500">
                              {member.name ? `${member.name} ${member.surname ?? ''}` : 'Profile incomplete'}
                            </p>
                          </div>
                          {member.id === teamDetail.captainId && (
                            <span className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                              Captain
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {teamDetail.memberResponses && teamDetail.memberResponses.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-black">Survey responses</h3>
                      {teamDetail.memberResponses.map((response) => (
                        <div
                          key={response.member?.id}
                          className="border border-gray-200 rounded-lg p-4 space-y-3"
                        >
                          <p className="font-semibold text-gray-900">
                            {response.member?.username}{' '}
                            <span className="text-sm text-gray-500">
                              ({response.member?.name ?? 'Name TBD'})
                            </span>
                          </p>
                          {response.surveyResponses?.map((answer) => (
                            <div key={answer.questionId}>
                              <p className="text-sm font-medium text-gray-700">{answer.question}</p>
                              <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">
                                {answer.answer}
                              </p>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="primary"
                      className="flex-1 min-w-[140px]"
                      onClick={() => handleDecision('accept')}
                      disabled={acceptTeam.isPending || teamDetail.isAccepted}
                    >
                      {teamDetail.isAccepted ? 'Already accepted' : 'Accept team'}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 min-w-[140px]"
                      onClick={() => handleDecision('reject')}
                      disabled={rejectTeam.isPending}
                    >
                      Reject team
                    </Button>
                  </div>
                  {(acceptTeam.isPending || rejectTeam.isPending) && (
                    <p className="text-sm text-gray-500">Submitting your decision...</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

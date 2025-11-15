'use client';

import { useMemo, useState } from 'react';
import Header from '@/lib/components/Header';
import Footer from '@/lib/components/Footer';
import Button from '@/lib/components/Button';
import { useAuth } from '@/lib/hooks/useAuth';
import { useJudgeHackathons } from '@/lib/hooks/useJudges';
import { useHackathonTeams, useTeamDetail } from '@/lib/hooks/useAdmin';

const TEAM_LIMIT = 6;

export default function JudgeDashboardPage() {
  const { user, loading } = useAuth();
  const [selectedHackathonId, setSelectedHackathonId] = useState<number | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [teamPageByHackathon, setTeamPageByHackathon] = useState<Record<number, number>>({});

  const {
    data: assignedHackathons = [],
    isLoading: assignedLoading,
    error: assignedError,
  } = useJudgeHackathons({ enabled: Boolean(user && user.role === 'JUDGE') });

  const currentHackathonId = useMemo(() => {
    if (selectedHackathonId && assignedHackathons.some((hackathon) => hackathon.id === selectedHackathonId)) {
      return selectedHackathonId;
    }
    return assignedHackathons[0]?.id ?? null;
  }, [assignedHackathons, selectedHackathonId]);
  const currentTeamPage = currentHackathonId
    ? teamPageByHackathon[currentHackathonId] ?? 1
    : 1;
  const { data: teamsData, isLoading: teamsLoading } = useHackathonTeams(currentHackathonId ?? 0, {
    query: { page: currentTeamPage, limit: TEAM_LIMIT },
  });
  const teams = useMemo(() => teamsData?.teams ?? [], [teamsData]);
  const teamPagination = teamsData?.pagination;

  const currentTeamId = useMemo(() => {
    if (selectedTeamId && teams.some((team) => team.id === selectedTeamId)) {
      return selectedTeamId;
    }
    return teams[0]?.id ?? null;
  }, [teams, selectedTeamId]);

  const updateTeamPage = (nextPage: number) => {
    if (!currentHackathonId) return;
    setTeamPageByHackathon((prev) => ({
      ...prev,
      [currentHackathonId]: nextPage,
    }));
  };

  const { data: teamDetailResp, isLoading: teamDetailLoading } = useTeamDetail(currentTeamId ?? 0);
  const teamDetail = teamDetailResp?.team;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-600">
            Loading your dashboard...
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
            <p className="text-lg text-gray-700 mb-4">Sign in to access the judge dashboard.</p>
            <Button variant="primary" href="/login">
              Sign In
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (user.role !== 'JUDGE') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="bg-white border border-yellow-200 rounded-lg p-12 text-center text-gray-700">
            Only judges can access this dashboard.
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-12 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-black">Judge Dashboard</h1>
            <p className="text-gray-600">Review teams for hackathons you’ve been assigned to.</p>
          </div>
        </div>

        {assignedLoading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-gray-600">
            Loading your hackathons...
          </div>
        ) : assignedError ? (
          <div className="bg-white border border-red-200 rounded-lg p-8 text-red-700">
            {(assignedError as Error).message ?? 'Failed to load hackathons'}
          </div>
        ) : assignedHackathons.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-gray-600">
            You have not been assigned to any hackathons yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <section className="bg-white border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-black mb-3">Assigned hackathons</h2>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {assignedHackathons.map((hackathon) => {
                  const isActive = hackathon.id === currentHackathonId;
                  return (
                    <button
                      key={hackathon.id}
                      onClick={() => {
                        setSelectedHackathonId(hackathon.id);
                        setTeamPageByHackathon((prev) => ({
                          ...prev,
                          [hackathon.id]: 1,
                        }));
                        setSelectedTeamId(null);
                      }}
                      className={`w-full text-left p-3 rounded-lg border ${
                        isActive ? 'border-primary bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <p className="font-semibold text-black">{hackathon.title}</p>
                      {hackathon.startDate && (
                        <p className="text-xs text-gray-500">
                          Starts {new Date(hackathon.startDate).toLocaleDateString()}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="lg:col-span-3 space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-black">
                      {assignedHackathons.find((hackathon) => hackathon.id === currentHackathonId)?.title ??
                        'Select a hackathon'}
                    </h2>
                    {currentHackathonId && (
                      <p className="text-sm text-gray-500">
                        Review teams and their survey responses.
                      </p>
                    )}
                  </div>
                </div>
                {!currentHackathonId ? (
                  <p className="text-sm text-gray-600">Choose a hackathon to view its teams.</p>
                ) : teamsLoading ? (
                  <p className="text-sm text-gray-600">Loading teams...</p>
                ) : teams.length === 0 ? (
                  <p className="text-sm text-gray-600">No teams have registered yet.</p>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                      {teams.map((team) => (
                        <button
                          key={team.id}
                          onClick={() => setSelectedTeamId(team.id ?? null)}
                          className={`w-full text-left p-4 ${
                            currentTeamId === team.id
                              ? 'bg-blue-50 border-l-4 border-primary'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <p className="font-semibold text-black">{team.name}</p>
                          <p className="text-xs text-gray-500 font-mono">
                            Code: {team.invitationCode}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Members: {team.memberCount ?? team.members?.length ?? 0}
                          </p>
                        </button>
                      ))}
                      {teamPagination && currentHackathonId && (
                        <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-600">
                          <button
                            onClick={() => updateTeamPage(Math.max(1, currentTeamPage - 1))}
                            disabled={teamPagination.page <= 1}
                            className="text-primary disabled:text-gray-300"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => {
                              if (
                                teamPagination.totalPages &&
                                teamPagination.page < teamPagination.totalPages
                              ) {
                                updateTeamPage(currentTeamPage + 1);
                              }
                            }}
                            disabled={
                              !!teamPagination.totalPages &&
                              teamPagination.page >= teamPagination.totalPages
                            }
                            className="text-primary disabled:text-gray-300"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      {teamDetailLoading ? (
                        <p className="text-sm text-gray-600">Loading team details...</p>
                      ) : !teamDetail ? (
                        <p className="text-sm text-gray-600">
                          Select a team to view their submission details.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-xl font-semibold text-black">{teamDetail.name}</h3>
                            <p className="text-sm text-gray-500 font-mono">
                              Invitation code: {teamDetail.invitationCode}
                            </p>
                            <span
                              className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full ${
                                teamDetail.isAccepted
                                  ? 'bg-green-50 text-green-800'
                                  : 'bg-yellow-50 text-yellow-800'
                              }`}
                            >
                              {teamDetail.isAccepted ? 'Accepted' : 'Pending'}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-black mb-2">Members</p>
                            <ul className="space-y-2">
                              {teamDetail.memberResponses?.map((entry) => (
                                <li
                                  key={entry.member.id}
                                  className="border border-gray-200 rounded-lg px-3 py-2"
                                >
                                  <p className="font-medium text-black">{entry.member.username}</p>
                                  <ul className="mt-2 space-y-1 text-xs text-gray-600">
                                    {entry.surveyResponses?.map((response) => (
                                      <li key={response.questionId}>
                                        <span className="font-semibold">{response.question}:</span>{' '}
                                        {response.answer}
                                      </li>
                                    ))}
                                  </ul>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

'use client';

import { use, useState } from 'react';
import Header from '@/lib/components/Header';
import Footer from '@/lib/components/Footer';
import Button from '@/lib/components/Button';
import { useHackathon, useHackathonLeaderboard } from '@/lib/hooks/useHackathons';

export default function LeaderboardPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const hackathonId = parseInt(resolvedParams.id);
  const [page, setPage] = useState(1);

  const { data: hackathon, isLoading: hackathonLoading } = useHackathon(hackathonId);
  const { data: leaderboardData, isLoading: leaderboardLoading } = useHackathonLeaderboard(hackathonId, page, {
    enabled: !!hackathonId,
  });

  if (hackathonLoading || leaderboardLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-600">
            Loading leaderboard...
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-red-600">
            Hackathon not found
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const leaderboard = leaderboardData?.leaderboard ?? [];
  const pagination = leaderboardData?.pagination;
  const submissionLimit = leaderboardData?.submissionLimit;
  const currentUserTeamRank = leaderboardData?.currentUserTeamRank;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-black">{hackathon.title} - Leaderboard</h1>
                <p className="text-gray-600 mt-1">Team rankings based on best submission scores</p>
                {currentUserTeamRank && (
                  <p className="text-sm text-blue-600 mt-2 font-semibold">
                    Your team rank: #{currentUserTeamRank}
                  </p>
                )}
              </div>
              <Button variant="outline" href={`/challenges/${hackathonId}`}>
                Back to Challenge
              </Button>
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Team
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Members
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Best Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Submissions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Last Submitted
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No teams have submitted yet
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((entry) => {
                      const isCurrentUserTeam = entry.rank === currentUserTeamRank;
                      return (
                        <tr
                          key={entry.teamId}
                          className={`${isCurrentUserTeam ? 'bg-blue-50' : 'hover:bg-gray-50'} transition-colors`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {entry.rank <= 3 ? (
                                <span className="text-2xl">
                                  {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                                </span>
                              ) : (
                                <span className="text-lg font-semibold text-gray-700">#{entry.rank}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-black">{entry.teamName}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600">
                              {entry.members.map((m) => m.username).join(', ')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-lg font-bold text-black">{entry.bestScore.toFixed(4)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-700">
                              {entry.totalSubmissions}
                              {submissionLimit && ` / ${submissionLimit}`}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">
                              {entry.lastSubmissionAt
                                ? new Date(entry.lastSubmissionAt).toLocaleString()
                                : 'N/A'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} teams)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

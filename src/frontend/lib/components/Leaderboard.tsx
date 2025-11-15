'use client';

import { useState } from 'react';
import { useHackathonLeaderboard } from '@/lib/hooks/useHackathons';
import Button from './Button';
import { useRouter } from 'next/navigation';

interface LeaderboardProps {
  hackathonId: number;
}

const getMedalIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="6"/>
          <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
        </svg>
      );
    case 2:
      return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#C0C0C0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="6"/>
          <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
        </svg>
      );
    case 3:
      return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#CD7F32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="6"/>
          <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
        </svg>
      );
    default:
      return null;
  }
};

const Leaderboard = ({ hackathonId }: LeaderboardProps) => {
  const router = useRouter();
  const [showAll, setShowAll] = useState(false);
  const { data: leaderboardData, isLoading } = useHackathonLeaderboard(hackathonId, 1, {
    enabled: !!hackathonId,
  });

  const leaderboard = leaderboardData?.leaderboard ?? [];
  const submissionLimit = leaderboardData?.submissionLimit;
  const displayedLeaderboard = showAll ? leaderboard : leaderboard.slice(0, 10);

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 2:
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 3:
        return 'bg-orange-100 text-orange-700 border-orange-300';
      default:
        return 'bg-white text-gray-700 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <p className="text-gray-600">Loading leaderboard...</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black mb-2">Leaderboard</h2>
          <p className="text-sm text-gray-600">
            Top teams ranked by their best submission score
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push(`/challenges/${hackathonId}/leaderboard`)}>
          View Full Leaderboard
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Team
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Score
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Submissions
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Last Submitted
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayedLeaderboard.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No teams have submitted yet
                </td>
              </tr>
            ) : (
              displayedLeaderboard.map((entry) => (
                <tr
                  key={entry.teamId}
                  className={`hover:bg-gray-50 transition-colors ${
                    entry.rank <= 3 ? 'bg-gray-50/50' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getMedalIcon(entry.rank)}
                      <span
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-bold ${getRankColor(
                          entry.rank
                        )}`}
                      >
                        {entry.rank}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-black">{entry.teamName}</p>
                      <p className="text-xs text-gray-500">
                        {entry.members.map((m) => m.username).join(', ')}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-mono text-sm font-semibold text-black">
                      {entry.bestScore.toFixed(4)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm text-gray-600">
                      {entry.totalSubmissions}
                      {submissionLimit && ` / ${submissionLimit}`}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-xs text-gray-500">
                      {entry.lastSubmissionAt
                        ? new Date(entry.lastSubmissionAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'N/A'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {leaderboard.length > 10 && !showAll && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-center">
          <Button variant="outline" size="sm" onClick={() => setShowAll(true)}>
            Show All {leaderboard.length} Teams
          </Button>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;

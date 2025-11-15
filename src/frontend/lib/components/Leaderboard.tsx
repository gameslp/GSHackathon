interface LeaderboardEntry {
  rank: number;
  teamName: string;
  teamMembers: string[];
  score: number;
  submissions: number;
  lastSubmission: string;
}

interface LeaderboardProps {
  hackathonId: number;
  currentTeamId?: number;
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

// Mock data - replace with actual API call later
const generateMockLeaderboard = (hackathonId: number): LeaderboardEntry[] => {
  const teams = [
    { name: 'Data Wizards', members: ['alice_ml', 'bob_stats'], score: 0.9847 },
    { name: 'Neural Ninjas', members: ['charlie_ai', 'diana_cv', 'eve_nlp'], score: 0.9823 },
    { name: 'Kaggle Masters', members: ['frank_ds', 'grace_ml'], score: 0.9801 },
    { name: 'AI Avengers', members: ['henry_py', 'iris_r', 'jack_tf'], score: 0.9789 },
    { name: 'Deep Learners', members: ['kate_nn', 'leo_cnn'], score: 0.9765 },
    { name: 'Gradient Boosters', members: ['maya_xgb', 'noah_lgb', 'olivia_cat'], score: 0.9743 },
    { name: 'Feature Engineers', members: ['paul_fe', 'quinn_ts'], score: 0.9721 },
    { name: 'Model Ensemble', members: ['ruby_stack', 'sam_blend'], score: 0.9698 },
    { name: 'Random Forests', members: ['tina_rf', 'uma_dt', 'vince_gb'], score: 0.9675 },
    { name: 'Loss Minimizers', members: ['wendy_opt', 'xander_sgd'], score: 0.9654 },
  ];

  return teams.map((team, index) => ({
    rank: index + 1,
    teamName: team.name,
    teamMembers: team.members,
    score: team.score,
    submissions: Math.floor(Math.random() * 50) + 10,
    lastSubmission: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  }));
};

const Leaderboard = ({ hackathonId, currentTeamId }: LeaderboardProps) => {
  const leaderboard = generateMockLeaderboard(hackathonId);

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

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-black mb-2">Leaderboard</h2>
        <p className="text-sm text-gray-600">
          Top teams ranked by their best submission score
        </p>
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
                Last Submission
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {leaderboard.map((entry) => (
              <tr
                key={entry.rank}
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
                      {entry.teamMembers.join(', ')}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="font-mono text-sm font-semibold text-black">
                    {entry.score.toFixed(4)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm text-gray-600">{entry.submissions}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-xs text-gray-500">
                    {new Date(entry.lastSubmission).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          * Leaderboard updates in real-time after each submission evaluation
        </p>
      </div>
    </div>
  );
};

export default Leaderboard;

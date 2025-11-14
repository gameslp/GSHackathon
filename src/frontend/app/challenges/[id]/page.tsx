import { notFound } from 'next/navigation';
import Header from '@/lib/components/Header';
import Footer from '@/lib/components/Footer';
import Button from '@/lib/components/Button';
import { getFeaturedChallenges } from '@/lib/services/mockData';

export default async function ChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const challenges = getFeaturedChallenges();
  const challenge = challenges.find(c => c.id === parseInt(id));

  if (!challenge) {
    notFound();
  }

  const difficultyColors = {
    Beginner: 'bg-green-100 text-green-800',
    Intermediate: 'bg-blue-100 text-blue-800',
    Advanced: 'bg-orange-100 text-orange-800',
    Expert: 'bg-red-100 text-red-800',
  };

  const formatPrize = (prize: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(prize);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${difficultyColors[challenge.difficulty]}`}>
                  {challenge.difficulty}
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
                  {challenge.category}
                </span>
                {challenge.status === 'upcoming' && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">Coming Soon</span>
                )}
              </div>
              <h1 className="text-4xl font-bold text-black mb-4">{challenge.title}</h1>
              <p className="text-lg text-gray-600 mb-6">{challenge.description}</p>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {challenge.organizerName?.charAt(0) || 'O'}
                </div>
                <span>Hosted by <strong>{challenge.organizerName || 'Anonymous'}</strong></span>
              </div>
            </div>
          </div>
          {challenge.status === 'active' && (
            <div className="flex gap-4">
              <Button variant="primary" size="lg">Join Challenge</Button>
              <Button variant="outline" size="lg">Download Dataset</Button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-black mb-4">Overview</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 mb-4">{challenge.description}</p>
                <h3 className="text-lg font-semibold text-black mb-2">Challenge Goal</h3>
                <p className="text-gray-700 mb-4">Build a machine learning model to solve this real-world problem. Use the provided dataset to train your model and submit predictions on the test set.</p>
                <h3 className="text-lg font-semibold text-black mb-2">Evaluation Metric</h3>
                <p className="text-gray-700">Submissions are evaluated using the accuracy score. The leaderboard ranks submissions based on this metric.</p>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-black mb-4">Timeline</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Start Date</span>
                  <span className="font-semibold text-black">{new Date(challenge.startDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">End Date</span>
                  <span className="font-semibold text-black">{new Date(challenge.endDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Days Remaining</span>
                  <span className="font-bold text-primary text-xl">{challenge.daysRemaining} days</span>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-black mb-4">Rules</h2>
              <div className="text-gray-700 whitespace-pre-line">
                {challenge.rules}
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-black mb-4">Team Requirements</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Minimum Team Size</p>
                    <p className="text-2xl font-bold text-black">{challenge.teamMin} {challenge.teamMin === 1 ? 'member' : 'members'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Maximum Team Size</p>
                    <p className="text-2xl font-bold text-black">{challenge.teamMax} {challenge.teamMax === 1 ? 'member' : 'members'}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  You can participate individually or form a team. Teams can be created after registration and you can invite other participants to join your team.
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-black mb-4">Registration</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Registration Opens</span>
                  <span className="font-semibold text-black">{new Date(challenge.startDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Status</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    challenge.status === 'active' ? 'bg-green-100 text-green-800' : 
                    challenge.status === 'upcoming' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {challenge.status === 'active' ? 'Open' : challenge.status === 'upcoming' ? 'Coming Soon' : 'Closed'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-black mb-4">Prize Pool</h3>
              <p className="text-4xl font-bold text-primary mb-2">{formatPrize(challenge.prize)}</p>
              <p className="text-sm text-gray-600">Total prize money</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-black mb-4">Challenge Stats</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Participants</p>
                  <p className="text-2xl font-bold text-black">{challenge.status === 'upcoming' ? 'TBA' : (challenge.participants || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Teams</p>
                  <p className="text-2xl font-bold text-black">{challenge.status === 'upcoming' ? 'TBA' : Math.floor((challenge.participants || 0) / 2).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Submissions</p>
                  <p className="text-2xl font-bold text-black">{challenge.status === 'upcoming' ? 'TBA' : ((challenge.participants || 0) * 3).toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-black mb-4">Resources</h3>
              <div className="space-y-2">
                <a href="#" className="block text-primary hover:text-primary-dark font-medium">→ Discussion Forum</a>
                <a href="#" className="block text-primary hover:text-primary-dark font-medium">→ Data Description</a>
                <a href="#" className="block text-primary hover:text-primary-dark font-medium">→ Sample Notebooks</a>
                <a href="#" className="block text-primary hover:text-primary-dark font-medium">→ Submit Predictions</a>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

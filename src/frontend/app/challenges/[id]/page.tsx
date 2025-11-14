import { notFound } from 'next/navigation';
import Header from '@/lib/components/Header';
import Footer from '@/lib/components/Footer';
import Button from '@/lib/components/Button';
import { getFeaturedChallenges } from '@/lib/services/mockData';

export default function ChallengePage({ params }: { params: { id: string } }) {
  const challenges = getFeaturedChallenges();
  const challenge = challenges.find(c => c.id === params.id);

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
                <div className="w-8 h-8 bg-[#7297c5] rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {challenge.organizerName.charAt(0)}
                </div>
                <span>Hosted by <strong>{challenge.organizerName}</strong></span>
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
                  <span className="font-bold text-[#7297c5] text-xl">{challenge.daysRemaining} days</span>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-black mb-4">Rules</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Maximum 5 submissions per day</li>
                <li>Teams of up to 3 members are allowed</li>
                <li>External data sources are not permitted</li>
                <li>Final submission deadline: {new Date(challenge.endDate).toLocaleDateString()}</li>
              </ul>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-black mb-4">Prize Pool</h3>
              <p className="text-4xl font-bold text-[#7297c5] mb-2">{formatPrize(challenge.prize)}</p>
              <p className="text-sm text-gray-600">Total prize money</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-black mb-4">Challenge Stats</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Participants</p>
                  <p className="text-2xl font-bold text-black">{challenge.status === 'upcoming' ? 'TBA' : challenge.participants.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Teams</p>
                  <p className="text-2xl font-bold text-black">{challenge.status === 'upcoming' ? 'TBA' : Math.floor(challenge.participants / 2).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Submissions</p>
                  <p className="text-2xl font-bold text-black">{challenge.status === 'upcoming' ? 'TBA' : (challenge.participants * 3).toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-black mb-4">Quick Links</h3>
              <div className="space-y-2">
                <a href="#" className="block text-[#7297c5] hover:text-[#5a7ba3] font-medium">→ Discussion Forum</a>
                <a href="#" className="block text-[#7297c5] hover:text-[#5a7ba3] font-medium">→ Data Description</a>
                <a href="#" className="block text-[#7297c5] hover:text-[#5a7ba3] font-medium">→ Sample Notebooks</a>
                <a href="#" className="block text-[#7297c5] hover:text-[#5a7ba3] font-medium">→ Submit Predictions</a>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

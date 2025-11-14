import Header from '@/lib/components/Header';
import Footer from '@/lib/components/Footer';
import ChallengeCard from '@/lib/components/ChallengeCard';
import { getFeaturedChallenges } from '@/lib/services/mockData';

export default function ChallengesPage() {
  const challenges = getFeaturedChallenges();
  const activeChall = challenges.filter(c => c.status === 'active');
  const upcomingChall = challenges.filter(c => c.status === 'upcoming');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-black mb-2">All Challenges</h1>
          <p className="text-gray-600">Browse and compete in data science challenges from around the world</p>
        </div>
        <div className="mb-8 bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex flex-wrap gap-4">
            <button className="px-4 py-2 bg-[#7297c5] text-white rounded-lg font-medium">All</button>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Classification</button>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Regression</button>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">NLP</button>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Computer Vision</button>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Time Series</button>
          </div>
        </div>
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-black mb-6">Active Challenges ({activeChall.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeChall.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        </section>
        {upcomingChall.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-black mb-6">Coming Soon ({upcomingChall.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingChall.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

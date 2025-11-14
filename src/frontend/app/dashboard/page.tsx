import Header from '@/lib/components/Header';
import Footer from '@/lib/components/Footer';
import Button from '@/lib/components/Button';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-black mb-2">Welcome to Your Dashboard</h1>
            <p className="text-gray-600">Manage your challenges, submissions, and track your progress</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-black">Active Challenges</h3>
                <span className="text-3xl">🏆</span>
              </div>
              <p className="text-4xl font-bold text-[#7297c5] mb-2">3</p>
              <p className="text-sm text-gray-600">Competitions in progress</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-black">Submissions</h3>
                <span className="text-3xl">📊</span>
              </div>
              <p className="text-4xl font-bold text-[#7297c5] mb-2">12</p>
              <p className="text-sm text-gray-600">Total submissions made</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-black">Ranking</h3>
                <span className="text-3xl">🎯</span>
              </div>
              <p className="text-4xl font-bold text-[#7297c5] mb-2">#247</p>
              <p className="text-sm text-gray-600">Global ranking</p>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-black mb-6">Your Active Challenges</h2>
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-black mb-1">Customer Churn Prediction Challenge</h3>
                    <p className="text-sm text-gray-600 mb-3">Your current rank: #45 • Best score: 0.8734</p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-gray-600">23 days remaining</span>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-600">5 submissions left</span>
                    </div>
                  </div>
                  <Button variant="primary" size="sm" href="/challenges/1">Continue</Button>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-black mb-1">Sentiment Analysis for Social Media</h3>
                    <p className="text-sm text-gray-600 mb-3">Your current rank: #128 • Best score: 0.7912</p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-gray-600">34 days remaining</span>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-600">3 submissions left</span>
                    </div>
                  </div>
                  <Button variant="primary" size="sm" href="/challenges/4">Continue</Button>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-black mb-1">House Price Prediction</h3>
                    <p className="text-sm text-gray-600 mb-3">Your current rank: #89 • Best score: 0.9156</p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-gray-600">60 days remaining</span>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-600">8 submissions left</span>
                    </div>
                  </div>
                  <Button variant="primary" size="sm" href="/challenges/5">Continue</Button>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 text-center">
            <Button variant="outline" size="lg" href="/challenges">Explore More Challenges</Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

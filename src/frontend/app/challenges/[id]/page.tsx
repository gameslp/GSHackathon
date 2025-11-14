'use client';

import { notFound, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Header from '@/lib/components/Header';
import Footer from '@/lib/components/Footer';
import Button from '@/lib/components/Button';
import DatasetDownloadModal from '@/lib/components/DatasetDownloadModal';
import { getFeaturedChallenges } from '@/lib/services/mockData';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ChallengePage({ params }: PageProps) {
  const router = useRouter();
  const [id, setId] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [teamName, setTeamName] = useState('');

  useEffect(() => {
    params.then(p => setId(p.id));
    
    const checkAuth = () => {
      const user = localStorage.getItem('username');
      const authToken = localStorage.getItem('authToken');
      setIsAuthenticated(!!(user && authToken));
    };
    
    checkAuth();
  }, [params]);

  useEffect(() => {
    if (id) {
      const joinedChallenges = JSON.parse(localStorage.getItem('joinedChallenges') || '[]');
      setIsJoined(joinedChallenges.includes(parseInt(id)));
    }
  }, [id]);

  const challenges = getFeaturedChallenges();
  const challenge = challenges.find(c => c.id === parseInt(id));

  if (!challenge && id) {
    notFound();
  }

  if (!challenge) {
    return null;
  }

  const generateTeamCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleJoinChallenge = () => {
    if (!isAuthenticated) {
      localStorage.setItem('redirectAfterLogin', `/challenges/${id}`);
      router.push('/login');
      return;
    }

    setShowTeamModal(true);
  };

  const handleConfirmJoin = () => {
    setIsLoading(true);

    setTimeout(() => {
      const username = localStorage.getItem('username') || 'User';

      // Save application WITHOUT team code (will be generated after survey)
      const applications = JSON.parse(localStorage.getItem('applications') || '{}');
      const applicationId = Date.now();
      
      applications[applicationId] = {
        id: applicationId,
        challengeId: parseInt(id),
        challengeTitle: challenge.title,
        username: username,
        participationType: 'team',
        teamName: teamName,
        teamCode: null, // Will be generated after survey completion
        status: 'pending_survey', // pending_survey -> pending_approval -> approved -> rejected
        createdAt: new Date().toISOString(),
        surveyCompleted: false,
        adminDecision: null,
        adminComment: null,
      };

      localStorage.setItem('applications', JSON.stringify(applications));

      // Store current application ID for survey
      localStorage.setItem('currentApplication', applicationId.toString());

      setIsLoading(false);
      setShowTeamModal(false);

      // Redirect to survey
      router.push(`/challenges/${id}/survey?applicationId=${applicationId}`);
    }, 1000);
  };

  const handleLeaveChallenge = () => {
    if (confirm('Are you sure you want to leave this challenge?')) {
      const joinedChallenges = JSON.parse(localStorage.getItem('joinedChallenges') || '[]');
      const updated = joinedChallenges.filter((cId: number) => cId !== parseInt(id));
      localStorage.setItem('joinedChallenges', JSON.stringify(updated));

      const teams = JSON.parse(localStorage.getItem('teams') || '{}');
      delete teams[id];
      localStorage.setItem('teams', JSON.stringify(teams));

      setIsJoined(false);
    }
  };

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
              {!isJoined ? (
                <Button variant="primary" size="lg" onClick={handleJoinChallenge}>
                  Join Challenge
                </Button>
              ) : (
                <>
                  <Button variant="secondary" size="lg" onClick={handleLeaveChallenge}>
                    Leave Challenge
                  </Button>
                  <Button variant="primary" size="lg" href={`/challenges/${id}/submit`}>
                    Submit Solution
                  </Button>
                </>
              )}
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setShowDownloadModal(true)}
              >
                Download Dataset
              </Button>
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

      {/* Team Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold text-black mb-4">Utwórz zespół</h3>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Podaj nazwę zespołu. Po wypełnieniu ankiety otrzymasz 6-cyfrowy kod do zapraszania członków (max {challenge.teamMax} osoby).
              </p>
              
              <div className="mt-4">
                <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nazwa zespołu *
                </label>
                <input
                  id="teamName"
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Wpisz nazwę zespołu"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Po wypełnieniu ankiety otrzymasz 6-cyfrowy kod do zapraszania członków</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowTeamModal(false);
                  setTeamName('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                disabled={isLoading}
              >
                Anuluj
              </button>
              <button
                onClick={handleConfirmJoin}
                disabled={isLoading || !teamName.trim()}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Tworzę zespół...' : 'Dalej do ankiety'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dataset Download Modal */}
      <DatasetDownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        resources={challenge?.resources || []}
        challengeTitle={challenge?.title || ''}
      />
    </div>
  );
}

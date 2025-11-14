'use client';

import { useState } from 'react';
import Header from '@/lib/components/Header';
import Footer from '@/lib/components/Footer';
import ChallengeCard from '@/lib/components/ChallengeCard';
import { getFeaturedChallenges } from '@/lib/services/mockData';

export default function ChallengesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const challenges = getFeaturedChallenges();
  
  const filteredChallenges = selectedCategory === 'All' 
    ? challenges 
    : challenges.filter(c => c.category === selectedCategory);
  
  const activeChall = filteredChallenges.filter(c => c.status === 'active');
  const upcomingChall = filteredChallenges.filter(c => c.status === 'upcoming');
  
  const categories = ['All', 'Classification', 'Regression', 'NLP', 'Computer Vision', 'Time Series'];

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
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
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

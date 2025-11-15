'use client';

import { useMemo, useState } from 'react';
import Header from '@/lib/components/Header';
import Footer from '@/lib/components/Footer';
import ChallengeCard from '@/lib/components/ChallengeCard';
import { useHackathons } from '@/lib/hooks/useHackathons';
import type { Hackathon } from '@/lib/api/client';
import type { Challenge, HackathonResource } from '@/types';

const typeLabels: Record<string, string> = {
  CLASSIFICATION: 'Classification',
  REGRESSION: 'Regression',
  NLP: 'NLP',
  COMPUTER_VISION: 'Computer Vision',
  TIME_SERIES: 'Time Series',
  OTHER: 'Other',
};

const difficultyFromPrize = (prize?: number) => {
  if (!prize || prize < 10000) return 'Beginner';
  if (prize < 25000) return 'Intermediate';
  if (prize < 50000) return 'Advanced';
  return 'Expert';
};

const mapHackathonToChallenge = (hackathon: Hackathon): Challenge => {
  const now = new Date();
  const startDate = hackathon.startDate ? new Date(hackathon.startDate) : null;
  const endDate = hackathon.endDate ? new Date(hackathon.endDate) : null;
  const registrationOpen = hackathon.registrationOpen ? new Date(hackathon.registrationOpen) : null;

  let status: 'upcoming' | 'active' | 'completed' = 'active';
  if (startDate && startDate > now) {
    status = 'upcoming';
  } else if (endDate && endDate < now) {
    status = 'completed';
  }

  const targetDate = status === 'upcoming' ? startDate : endDate;
  const daysRemaining = targetDate
    ? Math.max(0, Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  const organizerInfo = hackathon.organizer as { username?: string; name?: string } | undefined;
  const organizerName = organizerInfo?.name || organizerInfo?.username || 'Hackathon Organizer';
  const resources = (hackathon.resources as HackathonResource[] | undefined) ?? [];

  return {
    id: hackathon.id!,
    title: hackathon.title || 'Untitled Hackathon',
    description: hackathon.description || 'No description provided.',
    rules: hackathon.rules || '',
    category: typeLabels[hackathon.type || 'OTHER'] as Challenge['category'],
    difficulty: difficultyFromPrize(hackathon.prize) as Challenge['difficulty'],
    prize: hackathon.prize ?? 0,
    organizerId: hackathon.organizerId ?? 0,
    teamMax: hackathon.teamMax ?? 1,
    teamMin: hackathon.teamMin ?? 1,
    registrationOpen: registrationOpen?.toISOString() ?? '',
    startDate: startDate?.toISOString() ?? '',
    endDate: endDate?.toISOString() ?? '',
    createdAt: hackathon.createdAt ?? '',
    updatedAt: hackathon.updatedAt ?? '',
    organizer: hackathon.organizer,
    resources,
    participants: hackathon.teams?.length ?? 0,
    daysRemaining,
    status,
    organizerName,
    thumbnailUrl: hackathon.thumbnailUrl ?? undefined,
  };
};

export default function ChallengesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const hackathonQueryParams = useMemo(() => ({ query: { limit: 50 } }), []);
  const { data, isLoading, error } = useHackathons(hackathonQueryParams);

  const challenges = useMemo(() => {
    return (data?.hackathons ?? []).map(mapHackathonToChallenge);
  }, [data?.hackathons]);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(challenges.map((challenge) => challenge.category)));
    return ['All', ...uniqueCategories];
  }, [challenges]);

  const filteredChallenges =
    selectedCategory === 'All'
      ? challenges
      : challenges.filter((challenge) => challenge.category === selectedCategory);

  const activeChallenges = filteredChallenges.filter((challenge) => challenge.status === 'active');
  const upcomingChallenges = filteredChallenges.filter((challenge) => challenge.status === 'upcoming');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-black mb-2">Hackathon Challenges</h1>
          <p className="text-gray-600">
            Discover active and upcoming hackathons powered directly by the platform backend.
          </p>
        </div>

        {isLoading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-600">
            Loading hackathons...
          </div>
        ) : error ? (
          <div className="bg-white border border-red-200 rounded-lg p-12 text-center text-red-600">
            {(error as Error).message}
          </div>
        ) : (
          <>
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
              <h2 className="text-2xl font-bold text-black mb-6">
                Active Challenges ({activeChallenges.length})
              </h2>
              {activeChallenges.length === 0 ? (
                <p className="text-gray-600">No active hackathons at the moment.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeChallenges.map((challenge) => (
                    <ChallengeCard key={challenge.id} challenge={challenge} />
                  ))}
                </div>
              )}
            </section>

            {upcomingChallenges.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-black mb-6">
                  Coming Soon ({upcomingChallenges.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingChallenges.map((challenge) => (
                    <ChallengeCard key={challenge.id} challenge={challenge} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

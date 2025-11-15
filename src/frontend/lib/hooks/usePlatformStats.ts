import { useQuery } from '@tanstack/react-query';

export interface PlatformStats {
  activeChallenges: {
    value: number;
    trend: number;
  };
  dataScientists: {
    value: number;
    trend: number;
  };
  totalPrizePool: {
    value: number;
    trend: number;
  };
  submissionsToday: {
    value: number;
    trend: number;
  };
  categoryBreakdown?: {
    CLASSIFICATION: number;
    REGRESSION: number;
    NLP: number;
    COMPUTER_VISION: number;
    TIME_SERIES: number;
    OTHER: number;
  };
}

export interface PlatformStatsResponse {
  stats: PlatformStats;
  generatedAt: string;
}

export const usePlatformStats = () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  return useQuery<PlatformStatsResponse>({
    queryKey: ['platformStats'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/stats/platform`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch platform statistics');
      }

      const data: PlatformStatsResponse = await response.json();
      return data;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
};

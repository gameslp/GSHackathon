import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/api/client';

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
}

export interface PlatformStatsResponse {
  stats: PlatformStats;
  generatedAt: string;
}

export const usePlatformStats = () => {
  return useQuery<PlatformStatsResponse>({
    queryKey: ['platformStats'],
    queryFn: async () => {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const url = `${API_BASE_URL}/stats/platform`;
      
      console.log('[usePlatformStats] Fetching from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for auth
      });
      
      console.log('[usePlatformStats] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[usePlatformStats] Error response:', errorText);
        throw new Error(`Failed to fetch platform statistics: ${response.status}`);
      }
      
      const data: PlatformStatsResponse = await response.json();
      console.log('[usePlatformStats] Data received:', data);
      return data;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 3,
    retryDelay: 1000,
  });
};

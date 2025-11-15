import { useQuery } from '@tanstack/react-query';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export type JudgeHackathonSummary = {
  id: number;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  registrationOpen?: string;
  registrationClose?: string;
  prize?: number;
  type?: string;
};

export const judgeKeys = {
  all: ['judge'] as const,
  hackathons: () => [...judgeKeys.all, 'hackathons'] as const,
};

export function useJudgeHackathons(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: judgeKeys.hackathons(),
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/judges/hackathons`, {
        credentials: 'include',
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = (data as { error?: string })?.error || 'Failed to load hackathons';
        throw new Error(message);
      }

      return ((data as { hackathons?: JudgeHackathonSummary[] }).hackathons ?? []).map(
        (hackathon) => ({
          ...hackathon,
        })
      );
    },
  });
}

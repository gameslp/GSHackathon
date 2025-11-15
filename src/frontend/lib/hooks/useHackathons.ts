import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getHackathons,
  getHackathonsById,
  getHackathonsActive,
  getHackathonsUpcoming,
  postHackathons,
  putHackathonsById,
  deleteHackathonsById,
  type GetHackathonsData,
  type PostHackathonsData,
  type PutHackathonsByIdData,
  type Hackathon,
} from '@/lib/api/client';
import { unwrapResponse } from '@/lib/api/utils';

// Query keys
export const hackathonKeys = {
  all: ['hackathons'] as const,
  lists: () => [...hackathonKeys.all, 'list'] as const,
  list: (filters: GetHackathonsData) => [...hackathonKeys.lists(), filters] as const,
  details: () => [...hackathonKeys.all, 'detail'] as const,
  detail: (id: number) => [...hackathonKeys.details(), id] as const,
  autoTesting: (id: number) => [...hackathonKeys.details(), id, 'auto-testing'] as const,
  judgeAssignments: () => [...hackathonKeys.all, 'judge-hackathons'] as const,
  active: () => [...hackathonKeys.all, 'active'] as const,
  upcoming: () => [...hackathonKeys.all, 'upcoming'] as const,
  leaderboard: (id: number, page?: number) => [...hackathonKeys.all, 'leaderboard', id, page] as const,
};

/**
 * Hook to get paginated list of hackathons
 */
export function useHackathons(params?: GetHackathonsData) {
  return useQuery({
    queryKey: hackathonKeys.list(params || {}),
    queryFn: async () => {
      const response = await getHackathons(params);
      return unwrapResponse(response);
    },
  });
}

/**
 * Hook to get a specific hackathon by ID
 */
export function useHackathon(id: number) {
  return useQuery({
    queryKey: hackathonKeys.detail(id),
    queryFn: async () => {
      const response = await getHackathonsById({ path: { id } });
      return unwrapResponse(response);
    },
    enabled: !!id,
  });
}

/**
 * Hook to get active hackathons
 */
export function useActiveHackathons() {
  return useQuery({
    queryKey: hackathonKeys.active(),
    queryFn: async () => {
      const response = await getHackathonsActive();
      return unwrapResponse(response);
    },
  });
}

/**
 * Hook to get upcoming hackathons
 */
export function useUpcomingHackathons() {
  return useQuery({
    queryKey: hackathonKeys.upcoming(),
    queryFn: async () => {
      const response = await getHackathonsUpcoming();
      return unwrapResponse(response);
    },
  });
}

/**
 * Hook to create a new hackathon
 */
export function useCreateHackathon() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: PostHackathonsData) => {
      const response = await postHackathons(data);
      return unwrapResponse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hackathonKeys.lists() });
    },
  });
}

/**
 * Hook to update a hackathon
 */
export function useUpdateHackathon() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: PutHackathonsByIdData['body'];
    }) => {
      const response = await putHackathonsById({
        path: { id },
        body: data,
      });
      return unwrapResponse(response);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: hackathonKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: hackathonKeys.lists() });
    },
  });
}

/**
 * Hook to delete a hackathon
 */
export function useDeleteHackathon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await deleteHackathonsById({ path: { id } });
      return unwrapResponse(response);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: hackathonKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: hackathonKeys.lists() });
    },
  });
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface LeaderboardEntry {
  rank: number;
  teamId: number;
  teamName: string;
  members: { id: number; username: string }[];
  bestScore: number;
  totalSubmissions: number;
  lastSubmissionAt: string | null;
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  submissionLimit: number | null;
  currentUserTeamRank: number | null;
}

/**
 * Hook to get hackathon leaderboard
 */
export function useHackathonLeaderboard(hackathonId: number, page: number = 1, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: hackathonKeys.leaderboard(hackathonId, page),
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/hackathons/${hackathonId}/leaderboard?page=${page}&limit=50`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as { error?: string })?.error ?? 'Failed to fetch leaderboard');
      }

      return response.json() as Promise<LeaderboardResponse>;
    },
    enabled: options?.enabled ?? true,
  });
}

interface AutoTestingConfig {
  autoScoringAvailable: boolean;
  autoScoringEnabled: boolean;
  script: {
    id: number;
    title: string;
    name: string;
    uploadedAt: string;
  } | null;
}

export function useHackathonAutoTesting(hackathonId: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: hackathonKeys.autoTesting(hackathonId),
    enabled: Boolean(hackathonId) && (options?.enabled ?? true),
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/hackathons/${hackathonId}/auto-testing`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as { error?: string })?.error ?? 'Failed to load auto review settings');
      }

      return (await response.json()) as AutoTestingConfig;
    },
  });
}

export function useUploadAutoReviewScript() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ hackathonId, file, title }: { hackathonId: number; file: File; title?: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      if (title) {
        formData.append('title', title);
      }

      const response = await fetch(`${API_BASE_URL}/hackathons/${hackathonId}/auto-testing/script`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as { error?: string })?.error ?? 'Failed to upload auto review script');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: hackathonKeys.autoTesting(variables.hackathonId) });
      queryClient.invalidateQueries({ queryKey: hackathonKeys.detail(variables.hackathonId) });
    },
  });
}

export function useDeleteAutoReviewScript() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (hackathonId: number) => {
      const response = await fetch(`${API_BASE_URL}/hackathons/${hackathonId}/auto-testing/script`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as { error?: string })?.error ?? 'Failed to delete auto review script');
      }

      return response.json();
    },
    onSuccess: (_, hackathonId) => {
      queryClient.invalidateQueries({ queryKey: hackathonKeys.autoTesting(hackathonId) });
      queryClient.invalidateQueries({ queryKey: hackathonKeys.detail(hackathonId) });
    },
  });
}

export function useJudgeHackathons(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: hackathonKeys.judgeAssignments(),
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/hackathons/judges/hackathons`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as { error?: string })?.error ?? 'Failed to load assigned hackathons');
      }

      const data = (await response.json()) as { hackathons: Hackathon[] };
      return data.hackathons;
    },
  });
}

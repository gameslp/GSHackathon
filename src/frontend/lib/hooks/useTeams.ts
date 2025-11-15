import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  postTeamsCreate,
  postTeamsJoin,
  getTeamsHackathonByHackathonId,
  getTeamsHackathonByHackathonIdSurvey,
  type PostTeamsCreateData,
  type PostTeamsJoinData,
  type TeamDetails,
  type PostTeamsCreateResponses,
  type PostTeamsJoinResponses,
} from '@/lib/api/client';
import { client as apiClient } from '@/lib/api/client';
import { unwrapResponse } from '@/lib/api/utils';

// Query keys
export const teamKeys = {
  all: ['teams'] as const,
  myTeam: (hackathonId: number) => [...teamKeys.all, 'my', hackathonId] as const,
  myTeamsList: () => [...teamKeys.all, 'list'] as const,
  survey: (hackathonId: number) => [...teamKeys.all, 'survey', hackathonId] as const,
};

/**
 * Hook to get user's team for a specific hackathon
 */
export function useMyTeam(
  hackathonId?: number,
  options?: {
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: teamKeys.myTeam(hackathonId || -1),
    queryFn: async () => {
      if (!hackathonId) {
        return null;
      }

      try {
        const response = await getTeamsHackathonByHackathonId({
          path: { hackathonId },
        });
        const data = unwrapResponse<{ team?: TeamDetails }>(response);
        return data?.team ?? null;
      } catch (err: unknown) {
        if (typeof err === 'object' && err !== null && 'status' in err) {
          const status = (err as { status?: number }).status;
          if (status === 404) {
            return null;
          }
        }
        throw err;
      }
    },
    enabled: !!hackathonId && (options?.enabled ?? true),
  });
}

/**
 * Hook to get survey questions for a hackathon
 */
export function useHackathonSurvey(hackathonId: number) {
  return useQuery({
    queryKey: teamKeys.survey(hackathonId),
    queryFn: async () => {
      const response = await getTeamsHackathonByHackathonIdSurvey({
        path: { hackathonId },
      });
      return unwrapResponse(response);
    },
    enabled: !!hackathonId,
  });
}

const invalidateTeamQueries = (team: TeamDetails | undefined, queryClient: ReturnType<typeof useQueryClient>) => {
  if (team?.hackathon?.id) {
    queryClient.invalidateQueries({ queryKey: teamKeys.myTeam(team.hackathon.id) });
  }
  queryClient.invalidateQueries({ queryKey: teamKeys.myTeamsList() });
};

export type UserTeamSummary = {
  id: number;
  name: string;
  invitationCode: string;
  captainId: number;
  isCaptain: boolean;
  isAccepted: boolean;
  memberCount: number;
  hackathon?: {
    id: number;
    title: string;
    startDate?: string;
    endDate?: string;
  };
  createdAt?: string;
  updatedAt?: string;
};

export function useUserTeams(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: teamKeys.myTeamsList(),
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const response = await apiClient.get<{ teams?: UserTeamSummary[] }, { error?: string }>({
        url: '/teams/my',
      });
      if ('error' in response && response.error) {
        const message = typeof response.error === 'string' ? response.error : response.error?.error;
        throw new Error(message || 'Failed to load teams');
      }
      return response.data?.teams ?? [];
    },
  });
}

/**
 * Hook to create a new team
 */
export function useCreateTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: PostTeamsCreateData) => {
      const response = await postTeamsCreate(data);
      return unwrapResponse<PostTeamsCreateResponses['201']>(response);
    },
    onSuccess: (data) => {
      if (data?.team) {
        invalidateTeamQueries(data.team, queryClient);
      }
    },
  });
}

/**
 * Hook to join an existing team
 */
export function useJoinTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: PostTeamsJoinData) => {
      const response = await postTeamsJoin(data);
      return unwrapResponse<PostTeamsJoinResponses['200']>(response);
    },
    onSuccess: (data) => {
      if (data?.team) {
        invalidateTeamQueries(data.team, queryClient);
      }
    },
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  postTeamsCreate,
  postTeamsJoin,
  getTeamsHackathonByHackathonId,
  getTeamsHackathonByHackathonIdSurvey,
  type PostTeamsCreateData,
  type PostTeamsJoinData,
} from '@/lib/api/client';

// Query keys
export const teamKeys = {
  all: ['teams'] as const,
  myTeam: (hackathonId: number) => [...teamKeys.all, 'my', hackathonId] as const,
  survey: (hackathonId: number) => [...teamKeys.all, 'survey', hackathonId] as const,
};

/**
 * Hook to get user's team for a specific hackathon
 */
export function useMyTeam(hackathonId: number) {
  return useQuery({
    queryKey: teamKeys.myTeam(hackathonId),
    queryFn: async () => {
      const response = await getTeamsHackathonByHackathonId({
        path: { hackathonId },
      });
      return response.data;
    },
    enabled: !!hackathonId,
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
      return response.data;
    },
    enabled: !!hackathonId,
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
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate the my team query for this hackathon
      if (data && data.team && 'hackathon' in data.team) {
        const hackathonId = (data.team as any).hackathon?.id;
        if (hackathonId) {
          queryClient.invalidateQueries({ queryKey: teamKeys.myTeam(hackathonId) });
        }
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
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate the my team query for this hackathon
      if (data && data.team && 'hackathon' in data.team) {
        const hackathonId = (data.team as any).hackathon?.id;
        if (hackathonId) {
          queryClient.invalidateQueries({ queryKey: teamKeys.myTeam(hackathonId) });
        }
      }
    },
  });
}

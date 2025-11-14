import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminUsers,
  patchAdminUsersByIdRole,
  deleteAdminUsersById,
  getHackathonsByHackathonIdTeams,
  getHackathonsTeamsByTeamId,
  postHackathonsTeamsByTeamIdAccept,
  postHackathonsTeamsByTeamIdReject,
  type GetAdminUsersData,
  type PatchAdminUsersByIdRoleData,
  type GetHackathonsByHackathonIdTeamsData,
  type GetHackathonsTeamsByTeamIdData,
  type PostHackathonsTeamsByTeamIdAcceptResponses,
  type PostHackathonsTeamsByTeamIdRejectResponses,
} from '@/lib/api/client';
import { unwrapResponse } from '@/lib/api/utils';

// Query keys
export const adminKeys = {
  all: ['admin'] as const,
  users: () => [...adminKeys.all, 'users'] as const,
  usersList: (filters: GetAdminUsersData) => [...adminKeys.users(), filters] as const,
  hackathonTeams: (hackathonId: number, filters?: unknown) =>
    [...adminKeys.all, 'hackathon', hackathonId, 'teams', filters] as const,
  teamDetail: (teamId: number) => [...adminKeys.all, 'team', teamId] as const,
};

/**
 * Hook to get all users (Admin only)
 */
export function useAdminUsers(params?: GetAdminUsersData) {
  return useQuery({
    queryKey: adminKeys.usersList(params || {}),
    queryFn: async () => {
      const response = await getAdminUsers(params);
      return unwrapResponse(response);
    },
  });
}

/**
 * Hook to update user role (Admin only)
 */
export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: number;
      role: NonNullable<PatchAdminUsersByIdRoleData['body']>['role'];
    }) => {
      const response = await patchAdminUsersByIdRole({
        path: { id: userId },
        body: { role },
      });
      return unwrapResponse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

/**
 * Hook to delete user (Admin only)
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: number) => {
      const response = await deleteAdminUsersById({ path: { id: userId } });
      return unwrapResponse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

/**
 * Hook to get all teams for a hackathon (Admin only)
 */
export function useHackathonTeams(
  hackathonId: number,
  params?: Pick<GetHackathonsByHackathonIdTeamsData, 'query'>
) {
  return useQuery({
    queryKey: adminKeys.hackathonTeams(hackathonId, params?.query),
    queryFn: async () => {
      const response = await getHackathonsByHackathonIdTeams({
        path: { hackathonId },
        query: params?.query,
      });
      return unwrapResponse(response);
    },
    enabled: !!hackathonId,
  });
}

/**
 * Hook to get team details with survey responses (Admin only)
 */
export function useTeamDetail(teamId: number) {
  return useQuery({
    queryKey: adminKeys.teamDetail(teamId),
    queryFn: async () => {
      const response = await getHackathonsTeamsByTeamId({
        path: { teamId } satisfies GetHackathonsTeamsByTeamIdData['path'],
      });
      return unwrapResponse(response);
    },
    enabled: !!teamId,
  });
}

/**
 * Hook to accept a team (Admin only)
 */
export function useAcceptTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ teamId, hackathonId }: { teamId: number; hackathonId?: number }) => {
      const response = await postHackathonsTeamsByTeamIdAccept({
        path: { teamId },
      });
      const data = unwrapResponse<PostHackathonsTeamsByTeamIdAcceptResponses['200']>(response);
      return { data, hackathonId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.teamDetail(variables.teamId) });
      if (variables.hackathonId) {
        queryClient.invalidateQueries({ queryKey: adminKeys.hackathonTeams(variables.hackathonId) });
      }
    },
  });
}

/**
 * Hook to reject a team (Admin only)
 */
export function useRejectTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ teamId, hackathonId }: { teamId: number; hackathonId?: number }) => {
      const response = await postHackathonsTeamsByTeamIdReject({
        path: { teamId },
      });
      const data = unwrapResponse<PostHackathonsTeamsByTeamIdRejectResponses['200']>(response);
      return { data, hackathonId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.teamDetail(variables.teamId) });
      if (variables.hackathonId) {
        queryClient.invalidateQueries({ queryKey: adminKeys.hackathonTeams(variables.hackathonId) });
      }
    },
  });
}

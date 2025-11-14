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
} from '@/lib/api/client';

// Query keys
export const adminKeys = {
  all: ['admin'] as const,
  users: () => [...adminKeys.all, 'users'] as const,
  usersList: (filters: GetAdminUsersData) => [...adminKeys.users(), filters] as const,
  hackathonTeams: (hackathonId: number) => [...adminKeys.all, 'hackathon', hackathonId, 'teams'] as const,
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
      return response.data;
    },
  });
}

/**
 * Hook to update user role (Admin only)
 */
export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: 'ADMIN' | 'JUDGE' | 'PARTICIPANT' }) => {
      const response = await patchAdminUsersByIdRole({
        path: { id: userId },
        body: { role },
      } as any);
      return response.data;
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
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

/**
 * Hook to get all teams for a hackathon (Admin only)
 */
export function useHackathonTeams(hackathonId: number, params?: any) {
  return useQuery({
    queryKey: adminKeys.hackathonTeams(hackathonId),
    queryFn: async () => {
      const response = await getHackathonsByHackathonIdTeams({
        path: { hackathonId },
        ...params,
      } as any);
      return response.data;
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
        path: { teamId },
      });
      return response.data;
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
    mutationFn: async (teamId: number) => {
      const response = await postHackathonsTeamsByTeamIdAccept({
        path: { teamId },
      });
      return response.data;
    },
    onSuccess: (_, teamId) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.teamDetail(teamId) });
      // Also invalidate the hackathon teams list
      queryClient.invalidateQueries({ queryKey: [...adminKeys.all, 'hackathon'] });
    },
  });
}

/**
 * Hook to reject a team (Admin only)
 */
export function useRejectTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (teamId: number) => {
      const response = await postHackathonsTeamsByTeamIdReject({
        path: { teamId },
      });
      return response.data;
    },
    onSuccess: (_, teamId) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.teamDetail(teamId) });
      // Also invalidate the hackathon teams list
      queryClient.invalidateQueries({ queryKey: [...adminKeys.all, 'hackathon'] });
    },
  });
}

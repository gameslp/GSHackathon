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
  type DeleteHackathonsByIdData,
} from '@/lib/api/client';

// Query keys
export const hackathonKeys = {
  all: ['hackathons'] as const,
  lists: () => [...hackathonKeys.all, 'list'] as const,
  list: (filters: GetHackathonsData) => [...hackathonKeys.lists(), filters] as const,
  details: () => [...hackathonKeys.all, 'detail'] as const,
  detail: (id: number) => [...hackathonKeys.details(), id] as const,
  active: () => [...hackathonKeys.all, 'active'] as const,
  upcoming: () => [...hackathonKeys.all, 'upcoming'] as const,
};

/**
 * Hook to get paginated list of hackathons
 */
export function useHackathons(params?: GetHackathonsData) {
  return useQuery({
    queryKey: hackathonKeys.list(params || {}),
    queryFn: async () => {
      const response = await getHackathons(params);
      return response.data;
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
      return response.data;
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
      return response.data;
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
      return response.data;
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
      return response.data;
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
    mutationFn: async ({ id, data }: { id: number; data: PutHackathonsByIdData }) => {
      const response = await putHackathonsById({ path: { id }, ...data } as any);
      return response.data;
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
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: hackathonKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: hackathonKeys.lists() });
    },
  });
}

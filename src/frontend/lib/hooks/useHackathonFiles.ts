import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hackathonKeys } from '@/lib/hooks/useHackathons';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export type ProvidedFileRecord = {
  id: number;
  hackathonId: number;
  title: string;
  name: string;
  fileUrl: string;
  public: boolean;
  createdAt: string;
  updatedAt?: string;
};

const parseError = async (response: Response) => {
  const data = await response.json().catch(() => ({}));
  const message = (data as { error?: string })?.error ?? 'Request failed';
  throw new Error(message);
};

export const fileKeys = {
  provided: (hackathonId: number) => ['files', 'provided', hackathonId] as const,
};

export function useProvidedFiles(hackathonId?: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: fileKeys.provided(hackathonId ?? -1),
    enabled: Boolean(hackathonId) && (options?.enabled ?? true),
    queryFn: async () => {
      if (!hackathonId) return [];

      const response = await fetch(`${API_BASE_URL}/hackathons/${hackathonId}/provided-files`, {
        credentials: 'include',
      });

      if (response.status === 403) {
        return [];
      }

      const data = await response.json().catch(() => []);

      if (!response.ok) {
        const message = (data as { error?: string })?.error ?? 'Failed to load provided files';
        throw new Error(message);
      }

      return data as ProvidedFileRecord[];
    },
  });
}

export function useUploadHackathonResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      hackathonId,
      title,
      file,
    }: {
      hackathonId: number;
      title: string;
      file: File;
    }) => {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/hackathons/${hackathonId}/resources`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json().catch(() => ({}));
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: hackathonKeys.detail(variables.hackathonId) });
    },
  });
}

export function useDeleteHackathonResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      hackathonId,
      resourceId,
    }: {
      hackathonId: number;
      resourceId: number;
    }) => {
      const response = await fetch(
        `${API_BASE_URL}/hackathons/${hackathonId}/resources/${resourceId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        await parseError(response);
      }

      return response.json().catch(() => ({}));
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: hackathonKeys.detail(variables.hackathonId) });
    },
  });
}

export function useUploadProvidedFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      hackathonId,
      name,
      title,
      file,
      isPublic,
    }: {
      hackathonId: number;
      name: string;
      title: string;
      file: File;
      isPublic: boolean;
    }) => {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('file', file);
      formData.append('public', String(isPublic));
      formData.append('name', name);

      const response = await fetch(`${API_BASE_URL}/hackathons/${hackathonId}/provided-files`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json().catch(() => ({}));
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: fileKeys.provided(variables.hackathonId) });
    },
  });
}

export function useDeleteProvidedFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fileId }: { hackathonId: number; fileId: number }) => {
      const response = await fetch(`${API_BASE_URL}/hackathons/provided-files/${fileId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json().catch(() => ({}));
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: fileKeys.provided(variables.hackathonId) });
    },
  });
}

export function useToggleProvidedFileVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fileId }: { hackathonId: number; fileId: number }) => {
      const response = await fetch(
        `${API_BASE_URL}/hackathons/provided-files/${fileId}/toggle`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        await parseError(response);
      }

      return response.json().catch(() => ({}));
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: fileKeys.provided(variables.hackathonId) });
    },
  });
}

export function useUploadHackathonThumbnail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ hackathonId, file }: { hackathonId: number; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/hackathons/${hackathonId}/thumbnail`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json().catch(() => ({}));
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: hackathonKeys.detail(variables.hackathonId) });
      queryClient.invalidateQueries({ queryKey: hackathonKeys.lists(), exact: false });
    },
  });
}

export function useUploadSubmissionFile() {
  return useMutation({
    mutationFn: async ({
      hackathonId,
      file,
      formatId,
    }: {
      hackathonId: number;
      file: File;
      formatId: number;
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('hackathonId', String(hackathonId));
      formData.append('fileFormatId', String(formatId));

      const response = await fetch(`${API_BASE_URL}/hackathons/submissions/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        await parseError(response);
      }

      const data = await response.json();
      return data.fileUrl as string;
    },
  });
}

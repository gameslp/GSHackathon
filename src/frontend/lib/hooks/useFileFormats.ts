import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface FileFormat {
  id: number;
  hackathonId: number;
  name: string;
  description: string;
  extension: string;
  maxSizeKB: number;
  obligatory: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FileValidationResult {
  valid: boolean;
  errors: string[];
}

const parseError = async (response: Response) => {
  const data = await response.json().catch(() => ({}));
  const message = (data as { error?: string })?.error ?? 'Request failed';
  throw new Error(message);
};

// Get file format requirements for a hackathon
export function useFileFormats(hackathonId: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['file-formats', hackathonId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/hackathons/${hackathonId}/file-formats`, {
        credentials: 'include',
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json() as Promise<FileFormat[]>;
    },
    enabled: options?.enabled ?? true,
  });
}

// Create a file format requirement (admin/organizer only)
export function useCreateFileFormat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      hackathonId,
      data,
    }: {
      hackathonId: number;
      data: {
        name: string;
        description: string;
        extension: string;
        maxSizeKB: number;
        obligatory?: boolean;
      };
    }) => {
      const response = await fetch(`${API_BASE_URL}/hackathons/${hackathonId}/file-formats`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json();
    },
    onSuccess: (_, { hackathonId }) => {
      queryClient.invalidateQueries({ queryKey: ['file-formats', hackathonId] });
    },
  });
}

// Update a file format requirement (admin/organizer only)
export function useUpdateFileFormat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      formatId,
      data,
    }: {
      formatId: number;
      hackathonId: number;
      data: {
        name?: string;
        description?: string;
        extension?: string;
        maxSizeKB?: number;
        obligatory?: boolean;
      };
    }) => {
      const response = await fetch(`${API_BASE_URL}/file-formats/${formatId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json();
    },
    onSuccess: (_, { hackathonId }) => {
      queryClient.invalidateQueries({ queryKey: ['file-formats', hackathonId] });
    },
  });
}

// Delete a file format requirement (admin/organizer only)
export function useDeleteFileFormat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ formatId }: { formatId: number; hackathonId: number }) => {
      const response = await fetch(`${API_BASE_URL}/file-formats/${formatId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json();
    },
    onSuccess: (_, { hackathonId }) => {
      queryClient.invalidateQueries({ queryKey: ['file-formats', hackathonId] });
    },
  });
}

// Validate a file against format requirements
export function useValidateFile() {
  return useMutation({
    mutationFn: async ({
      formatId,
      fileName,
      fileSizeKB,
    }: {
      formatId: number;
      fileName: string;
      fileSizeKB: number;
    }) => {
      const response = await fetch(`${API_BASE_URL}/file-formats/${formatId}/validate`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileName, fileSizeKB }),
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json() as Promise<FileValidationResult>;
    },
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const parseError = async (response: Response) => {
  const data = await response.json().catch(() => ({}));
  const message = (data as { error?: string })?.error ?? 'Request failed';
  throw new Error(message);
};

export interface SubmissionFile {
  id: number;
  fileFormatId: number;
  fileUrl: string;
  submissionId: number;
  createdAt: string;
  updatedAt: string;
  fileFormat?: {
    id: number;
    name: string;
    description: string;
    extension: string;
    maxSizeKB: number;
    obligatory: boolean;
  };
}

export interface Submission {
  id: number;
  teamId: number;
  hackathonId: number;
  score?: number | null;
  scoreComment?: string | null;
  scoreManual?: boolean;
  scoredAt?: string | null;
  sendAt?: string | null;
  createdAt: string;
  updatedAt: string;
  files?: SubmissionFile[];
  team?: {
    id: number;
    name: string;
    invitationCode: string;
  };
}

// Get team's submission for a hackathon
export function useMyTeamSubmission(hackathonId: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['my-submission', hackathonId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/hackathons/${hackathonId}/my-submission`, {
        credentials: 'include',
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json() as Promise<Submission>;
    },
    enabled: options?.enabled ?? true,
  });
}

// Get all team's submissions for a hackathon
export function useMyTeamSubmissions(hackathonId: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['my-submissions', hackathonId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/hackathons/${hackathonId}/my-submissions`, {
        credentials: 'include',
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json() as Promise<Submission[]>;
    },
    enabled: options?.enabled ?? true,
  });
}

// Get submission by ID
export function useSubmission(submissionId: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['submission', submissionId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/submissions/${submissionId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json() as Promise<Submission>;
    },
    enabled: options?.enabled ?? true,
  });
}

// Get all submissions for a hackathon (admin/judge/organizer only)
export function useHackathonSubmissions(hackathonId: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['hackathon-submissions', hackathonId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/hackathons/${hackathonId}/submissions`, {
        credentials: 'include',
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json() as Promise<Submission[]>;
    },
    enabled: options?.enabled ?? true,
  });
}

// Create a draft submission
export function useCreateSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (hackathonId: number) => {
      const response = await fetch(`${API_BASE_URL}/hackathons/${hackathonId}/submissions`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json();
    },
    onSuccess: (_, hackathonId) => {
      queryClient.invalidateQueries({ queryKey: ['my-submission', hackathonId] });
      queryClient.invalidateQueries({ queryKey: ['my-submissions', hackathonId] });
      queryClient.invalidateQueries({ queryKey: ['hackathon-submissions', hackathonId] });
    },
  });
}

// Submit/finalize a submission
export function useSubmitSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      hackathonId,
      submissionId,
      files,
    }: {
      hackathonId: number;
      submissionId: number;
      files: { fileFormatId: number; fileUrl: string }[];
    }) => {
      const response = await fetch(`${API_BASE_URL}/hackathons/${hackathonId}/submissions/${submissionId}/submit`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files }),
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json();
    },
    onSuccess: (_, { hackathonId }) => {
      queryClient.invalidateQueries({ queryKey: ['my-submission', hackathonId] });
      queryClient.invalidateQueries({ queryKey: ['my-submissions', hackathonId] });
      queryClient.invalidateQueries({ queryKey: ['hackathon-submissions', hackathonId] });
    },
  });
}

export function useSaveDraftSubmissionFiles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      files,
    }: {
      submissionId: number;
      hackathonId: number;
      files: { fileFormatId: number; fileUrl: string }[];
    }) => {
      const response = await fetch(`${API_BASE_URL}/submissions/${submissionId}/files`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files }),
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json();
    },
    onSuccess: (_, { submissionId, hackathonId }) => {
      queryClient.invalidateQueries({ queryKey: ['submission', submissionId] });
      queryClient.invalidateQueries({ queryKey: ['my-submissions', hackathonId] });
      queryClient.invalidateQueries({ queryKey: ['hackathon-submissions', hackathonId] });
    },
  });
}

// Score a submission (admin/judge/organizer only)
export function useScoreSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      score,
      scoreComment,
    }: {
      submissionId: number;
      score: number;
      scoreComment?: string;
    }) => {
      const response = await fetch(`${API_BASE_URL}/submissions/${submissionId}/score`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ score, scoreComment }),
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json();
    },
    onSuccess: (data, { submissionId }) => {
      queryClient.invalidateQueries({ queryKey: ['submission', submissionId] });
      queryClient.invalidateQueries({ queryKey: ['hackathon-submissions'], exact: false });
    },
  });
}

// Get AI code assistance for a submission
export interface AIHint {
  message: string;
  line: number;
}

export interface AIAssistanceResponse {
  message: string;
  assistance: {
    hints: AIHint[];
  };
}

export function useAICodeAssistance() {
  return useMutation({
    mutationFn: async ({
      submissionId,
      pythonFile,
    }: {
      submissionId: number;
      pythonFile: string;
    }) => {
      const response = await fetch(`${API_BASE_URL}/submissions/${submissionId}/ai-assistance`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pythonFile }),
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json() as Promise<AIAssistanceResponse>;
    },
  });
}

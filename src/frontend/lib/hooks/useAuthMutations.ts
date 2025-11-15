import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  postAuthRegisterStart,
  postAuthRegisterConfirm,
  postAuthLogin,
  getAuthMe,
  postAuthLogout,
  patchAuthProfile,
  type RegisterConfirmRequest,
  type LoginRequest,
  type UserProfile,
} from '@/lib/api/client';
import { unwrapResponse } from '@/lib/api/utils';

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};

/**
 * Hook to get current user
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: async () => {
      try {
        const response = await getAuthMe();
        return unwrapResponse<UserProfile>(response);
      } catch (err: unknown) {
        if (typeof err === 'object' && err !== null && 'status' in err) {
          const status = (err as { status?: number }).status;
          if (status === 401) {
            return null;
          }
        }
        throw err;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to start registration (get TOTP secret)
 * POST /auth/register-start
 * Body: { username: string }
 * Response: { userId, username, totpSecret }
 */
export function useRegisterStart() {
  return useMutation({
    mutationFn: async (username: string) => {
      const response = await postAuthRegisterStart({
        body: { username },
      });
      return unwrapResponse(response);
    },
  });
}

/**
 * Hook to confirm registration with TOTP code
 * POST /auth/register-confirm
 * Body: { username: string, token: string }
 * Response: { message }
 */
export function useRegisterConfirm() {
  const router = useRouter();
  
  return useMutation({
    mutationFn: async (data: RegisterConfirmRequest) => {
      const response = await postAuthRegisterConfirm({
        body: data,
      });
      return unwrapResponse(response);
    },
    onSuccess: () => {
      router.push('/login?registered=true');
    },
  });
}

/**
 * Hook to login
 * POST /auth/login
 * Body: { username: string, token: string }
 * Response: { message, user: { id, username, role } }
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();
  
  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const response = await postAuthLogin({
        body: credentials,
      });
      return unwrapResponse(response);
    },
    onSuccess: (data) => {
      // Update user query cache
      if (data && data.user) {
        queryClient.setQueryData(authKeys.me(), data.user);
      }
      window.dispatchEvent(new Event('auth-change'));
      router.push('/profile');
    },
  });
}

/**
 * Hook to logout
 * POST /auth/logout (protected)
 * Response: { message }
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  
  return useMutation({
    mutationFn: async () => {
      const response = await postAuthLogout();
      return unwrapResponse(response);
    },
    onSuccess: () => {
      // Clear all queries
      queryClient.clear();
      window.dispatchEvent(new Event('auth-change'));
      router.push('/');
    },
  });
}

/**
 * Hook to update user profile
 * PATCH /auth/profile (protected)
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { name?: string; surname?: string; email?: string }) => {
      const response = await patchAuthProfile({
        body: data,
      });
      return unwrapResponse(response);
    },
    onSuccess: (data) => {
      // Update user query cache
      if (data && data.user) {
        queryClient.setQueryData(authKeys.me(), data.user);
      }
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}

/**
 * Generate QR code URL for TOTP setup
 */
export function generateTotpQrCodeUrl(
  username: string,
  totpSecret: string,
  issuer: string = 'HackathonHub'
): string {
  const totpUri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(username)}?secret=${totpSecret}&issuer=${encodeURIComponent(issuer)}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(totpUri)}`;
}

/**
 * Validate TOTP code format (6 digits)
 */
export function isValidTotpCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}

/**
 * Validate username format
 */
export function isValidUsername(username: string): boolean {
  return username.trim().length >= 3 && /^[a-zA-Z0-9_-]+$/.test(username);
}

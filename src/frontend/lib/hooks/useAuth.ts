import { useCurrentUser, useLogout } from './useAuthMutations';

export function useAuth() {
  const { data: user, isLoading: loading, error, refetch } = useCurrentUser();
  const logoutMutation = useLogout();

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    user: user || null,
    loading,
    error: error?.message || null,
    logout,
    isLoggingOut: logoutMutation.isPending,
    refetch,
  };
}

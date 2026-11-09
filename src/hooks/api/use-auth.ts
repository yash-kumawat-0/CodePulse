import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractData } from '@/lib/api-client';

// Types (simplified for integration, ideally imported from shared types)
export interface User {
  id: string;
  githubId: string;
  username: string;
  name: string | null;
  avatar: string | null;
  bio: string | null;
  [key: string]: any;
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['auth', 'current-user'],
    queryFn: async () => {
      // In a real app this hits GET /auth/me or GET /users/profile
      const response = await apiClient.get('/users/profile');
      return extractData<User>(response);
    },
    // We can use retry: false to not spam if unauthenticated
    retry: false,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      // Clear token from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('devbattle_token');
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'current-user'], null);
      queryClient.clear();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const response = await apiClient.post('/auth/forgot-password', { email });
      return extractData<{ success: boolean; message: string; token?: string }>(response);
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async ({ token, password }: { token: string; password: string }) => {
      const response = await apiClient.post('/auth/reset-password', { token, password });
      return extractData<{ success: boolean; message: string }>(response);
    },
  });
}

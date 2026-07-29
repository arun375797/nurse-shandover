import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchMe,
  login as apiLogin,
  logout as apiLogout,
  type AuthResponse,
  type SessionUser,
  type UnitInfo,
} from '../api/patients';
import { ApiError } from '../api/client';

type AuthContextValue = {
  user: SessionUser | null;
  unit: UnitInfo | null;
  timezone: string;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [bootstrapped, setBootstrapped] = useState(false);

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        return await fetchMe();
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          return null;
        }
        throw err;
      } finally {
        setBootstrapped(true);
      }
    },
    retry: false,
    staleTime: 60_000,
  });

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await apiLogin(email, password);
      queryClient.setQueryData(['auth', 'me'], data);
      return data;
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    await apiLogout();
    queryClient.setQueryData(['auth', 'me'], null);
    queryClient.clear();
  }, [queryClient]);

  const data = meQuery.data as AuthResponse | null | undefined;

  const value = useMemo<AuthContextValue>(
    () => ({
      user: data?.user ?? null,
      unit: data?.unit ?? null,
      timezone: data?.timezone ?? 'UTC',
      isLoading: !bootstrapped || meQuery.isLoading,
      isAuthenticated: Boolean(data?.user),
      login,
      logout,
    }),
    [bootstrapped, data, login, logout, meQuery.isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

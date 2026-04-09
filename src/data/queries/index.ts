import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000,   // 10 min — SF data doesn't change fast
      gcTime: 30 * 60 * 1000,      // keep unused data 30 min
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

import { QueryClient } from '@tanstack/react-query';

import { getApiErrorMessage } from './client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: import.meta.env.DEV,
    },
    mutations: {
      onError: (error) => {
        console.error('[mutation]', getApiErrorMessage(error));
      },
    },
  },
});

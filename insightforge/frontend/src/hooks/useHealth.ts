import { useQuery } from '@tanstack/react-query';

import { fetchHealth } from '@/services/health/healthApi';

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
  });
}

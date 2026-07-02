import { apiClient } from '@/services/api';
import type { HealthResponse } from '@/types';

export async function fetchHealth(): Promise<HealthResponse> {
  const { data } = await apiClient.get<HealthResponse>('/health');
  return data;
}

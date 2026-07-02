import { apiClient } from '@/services/api';

import type { Dataset } from '../types';

/** Phase 2 — dataset CRUD & upload */
export async function listDatasets(): Promise<Dataset[]> {
  const { data } = await apiClient.get<Dataset[]>('/datasets');
  return data;
}

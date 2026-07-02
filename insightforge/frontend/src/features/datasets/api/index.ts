import { apiClient } from '@/services/api';
import type { Dataset, DatasetPreview, DataQualityReport, DatasetIntelligence } from '../types';

export async function listDatasets(): Promise<Dataset[]> {
  const response = await apiClient.get<Dataset[]>('/datasets');
  return response.data;
}

export async function getDataset(id: string): Promise<Dataset> {
  const response = await apiClient.get<Dataset>(`/datasets/${id}`);
  return response.data;
}

export async function uploadDataset(file: File, name?: string): Promise<Dataset> {
  const formData = new FormData();
  formData.append('file', file);
  if (name) {
    formData.append('name', name);
  }

  const response = await apiClient.post<Dataset>('/datasets/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function deleteDataset(id: string): Promise<void> {
  await apiClient.delete(`/datasets/${id}`);
}

export async function getDatasetPreview(id: string, limit = 20): Promise<DatasetPreview> {
  const response = await apiClient.get<DatasetPreview>(`/datasets/${id}/preview`, {
    params: { limit },
  });
  return response.data;
}

export async function getDatasetQuality(id: string): Promise<DataQualityReport> {
  const response = await apiClient.get<DataQualityReport>(`/datasets/${id}/quality`);
  return response.data;
}

export async function getDatasetIntelligence(id: string): Promise<DatasetIntelligence> {
  const response = await apiClient.get<DatasetIntelligence>(`/datasets/${id}/intelligence`);
  return response.data;
}

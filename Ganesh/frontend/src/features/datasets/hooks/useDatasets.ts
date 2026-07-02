import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  deleteDataset,
  getDataset,
  getDatasetPreview,
  listDatasets,
  uploadDataset,
  getDatasetQuality,
  getDatasetIntelligence,
} from '../api';

export const datasetKeys = {
  all: ['datasets'] as const,
  lists: () => [...datasetKeys.all, 'list'] as const,
  details: () => [...datasetKeys.all, 'detail'] as const,
  detail: (id: string) => [...datasetKeys.details(), id] as const,
  previews: () => [...datasetKeys.all, 'preview'] as const,
  preview: (id: string, limit: number) => [...datasetKeys.previews(), id, limit] as const,
  quality: (id: string) => [...datasetKeys.all, 'quality', id] as const,
  intelligence: (id: string) => [...datasetKeys.all, 'intelligence', id] as const,
};

export function useDatasets() {
  return useQuery({
    queryKey: datasetKeys.lists(),
    queryFn: listDatasets,
  });
}

export function useDataset(id: string) {
  return useQuery({
    queryKey: datasetKeys.detail(id),
    queryFn: () => getDataset(id),
    enabled: !!id,
  });
}

export function useUploadDataset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, name }: { file: File; name?: string }) => uploadDataset(file, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: datasetKeys.lists() });
    },
  });
}

export function useDeleteDataset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDataset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: datasetKeys.lists() });
    },
  });
}

export function useDatasetPreview(id: string, limit = 20) {
  return useQuery({
    queryKey: datasetKeys.preview(id, limit),
    queryFn: () => getDatasetPreview(id, limit),
    enabled: !!id,
  });
}

export function useDatasetQuality(id: string) {
  return useQuery({
    queryKey: datasetKeys.quality(id),
    queryFn: () => getDatasetQuality(id),
    enabled: !!id,
  });
}

export function useDatasetIntelligence(id: string) {
  return useQuery({
    queryKey: datasetKeys.intelligence(id),
    queryFn: () => getDatasetIntelligence(id),
    enabled: !!id,
  });
}

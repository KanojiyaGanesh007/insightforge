import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listConversations,
  getConversation,
  createConversation,
  deleteConversation,
  sendMessage,
  getDatasetInsights,
} from '../api';

export const assistantKeys = {
  all: ['assistant'] as const,
  lists: () => [...assistantKeys.all, 'list'] as const,
  details: () => [...assistantKeys.all, 'detail'] as const,
  detail: (id: string) => [...assistantKeys.details(), id] as const,
  insights: (datasetId: string) => [...assistantKeys.all, 'insights', datasetId] as const,
};

export function useConversations() {
  return useQuery({
    queryKey: assistantKeys.lists(),
    queryFn: listConversations,
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: assistantKeys.detail(id),
    queryFn: () => getConversation(id),
    enabled: !!id,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ datasetId, title }: { datasetId: string; title?: string }) =>
      createConversation(datasetId, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assistantKeys.lists() });
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assistantKeys.lists() });
    },
  });
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => sendMessage(conversationId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assistantKeys.detail(conversationId) });
    },
  });
}

export function useDatasetInsights(datasetId: string) {
  return useQuery({
    queryKey: assistantKeys.insights(datasetId),
    queryFn: () => getDatasetInsights(datasetId),
    enabled: !!datasetId,
  });
}

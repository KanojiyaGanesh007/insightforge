import { apiClient } from '@/services/api';
import type { Conversation, ChatMessage, InsightReport } from '../types';

export async function listConversations(): Promise<Conversation[]> {
  const response = await apiClient.get<Conversation[]>('/assistant/conversations');
  return response.data;
}

export async function getConversation(id: string): Promise<Conversation> {
  const response = await apiClient.get<Conversation>(`/assistant/conversations/${id}`);
  return response.data;
}

export async function createConversation(datasetId: string, title?: string): Promise<Conversation> {
  const response = await apiClient.post<Conversation>('/assistant/conversations', {
    dataset_id: datasetId,
    title,
  });
  return response.data;
}

export async function deleteConversation(id: string): Promise<void> {
  await apiClient.delete(`/assistant/conversations/${id}`);
}

export async function sendMessage(id: string, content: string): Promise<ChatMessage> {
  const response = await apiClient.post<ChatMessage>(`/assistant/conversations/${id}/messages`, {
    content,
  });
  return response.data;
}

export async function getDatasetInsights(datasetId: string): Promise<InsightReport> {
  const response = await apiClient.get<InsightReport>(`/datasets/${datasetId}/insights`);
  return response.data;
}

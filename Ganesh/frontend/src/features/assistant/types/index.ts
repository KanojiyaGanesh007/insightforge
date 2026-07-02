/** AI Analytics Assistant — Phase 4 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  dataset_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
}

export interface InsightReport {
  positives: string[];
  warnings: string[];
  risks: string[];
  opportunities: string[];
}

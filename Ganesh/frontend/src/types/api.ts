/** Shared API response envelopes */

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

export interface HealthResponse {
  status: string;
  app: string;
  version: string;
  environment: string;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

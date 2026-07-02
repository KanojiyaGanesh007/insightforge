export interface DatasetMetadata {
  schema_json: {
    columns: Array<{ name: string; type: string }>;
    row_count: number;
    column_count: number;
  } | null;
  profile_json: any | null;
  dataset_type: string | null;
  confidence_score: number | null;
}

export interface Dataset {
  id: string;
  name: string;
  file_name: string;
  file_format: string;
  file_size_bytes: number;
  status: string;
  created_at: string;
  updated_at: string;
  metadata?: DatasetMetadata | null;
}

export interface DatasetPreview {
  columns: string[];
  rows: Record<string, any>[];
}

export interface DataQualityReport {
  overall: {
    completeness_score: number;
    consistency_score: number;
    accuracy_score: number;
    quality_score: number;
    total_rows: number;
    duplicate_rows: number;
    duplicate_percentage: number;
    outlier_count: number;
  };
  columns: Record<string, {
    null_count: number;
    null_percentage: number;
    outlier_count: number;
    outlier_percentage: number;
    consistency_percentage: number;
  }>;
  issues: Array<{
    type: string;
    severity: 'warning' | 'info' | 'critical';
    message: string;
    column: string | null;
  }>;
}

export interface ColumnProfile {
  total_count: number;
  missing_count: number;
  missing_percentage: number;
  unique_count: number;
  unique_percentage: number;
  min?: number | null;
  max?: number | null;
  mean?: number | null;
  median?: number | null;
  std?: number | null;
  min_date?: string | null;
  max_date?: string | null;
  most_frequent_value?: string | null;
  most_frequent_count?: number;
  category_counts?: Record<string, number>;
  min_length?: number;
  max_length?: number;
  mean_length?: number;
}

export interface DatasetColumnInfo {
  name: string;
  type: string;
  profile: ColumnProfile;
}

export interface DatasetIntelligence {
  columns: DatasetColumnInfo[];
  dataset_type: string | null;
  confidence_score: number | null;
}

/** Data Quality Center types — Phase 3 */

export interface QualityScore {
  dataset_id: string;
  overall_score: number;
  completeness: number;
  uniqueness: number;
  validity: number;
}

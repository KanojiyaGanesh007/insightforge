"""Data Quality Engine — checks completeness, consistency, accuracy, duplicates, and outliers."""

import numpy as np
import pandas as pd


def calculate_data_quality(df: pd.DataFrame, schema_cols: list[dict]) -> dict:
    """Evaluate completeness, consistency, accuracy, and duplicates of a DataFrame."""
    total_rows = len(df)
    total_cols = len(df.columns)
    total_cells = total_rows * total_cols

    if total_rows == 0 or total_cols == 0:
        return {
            "overall": {
                "completeness_score": 100.0,
                "consistency_score": 100.0,
                "accuracy_score": 100.0,
                "quality_score": 100.0,
                "total_rows": total_rows,
                "total_columns": total_cols,
                "duplicate_rows": 0,
                "duplicate_percentage": 0.0,
            },
            "columns": {},
            "issues": [],
        }

    # 1. Duplicates
    duplicate_count = int(df.duplicated().sum())
    duplicate_pct = float((duplicate_count / total_rows) * 100)

    # 2. Column Metrics
    col_metrics = {}
    issues = []

    # Completeness (missing values)
    total_missing = 0
    consistency_scores = []
    accuracy_scores = []

    if duplicate_pct > 5.0:
        issues.append({
            "column": "all",
            "type": "duplicates",
            "message": f"{duplicate_count} duplicate records detected ({duplicate_pct:.1f}%).",
            "severity": "warning" if duplicate_pct < 15.0 else "risk",
        })

    for col_info in schema_cols:
        col_name = col_info["name"]
        col_type = col_info["type"]
        series = df[col_name]
        non_null_count = int(series.dropna().count())
        null_count = int(series.isna().sum())
        total_missing += null_count
        null_pct = float((null_count / total_rows) * 100)

        if null_pct > 10.0:
            issues.append({
                "column": col_name,
                "type": "missing_values",
                "message": f"Column '{col_name}' has {null_count} missing values ({null_pct:.1f}%).",
                "severity": "warning" if null_pct < 25.0 else "risk",
            })

        # Consistency check
        consistent_count = non_null_count
        if col_type == "numeric":
            # Check how many are actual numbers
            numeric_mask = pd.to_numeric(series, errors="coerce").notna()
            consistent_count = int(numeric_mask.sum())
        elif col_type == "date":
            # Check how many can be parsed as dates
            date_mask = pd.to_datetime(series, errors="coerce").notna()
            consistent_count = int(date_mask.sum())

        consistency_pct = float((consistent_count / non_null_count) * 100) if non_null_count > 0 else 100.0
        consistency_scores.append(consistency_pct)

        if consistency_pct < 90.0:
            issues.append({
                "column": col_name,
                "type": "type_inconsistency",
                "message": f"Column '{col_name}' contains inconsistent data types ({100.0 - consistency_pct:.1f}% mismatches).",
                "severity": "warning" if consistency_pct > 75.0 else "risk",
            })

        # Outliers check (Accuracy)
        outlier_count = 0
        outlier_pct = 0.0
        accuracy_pct = 100.0

        if col_type == "numeric" and non_null_count > 2:
            try:
                numeric_series = pd.to_numeric(series, errors="coerce").dropna()
                if len(numeric_series) > 2:
                    q1 = numeric_series.quantile(0.25)
                    q3 = numeric_series.quantile(0.75)
                    iqr = q3 - q1
                    lower_bound = q1 - 1.5 * iqr
                    upper_bound = q3 + 1.5 * iqr
                    outliers = numeric_series[(numeric_series < lower_bound) | (numeric_series > upper_bound)]
                    outlier_count = int(len(outliers))
                    outlier_pct = float((outlier_count / non_null_count) * 100)
                    accuracy_pct = float((1 - (outlier_count / non_null_count)) * 100)
                    accuracy_scores.append(accuracy_pct)

                    if outlier_pct > 5.0:
                        issues.append({
                            "column": col_name,
                            "type": "outliers",
                            "message": f"Column '{col_name}' has {outlier_count} statistical outliers ({outlier_pct:.1f}%).",
                            "severity": "warning",
                        })
            except Exception:
                pass
        else:
            # Non-numeric columns don't have statistical outliers by default, count as 100% accurate
            pass

        col_metrics[col_name] = {
            "null_count": null_count,
            "null_percentage": null_pct,
            "outlier_count": outlier_count,
            "outlier_percentage": outlier_pct,
            "consistency_percentage": consistency_pct,
        }

    # Summarize scores
    completeness_score = float((1 - (total_missing / total_cells)) * 100) if total_cells > 0 else 100.0
    consistency_score = float(np.mean(consistency_scores)) if consistency_scores else 100.0
    accuracy_score = float(np.mean(accuracy_scores)) if accuracy_scores else 100.0

    # Overall Quality Score
    quality_score = float((completeness_score + consistency_score + accuracy_score) / 3.0)

    # Sanitize scores to be between 0 and 100
    completeness_score = max(0.0, min(100.0, completeness_score))
    consistency_score = max(0.0, min(100.0, consistency_score))
    accuracy_score = max(0.0, min(100.0, accuracy_score))
    quality_score = max(0.0, min(100.0, quality_score))

    return {
        "overall": {
            "completeness_score": round(completeness_score, 1),
            "consistency_score": round(consistency_score, 1),
            "accuracy_score": round(accuracy_score, 1),
            "quality_score": round(quality_score, 1),
            "total_rows": total_rows,
            "total_columns": total_cols,
            "duplicate_rows": duplicate_count,
            "duplicate_percentage": round(duplicate_pct, 1),
        },
        "columns": col_metrics,
        "issues": issues,
    }

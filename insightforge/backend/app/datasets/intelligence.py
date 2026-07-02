"""Dataset Intelligence Engine — profiling and classification."""

from datetime import datetime
import numpy as np
import pandas as pd


def detect_column_type(series: pd.Series, name: str) -> str:
    """Detect the logical type of a pandas Series."""
    name_lower = name.lower()
    total_rows = len(series)
    non_null_series = series.dropna()

    if total_rows == 0:
        return "text"

    # Geographic name heuristic
    geo_keywords = ["country", "state", "city", "zip", "postal", "lat", "lon", "latitude", "longitude", "region", "address", "county", "province"]
    is_geo_name = any(k == name_lower or f"_{k}" in name_lower or f"{k}_" in name_lower for k in geo_keywords)

    # Date name heuristic
    date_keywords = ["date", "time", "timestamp"]
    is_date_name = any(k in name_lower for k in date_keywords)

    # 1. If datetime dtype
    if pd.api.types.is_datetime64_any_dtype(series):
        return "date"

    # 2. Try parsing to date (even if object/numeric)
    if is_date_name and len(non_null_series) > 0:
        try:
            sample = non_null_series.head(100)
            parsed = pd.to_datetime(sample, errors="coerce")
            if parsed.notna().sum() / len(sample) > 0.8:
                return "date"
        except Exception:
            pass

    # 3. Geographic name heuristic (prioritized over categorical/numeric/text)
    if is_geo_name:
        return "geographic"

    # 4. If numeric dtype
    if pd.api.types.is_numeric_dtype(series):
        unique_count = non_null_series.nunique()
        
        # Check if it has float/decimal values (not integer-valued floats)
        # if all values are integers (or integer-valued floats), we check categorical
        is_all_int = True
        try:
            if len(non_null_series) > 0:
                is_all_int = all(float(x).is_integer() for x in non_null_series)
            else:
                is_all_int = True
        except ValueError:
            is_all_int = False

        if is_all_int and total_rows > 0:
            ratio = unique_count / total_rows
            if total_rows <= 10:
                is_cat = unique_count <= 2
            else:
                is_cat = unique_count <= 10 or (unique_count <= 30 and ratio <= 0.15)
            
            if is_cat:
                return "categorical"

        # Year/Month could be dates
        if "year" in name_lower and len(non_null_series) > 0 and non_null_series.min() > 1900 and non_null_series.max() < 2100:
            return "date"

        return "numeric"

    # 5. If object / string
    # Check cardinality for Categorical
    unique_count = non_null_series.nunique()
    if total_rows > 0:
        ratio = unique_count / total_rows
        if total_rows <= 10:
            is_cat = unique_count <= 2 or (unique_count < total_rows)
        else:
            is_cat = unique_count <= 15 or (unique_count <= 50 and ratio <= 0.1)
        
        if is_cat:
            return "categorical"

    return "text"


def profile_column(series: pd.Series, col_type: str) -> dict:
    """Calculate statistics for a pandas Series based on its logical type."""
    total_rows = len(series)
    null_count = int(series.isna().sum())
    non_null_series = series.dropna()
    unique_count = int(non_null_series.nunique())

    profile = {
        "total_count": total_rows,
        "missing_count": null_count,
        "missing_percentage": float((null_count / total_rows) * 100) if total_rows > 0 else 0.0,
        "unique_count": unique_count,
        "unique_percentage": float((unique_count / total_rows) * 100) if total_rows > 0 else 0.0,
    }

    if total_rows == 0 or len(non_null_series) == 0:
        return profile

    if col_type == "numeric":
        profile.update({
            "min": float(non_null_series.min()),
            "max": float(non_null_series.max()),
            "mean": float(non_null_series.mean()),
            "median": float(non_null_series.median()),
            "std": float(non_null_series.std()) if len(non_null_series) > 1 else 0.0,
        })
    elif col_type == "date":
        try:
            parsed = pd.to_datetime(non_null_series, errors="coerce").dropna()
            if len(parsed) > 0:
                profile.update({
                    "min_date": parsed.min().isoformat(),
                    "max_date": parsed.max().isoformat(),
                })
        except Exception:
            pass
    elif col_type in ["categorical", "geographic"]:
        vc = non_null_series.value_counts().head(10)
        counts = {str(k): int(v) for k, v in vc.items()}
        most_freq_val = non_null_series.mode().iloc[0] if not non_null_series.empty else None
        most_freq_count = int(non_null_series.value_counts().iloc[0]) if not non_null_series.empty else 0
        profile.update({
            "most_frequent_value": str(most_freq_val) if most_freq_val is not None else None,
            "most_frequent_count": most_freq_count,
            "category_counts": counts,
        })
    elif col_type == "text":
        lengths = non_null_series.astype(str).str.len()
        profile.update({
            "min_length": int(lengths.min()),
            "max_length": int(lengths.max()),
            "mean_length": float(lengths.mean()),
        })

    # Sanitize NaN/Inf to None
    for k, v in list(profile.items()):
        if isinstance(v, float) and (np.isnan(v) or np.isinf(v)):
            profile[k] = None

    return profile


def classify_dataset_domain(columns: list[str]) -> tuple[str, float]:
    """Heuristically classify the dataset domain based on column names."""
    if not columns:
        return "general", 50.0

    cols_lower = [c.lower() for c in columns]

    keywords = {
        "sales": ["sales", "revenue", "quantity", "order", "price", "transaction", "sold", "deal", "invoice", "product", "discount", "margin", "profit"],
        "customer": ["customer", "client", "buyer", "subscriber", "churn", "retention", "age", "gender", "user", "profile", "segment", "signup", "visitor"],
        "marketing": ["campaign", "click", "impression", "lead", "ad", "ctr", "spend", "channel", "conversion", "cost", "acquisition", "roas", "funnel"],
        "financial": ["income", "expense", "profit", "loss", "balance", "cost", "revenue", "budget", "tax", "liability", "asset", "equity", "cash"],
        "geographic": ["country", "state", "city", "zip", "latitude", "longitude", "region", "address", "location", "gps", "coordinate"],
        "hr": ["employee", "salary", "department", "hire", "attrition", "performance", "tenure", "job", "wages", "manager", "staff", "onboarding"],
    }

    scores = {domain: 0 for domain in keywords}

    for col in cols_lower:
        for domain, keys in keywords.items():
            if any(k in col for k in keys):
                scores[domain] += 1

    max_domain = "general"
    max_score = 0

    for domain, score in scores.items():
        if score > max_score:
            max_score = score
            max_domain = domain

    if max_score == 0:
        return "general", 50.0

    # Calculate confidence based on matches and column count
    match_ratio = max_score / len(columns)
    confidence = min(100.0, 50.0 + (match_ratio * 100.0))
    return max_domain, float(round(confidence, 1))

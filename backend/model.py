import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import gzip
import os

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "consumption.csv.gz")

def load_data():
    """Load sampled data to fit memory limits"""
    if not os.path.exists(DATA_PATH):
        return create_sample_data()
    
    df = pd.read_csv(DATA_PATH, compression='gzip', nrows=5000, low_memory=False)
    print(f"✅ Loaded {len(df)} accounts")
    return df

def create_sample_data():
    """Fallback hardcoded data"""
    np.random.seed(42)
    data = {
        'CONS_NO': [f'ACC{i:04d}' for i in range(1, 101)],
        'FLAG': [1 if i % 10 == 0 else 0 for i in range(1, 101)],
        '1/1/2024': np.random.randint(50, 500, 100).tolist(),
        '2/1/2024': np.random.randint(50, 500, 100).tolist(),
        '3/1/2024': np.random.randint(50, 500, 100).tolist(),
    }
    df = pd.DataFrame(data)
    print(f"✅ Loaded {len(df)} accounts (fallback)")
    return df

def get_date_columns(df):
    return [c for c in df.columns if c not in ["CONS_NO", "FLAG"]]

def compute_features(df):
    date_cols = get_date_columns(df)
    features = pd.DataFrame()
    features["CONS_NO"] = df["CONS_NO"]
    features["FLAG"] = df["FLAG"].astype(int)
    features["total_consumption"] = df[date_cols].sum(axis=1).astype(float)
    features["avg_daily"] = df[date_cols].mean(axis=1).astype(float)
    features["max_daily"] = df[date_cols].max(axis=1).astype(float)
    features["min_daily"] = df[date_cols].min(axis=1).astype(float)
    features["std_consumption"] = df[date_cols].std(axis=1).astype(float)
    features["zero_days"] = (df[date_cols] == 0).sum(axis=1).astype(int)
    return features.fillna(0)

def detect_anomalies(features):
    feature_cols = ["total_consumption", "avg_daily", "max_daily", "std_consumption", "zero_days"]
    scaler = StandardScaler()
    scaled = scaler.fit_transform(features[feature_cols].astype(float))
    model = IsolationForest(contamination=0.1, random_state=42)
    preds = model.fit_predict(scaled)
    features["is_suspicious"] = (preds == -1).astype(bool)
    features["risk_level"] = features["is_suspicious"].apply(lambda x: "High" if x else "Normal")
    return features

def get_summary(features):
    total = int(len(features))
    theft = int(features["FLAG"].sum())
    suspicious = int(features["is_suspicious"].sum())
    return {
        "total_accounts": total,
        "confirmed_theft": theft,
        "model_flagged": suspicious,
        "theft_percentage": float(round((theft / total) * 100, 2)) if total > 0 else 0.0,
        "avg_daily_consumption": float(round(features["avg_daily"].mean(), 2)),
        "total_consumption_gwh": float(round(features["total_consumption"].sum() / 1_000_000, 2)),
    }

def get_flagged(features, limit=50):
    flagged = features[features["is_suspicious"] == True].copy()
    flagged = flagged.head(limit)
    cols = ["CONS_NO", "FLAG", "total_consumption", "avg_daily", "max_daily", "zero_days", "risk_level"]
    result = []
    for _, row in flagged.iterrows():
        result.append({
            "CONS_NO": str(row["CONS_NO"]),
            "FLAG": int(row["FLAG"]),
            "total_consumption": float(round(row["total_consumption"], 2)),
            "avg_daily": float(round(row["avg_daily"], 2)),
            "max_daily": float(round(row["max_daily"], 2)),
            "zero_days": int(row["zero_days"]),
            "risk_level": str(row["risk_level"])
        })
    return result

def get_monthly_trend(df):
    date_cols = get_date_columns(df)[:12]
    trend = []
    for col in date_cols:
        trend.append({
            "month": str(col),
            "avg_units": float(round(df[col].mean(), 2))
        })
    return trend

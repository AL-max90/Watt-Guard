import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import gzip
import os
import gc

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "consumption.csv.gz")

def load_data():
    """Load and optimize data to reduce memory usage"""
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"CSV file not found at {DATA_PATH}")
    
    # Read only necessary columns
    df = pd.read_csv(DATA_PATH, compression='gzip', low_memory=False)
    
    # Convert to smaller data types
    for col in df.select_dtypes(include=['float64']).columns:
        df[col] = df[col].astype('float32')
    for col in df.select_dtypes(include=['int64']).columns:
        df[col] = df[col].astype('int32')
    
    print(f"✅ Loaded {len(df)} accounts (optimized memory)")
    return df

def get_date_columns(df):
    return [c for c in df.columns if c not in ["CONS_NO", "FLAG"]]

def compute_features(df):
    date_cols = get_date_columns(df)
    features = pd.DataFrame()
    features["CONS_NO"] = df["CONS_NO"]
    features["FLAG"] = df["FLAG"]
    features["total_consumption"] = df[date_cols].sum(axis=1).astype('float32')
    features["avg_daily"] = df[date_cols].mean(axis=1).astype('float32')
    features["max_daily"] = df[date_cols].max(axis=1).astype('float32')
    features["min_daily"] = df[date_cols].min(axis=1).astype('float32')
    features["std_consumption"] = df[date_cols].std(axis=1).astype('float32')
    features["zero_days"] = (df[date_cols] == 0).sum(axis=1).astype('int16')
    features["null_days"] = df[date_cols].isnull().sum(axis=1).astype('int16')
    
    # Free up memory
    del df
    gc.collect()
    
    return features.fillna(0)

def detect_anomalies(features):
    feature_cols = ["total_consumption", "avg_daily", "max_daily",
                    "std_consumption", "zero_days"]
    scaler = StandardScaler()
    scaled = scaler.fit_transform(features[feature_cols])
    model = IsolationForest(contamination=0.1, random_state=42)
    preds = model.fit_predict(scaled)
    features = features.copy()
    features["anomaly"] = preds
    features["is_suspicious"] = features["anomaly"].apply(lambda x: True if x == -1 else False)
    features["risk_level"] = features["anomaly"].apply(lambda x: "High" if x == -1 else "Normal")
    return features

def get_summary(features):
    total = len(features)
    theft = int(features["FLAG"].sum())
    suspicious = int(features["is_suspicious"].sum())
    return {
        "total_accounts": total,
        "confirmed_theft": theft,
        "model_flagged": suspicious,
        "theft_percentage": round((theft / total) * 100, 2),
        "avg_daily_consumption": round(features["avg_daily"].mean(), 2),
        "total_consumption_gwh": round(features["total_consumption"].sum() / 1_000_000, 2),
    }

def get_flagged(features, limit=50):
    flagged = features[features["is_suspicious"] == True].copy()
    flagged = flagged.head(limit)
    cols = ["CONS_NO", "FLAG", "total_consumption", "avg_daily",
            "max_daily", "zero_days", "risk_level"]
    return flagged[cols].round(2).to_dict(orient="records")

def get_monthly_trend(df):
    date_cols = get_date_columns(df)
    monthly = {}
    for col in date_cols:
        try:
            parts = col.split("/")
            month_key = f"{parts[0]}/{parts[1]}"
            if month_key not in monthly:
                monthly[month_key] = []
            monthly[month_key].append(df[col].mean())
        except:
            continue
    trend = []
    for month, vals in monthly.items():
        trend.append({
            "month": month,
            "avg_units": round(np.nanmean(vals), 2)
        })
    return trend[-12:]

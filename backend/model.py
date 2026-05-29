import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

def load_data():
    data = {
        'CONS_NO': ['ACC001', 'ACC002', 'ACC003', 'ACC004', 'ACC005'],
        'FLAG': [0, 1, 0, 0, 1],
        '1/1/2024': [100, 500, 250, 75, 800],
        '2/1/2024': [105, 520, 255, 78, 820],
        '3/1/2024': [110, 510, 260, 80, 810],
        '4/1/2024': [108, 505, 258, 82, 805],
        '5/1/2024': [115, 495, 265, 85, 795],
        '6/1/2024': [120, 490, 270, 88, 790],
    }
    df = pd.DataFrame(data)
    print(f"Loaded {len(df)} accounts")
    return df

def get_date_columns(df):
    return [c for c in df.columns if c not in ["CONS_NO", "FLAG"]]

def compute_features(df):
    date_cols = get_date_columns(df)
    features = pd.DataFrame()
    features["CONS_NO"] = df["CONS_NO"]
    features["FLAG"] = df["FLAG"]
    features["total_consumption"] = df[date_cols].sum(axis=1)
    features["avg_daily"] = df[date_cols].mean(axis=1)
    features["max_daily"] = df[date_cols].max(axis=1)
    features["min_daily"] = df[date_cols].min(axis=1)
    features["std_consumption"] = df[date_cols].std(axis=1)
    features["zero_days"] = (df[date_cols] == 0).sum(axis=1)
    features["null_days"] = df[date_cols].isnull().sum(axis=1)
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
    features["is_suspicious"] = features["anomaly"] == -1
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

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from model import (load_data, compute_features, detect_anomalies,
                   get_summary, get_flagged, get_monthly_trend)
import os
import requests

load_dotenv()

app = Flask(__name__)
CORS(app)

# Try to initialize Groq
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
def ask_ai(prompt):
    """Use Groq for AI responses"""
    if not GROQ_API_KEY:
        return "AI not available. Please add GROQ_API_KEY to environment variables."
    
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": "mixtral-8x7b-32768",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "max_tokens": 500
    }
    
    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=data,
            timeout=30
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]
    except Exception as e:
        return f"AI Error: {str(e)}"

print("📂 Loading dataset...")
df_raw = load_data()
features = compute_features(df_raw)
features = detect_anomalies(features)
print(f"✅ Loaded {len(df_raw)} accounts")

# ===================== USER ROUTES =====================

@app.route("/api/user/tips", methods=["POST"])
def get_tips():
    data = request.json
    units = data.get("units_consumed", 0)
    appliances = data.get("appliances", [])

    prompt = f"""
You are Watt_Guard, a friendly energy advisor for Pakistani households.

The user consumes {units} units of electricity per month.
Their appliances: {', '.join(appliances) if appliances else 'not specified'}.

Provide:
1. Which appliance is likely consuming the most electricity
2. 3 specific energy saving tips relevant to Pakistan (mention solar, inverter ACs, time-of-use tips)
3. Estimated monthly savings in PKR (assume Rs. 50 per unit)

Be friendly, concise, use bullet points. Keep it under 200 words.
"""
    return jsonify({"tips": ask_ai(prompt)})

@app.route("/api/user/bill-estimate", methods=["POST"])
def bill_estimate():
    data = request.json
    units = data.get("units", 0)

    slabs = [
        (100, 16), (200, 20), (300, 30),
        (400, 40), (500, 48), (float("inf"), 62)
    ]
    bill = 0
    remaining = int(units)
    prev = 0
    for limit, rate in slabs:
        if remaining <= 0:
            break
        slab_size = (limit if limit != float("inf") else 99999) - prev
        consumed = min(remaining, slab_size)
        bill += consumed * rate
        remaining -= consumed
        prev = limit if limit != float("inf") else prev

    return jsonify({
        "units": units,
        "estimated_bill_pkr": round(bill, 2),
        "rate_used": "NEPRA 2024 slab rates"
    })

@app.route("/api/user/chat", methods=["POST"])
def user_chat():
    data = request.json
    question = data.get("question", "")
    units = data.get("units", 0)

    prompt = f"""
You are Watt_Guard energy assistant for a Pakistani household user.
Their monthly usage is approximately {units} units.
Answer this question helpfully and concisely: {question}
Focus on practical advice relevant to Pakistan (load shedding, solar, WAPDA rates).
"""
    return jsonify({"response": ask_ai(prompt)})

# ===================== ADMIN ROUTES =====================

@app.route("/api/admin/summary", methods=["GET"])
def admin_summary():
    return jsonify(get_summary(features))

@app.route("/api/admin/flagged", methods=["GET"])
def admin_flagged():
    return jsonify({"flagged_accounts": get_flagged(features)})

@app.route("/api/admin/all-accounts", methods=["GET"])
def all_accounts():
    sample = features.head(100).copy()
    cols = ["CONS_NO", "FLAG", "total_consumption",
            "avg_daily", "max_daily", "zero_days", "risk_level"]
    return jsonify({"accounts": sample[cols].round(2).to_dict(orient="records")})

@app.route("/api/admin/chat", methods=["POST"])
def admin_chat():
    data = request.json
    question = data.get("question", "")
    summary = get_summary(features)

    prompt = f"""
You are Watt_Guard's AI assistant for a utility company admin/officer.

System stats:
- Total accounts: {summary['total_accounts']}
- Confirmed theft (FLAG=1): {summary['confirmed_theft']}
- Model flagged suspicious: {summary['model_flagged']}
- Theft rate: {summary['theft_percentage']}%

Admin question: {question}

Answer professionally, give actionable recommendations.
"""
    return jsonify({"response": ask_ai(prompt)})

# ===================== CLIENT ROUTES =====================

@app.route("/api/client/overview", methods=["GET"])
def client_overview():
    summary = get_summary(features)
    trend = get_monthly_trend(df_raw)
    estimated_loss = round(summary["confirmed_theft"] * 85000, 2)

    return jsonify({
        "summary": summary,
        "monthly_trend": trend,
        "estimated_loss_pkr": estimated_loss,
        "estimated_loss_million": round(estimated_loss / 1_000_000, 2)
    })

@app.route("/api/client/theft-breakdown", methods=["GET"])
def theft_breakdown():
    confirmed = int(features["FLAG"].sum())
    model_only = int(features[
        (features["is_suspicious"] == True) & (features["FLAG"] == 0)
    ].shape[0])
    clean = int(features[
        (features["is_suspicious"] == False) & (features["FLAG"] == 0)
    ].shape[0])

    return jsonify({
        "breakdown": [
            {"label": "Confirmed Theft", "value": confirmed, "color": "#ef4444"},
            {"label": "Model Flagged", "value": model_only, "color": "#f97316"},
            {"label": "Clean Accounts", "value": clean, "color": "#22c55e"},
        ]
    })

@app.route("/api/client/chat", methods=["POST"])
def client_chat():
    data = request.json
    question = data.get("question", "")
    summary = get_summary(features)

    prompt = f"""
You are Watt_Guard's executive analytics AI for a utility company C-suite/client.

Portfolio data:
- Total accounts monitored: {summary['total_accounts']:,}
- Confirmed theft accounts: {summary['confirmed_theft']:,}
- Model flagged suspicious: {summary['model_flagged']:,}
- Overall theft rate: {summary['theft_percentage']}%
- Avg daily consumption per account: {summary['avg_daily_consumption']} units
- Estimated revenue loss: Rs. {summary['confirmed_theft'] * 85000:,}

Executive question: {question}

Respond with executive-level insights, use data points, be concise and professional.
"""
    return jsonify({"response": ask_ai(prompt)})

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)

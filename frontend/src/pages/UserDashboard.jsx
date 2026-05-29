import { useState } from "react";
import axios from "axios";
import { Zap, Lightbulb, Calculator, Loader, Send, MessageSquare } from "lucide-react";

const API = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000";
const APPLIANCES = ["AC", "Geyser", "Refrigerator", "Washing Machine", "LED Lights", "Fans", "TV", "Iron", "Microwave", "Water Pump"];

export default function UserDashboard() {
  const [units, setUnits] = useState("");
  const [selected, setSelected] = useState([]);
  const [tips, setTips] = useState("");
  const [bill, setBill] = useState(null);
  const [loadingTips, setLoadingTips] = useState(false);
  const [loadingBill, setLoadingBill] = useState(false);
  const [question, setQuestion] = useState("");
  const [chatReply, setChatReply] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const toggleAppliance = (a) =>
    setSelected((p) => p.includes(a) ? p.filter((x) => x !== a) : [...p, a]);

  const getTips = async () => {
    if (!units) return;
    setLoadingTips(true);
    try {
      const res = await axios.post(`${API}/api/user/tips`, {
        units_consumed: Number(units), appliances: selected,
      });
      setTips(res.data.tips);
    } catch { setTips("Could not connect to backend."); }
    setLoadingTips(false);
  };

  const estimateBill = async () => {
    if (!units) return;
    setLoadingBill(true);
    try {
      const res = await axios.post(`${API}/api/user/bill-estimate`, { units: Number(units) });
      setBill(res.data);
    } catch { setBill(null); }
    setLoadingBill(false);
  };

  const askChat = async () => {
    if (!question.trim()) return;
    setChatLoading(true);
    try {
      const res = await axios.post(`${API}/api/user/chat`, { question, units: Number(units) });
      setChatReply(res.data.response);
    } catch { setChatReply("Could not connect to backend."); }
    setChatLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-5">
      <div className="bg-[#1a1a24] rounded-2xl p-6 border border-[#2a2a3a]">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Zap className="text-yellow-400" /> My Energy Dashboard
        </h1>
        <p className="text-gray-400 mt-1 text-sm">Get AI-powered insights on your electricity usage</p>
      </div>

      <div className="bg-[#1a1a24] rounded-2xl p-6 border border-[#2a2a3a]">
        <label className="block text-sm text-gray-400 mb-2">Monthly Units Consumed (from your bill)</label>
        <input
          type="number" value={units} onChange={(e) => setUnits(e.target.value)}
          placeholder="e.g. 350"
          className="w-full bg-[#0f0f13] border border-[#2a2a3a] rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:border-yellow-400 transition-colors"
        />
      </div>

      <div className="bg-[#1a1a24] rounded-2xl p-6 border border-[#2a2a3a]">
        <p className="text-sm text-gray-400 mb-3">Select your appliances (optional)</p>
        <div className="flex flex-wrap gap-2">
          {APPLIANCES.map((a) => (
            <button key={a} onClick={() => toggleAppliance(a)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                selected.includes(a)
                  ? "bg-yellow-400 text-black border-yellow-400"
                  : "bg-[#0f0f13] text-gray-400 border-[#2a2a3a] hover:border-yellow-400 hover:text-white"
              }`}>
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={getTips} disabled={loadingTips || !units}
          className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all">
          {loadingTips ? <Loader size={18} className="animate-spin" /> : <Lightbulb size={18} />}
          Get AI Energy Tips
        </button>
        <button onClick={estimateBill} disabled={loadingBill || !units}
          className="bg-[#1a1a24] hover:bg-[#2a2a3a] disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl border border-[#2a2a3a] flex items-center justify-center gap-2 transition-all">
          {loadingBill ? <Loader size={18} className="animate-spin" /> : <Calculator size={18} />}
          Estimate My Bill
        </button>
      </div>

      {bill && (
        <div className="bg-[#1a1a24] rounded-2xl p-6 border border-yellow-400/30">
          <h3 className="text-yellow-400 font-bold mb-4 flex items-center gap-2">
            <Calculator size={18} /> Bill Estimate
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0f0f13] rounded-xl p-4">
              <p className="text-gray-400 text-xs">Units Consumed</p>
              <p className="text-white text-3xl font-bold mt-1">{bill.units}</p>
            </div>
            <div className="bg-[#0f0f13] rounded-xl p-4">
              <p className="text-gray-400 text-xs">Estimated Bill</p>
              <p className="text-yellow-400 text-3xl font-bold mt-1">Rs. {bill.estimated_bill_pkr?.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-gray-500 text-xs mt-3">Based on {bill.rate_used}</p>
        </div>
      )}

      {tips && (
        <div className="bg-[#1a1a24] rounded-2xl p-6 border border-yellow-400/30">
          <h3 className="text-yellow-400 font-bold mb-3 flex items-center gap-2">
            <Lightbulb size={18} /> AI Energy Advisor
          </h3>
          <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{tips}</div>
        </div>
      )}

      <div className="bg-[#1a1a24] rounded-2xl p-6 border border-[#2a2a3a]">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <MessageSquare size={16} className="text-yellow-400" /> Ask Watt_Guard
        </h3>
        <div className="flex gap-3">
          <input value={question} onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && askChat()}
            placeholder="e.g. How can I reduce my bill during summer?"
            className="flex-1 bg-[#0f0f13] border border-[#2a2a3a] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-400 transition-colors"
          />
          <button onClick={askChat} disabled={chatLoading || !question.trim()}
            className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-bold px-5 rounded-xl flex items-center gap-2 transition-all">
            {chatLoading ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
        {chatReply && (
          <div className="mt-4 bg-[#0f0f13] rounded-xl p-4 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap border border-[#2a2a3a]">
            {chatReply}
          </div>
        )}
      </div>
    </div>
  );
}
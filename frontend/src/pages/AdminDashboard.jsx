import { useEffect, useState } from "react";
import axios from "axios";
import { ShieldAlert, Users, AlertTriangle, CheckCircle, Loader, Send, MessageSquare } from "lucide-react";

const API = "http://127.0.0.1:5000";

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [flagged, setFlagged] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [question, setQuestion] = useState("");
  const [chatReply, setChatReply] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/api/admin/summary`),
      axios.get(`${API}/api/admin/flagged`),
    ]).then(([s, f]) => {
      setSummary(s.data);
      setFlagged(f.data.flagged_accounts || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const askChat = async () => {
    if (!question.trim()) return;
    setChatLoading(true);
    try {
      const res = await axios.post(`${API}/api/admin/chat`, { question });
      setChatReply(res.data.response);
    } catch { setChatReply("Could not connect."); }
    setChatLoading(false);
  };

  const filtered = flagged.filter((a) =>
    Object.values(a).some((v) => String(v).toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader className="animate-spin text-yellow-400" size={40} />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-5">
      <div className="bg-[#1a1a24] rounded-2xl p-6 border border-[#2a2a3a]">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldAlert className="text-yellow-400" /> Admin Control Panel
        </h1>
        <p className="text-gray-400 mt-1 text-sm">Electricity theft detection — 42,372 accounts monitored</p>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: "Total Accounts", value: summary.total_accounts?.toLocaleString(), icon: Users, color: "text-blue-400" },
            { label: "Confirmed Theft (FLAG=1)", value: summary.confirmed_theft?.toLocaleString(), icon: AlertTriangle, color: "text-red-400" },
            { label: "Model Flagged", value: summary.model_flagged?.toLocaleString(), icon: ShieldAlert, color: "text-orange-400" },
            { label: "Theft Rate", value: `${summary.theft_percentage}%`, icon: AlertTriangle, color: "text-yellow-400" },
            { label: "Avg Daily (units)", value: summary.avg_daily_consumption, icon: CheckCircle, color: "text-green-400" },
            { label: "Total Grid (GWh)", value: summary.total_consumption_gwh, icon: Users, color: "text-purple-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-[#1a1a24] rounded-2xl p-5 border border-[#2a2a3a]">
              <Icon size={18} className={`${color} mb-2`} />
              <p className="text-gray-400 text-xs">{label}</p>
              <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-[#1a1a24] rounded-2xl p-6 border border-[#2a2a3a]">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-white font-bold flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-400" />
            Flagged Accounts ({filtered.length})
          </h2>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by account ID..."
            className="bg-[#0f0f13] border border-[#2a2a3a] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400 transition-colors w-64"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a3a]">
                {["Account ID", "FLAG", "Total kWh", "Avg Daily", "Max Daily", "Zero Days", "Risk"].map((h) => (
                  <th key={h} className="text-left text-gray-500 py-3 px-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 20).map((acc, i) => (
                <tr key={i} className="border-b border-[#2a2a3a]/40 hover:bg-[#2a2a3a]/30 transition-colors">
                  <td className="py-3 px-3 text-gray-400 font-mono text-xs">{acc.CONS_NO?.slice(0, 12)}...</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${acc.FLAG === 1 ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
                      {acc.FLAG === 1 ? "THEFT" : "CLEAN"}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-gray-300">{acc.total_consumption?.toLocaleString()}</td>
                  <td className="py-3 px-3 text-gray-300">{acc.avg_daily}</td>
                  <td className="py-3 px-3 text-gray-300">{acc.max_daily}</td>
                  <td className="py-3 px-3 text-orange-400">{acc.zero_days}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-1 rounded text-xs font-bold bg-red-500/20 text-red-400">
                      {acc.risk_level}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-[#1a1a24] rounded-2xl p-6 border border-[#2a2a3a]">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <MessageSquare size={16} className="text-yellow-400" /> Admin AI Assistant
        </h3>
        <div className="flex gap-3">
          <input value={question} onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && askChat()}
            placeholder="e.g. What patterns indicate electricity theft?"
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
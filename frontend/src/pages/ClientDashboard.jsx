import { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";
import { TrendingUp, DollarSign, Loader, Send, MessageSquare, Zap } from "lucide-react";

const API = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000";

export default function ClientDashboard() {
  const [overview, setOverview] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState("");
  const [chatReply, setChatReply] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/api/client/overview`),
      axios.get(`${API}/api/client/theft-breakdown`),
    ]).then(([o, b]) => {
      setOverview(o.data);
      setBreakdown(b.data.breakdown || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const askChat = async () => {
    if (!question.trim()) return;
    setChatLoading(true);
    try {
      const res = await axios.post(`${API}/api/client/chat`, { question });
      setChatReply(res.data.response);
    } catch { setChatReply("Could not connect."); }
    setChatLoading(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader className="animate-spin text-yellow-400" size={40} />
    </div>
  );

  const s = overview?.summary;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-5">
      <div className="bg-[#1a1a24] rounded-2xl p-6 border border-[#2a2a3a]">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="text-yellow-400" /> Executive Analytics Dashboard
        </h1>
        <p className="text-gray-400 mt-1 text-sm">Utility company portfolio overview — real-time theft intelligence</p>
      </div>

      {s && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Accounts", value: s.total_accounts?.toLocaleString(), color: "text-blue-400" },
            { label: "Confirmed Theft", value: s.confirmed_theft?.toLocaleString(), color: "text-red-400" },
            { label: "Theft Rate", value: `${s.theft_percentage}%`, color: "text-orange-400" },
            { label: "Est. Revenue Loss", value: `Rs. ${overview.estimated_loss_million}M`, color: "text-yellow-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[#1a1a24] rounded-2xl p-5 border border-[#2a2a3a]">
              <p className="text-gray-400 text-xs mb-1">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {overview?.monthly_trend?.length > 0 && (
          <div className="bg-[#1a1a24] rounded-2xl p-6 border border-[#2a2a3a]">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Zap size={16} className="text-yellow-400" /> Monthly Avg Consumption
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={overview.monthly_trend}>
                <XAxis dataKey="month" stroke="#555" tick={{ fontSize: 10 }} />
                <YAxis stroke="#555" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "#1a1a24", border: "1px solid #2a2a3a", borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="avg_units" stroke="#facc15" strokeWidth={2} dot={{ fill: "#facc15", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {breakdown.length > 0 && (
          <div className="bg-[#1a1a24] rounded-2xl p-6 border border-[#2a2a3a]">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <DollarSign size={16} className="text-yellow-400" /> Account Status Breakdown
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={breakdown} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={80} label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {breakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#1a1a24", border: "1px solid #2a2a3a", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {overview?.monthly_trend?.length > 0 && (
        <div className="bg-[#1a1a24] rounded-2xl p-6 border border-[#2a2a3a]">
          <h3 className="text-white font-bold mb-4">📅 Consumption Trend (Bar View)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={overview.monthly_trend}>
              <XAxis dataKey="month" stroke="#555" tick={{ fontSize: 10 }} />
              <YAxis stroke="#555" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#1a1a24", border: "1px solid #2a2a3a", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="avg_units" fill="#facc15" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-[#1a1a24] rounded-2xl p-6 border border-[#2a2a3a]">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <MessageSquare size={16} className="text-yellow-400" /> Executive AI Advisor
        </h3>
        <div className="flex gap-3">
          <input value={question} onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && askChat()}
            placeholder="e.g. What is our estimated annual revenue loss from theft?"
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
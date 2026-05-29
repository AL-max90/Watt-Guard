import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ClientDashboard from "./pages/ClientDashboard";
import { Zap } from "lucide-react";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#0f0f13]">
        <nav className="bg-[#1a1a24] border-b border-[#2a2a3a] px-8 py-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-400 p-2 rounded-lg">
              <Zap size={20} className="text-black" />
            </div>
            <span className="text-xl font-bold text-white">Watt_Guard</span>
            <span className="text-xs text-gray-500 ml-1 hidden md:block">Energy Intelligence Platform</span>
          </div>
          <div className="flex gap-2">
            {[
              { to: "/", label: "👤 User" },
              { to: "/admin", label: "🛡️ Admin" },
              { to: "/client", label: "📊 Client" },
            ].map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-yellow-400 text-black"
                      : "text-gray-400 hover:text-white hover:bg-[#2a2a3a]"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<UserDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/client" element={<ClientDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}
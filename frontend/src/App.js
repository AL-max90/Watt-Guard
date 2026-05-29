import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ClientDashboard from "./pages/ClientDashboard";
import { Zap } from "lucide-react";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#0f0f13]">
        {/* Navbar */}
        <nav className="bg-[#1a1a24] border-b border-[#2a2a3a] px-8 py-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-400 p-2 rounded-lg">
              <Zap size={20} className="text-black" />
            </div>
            <span className="text-xl font-bold text-white">Watt_Guard</span>
            <span className="text-xs text-gray-500 ml-1">Energy Intelligence</span>
          </div>

          <div className="flex gap-2">
            <NavLink 
              to="/" 
              end
              className={({ isActive }) => 
                `px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive ? "bg-yellow-400 text-black" : "text-gray-400 hover:text-white hover:bg-[#2a2a3a]"
                }`
              }
            >
              User
            </NavLink>
            <NavLink 
              to="/admin" 
              className={({ isActive }) => 
                `px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive ? "bg-yellow-400 text-black" : "text-gray-400 hover:text-white hover:bg-[#2a2a3a]"
                }`
              }
            >
              Admin
            </NavLink>
            <NavLink 
              to="/client" 
              className={({ isActive }) => 
                `px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive ? "bg-yellow-400 text-black" : "text-gray-400 hover:text-white hover:bg-[#2a2a3a]"
                }`
              }
            >
              Client
            </NavLink>
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<UserDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/client" element={<ClientDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
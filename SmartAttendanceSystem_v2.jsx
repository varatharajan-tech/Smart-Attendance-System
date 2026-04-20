import { useState, useEffect, useRef } from "react";
import * as XLSX from 'xlsx';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts";
import { apiClient } from './src/api.js';

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
  * { font-family: 'Sora', system-ui, sans-serif; box-sizing: border-box; }
  @keyframes slide-in  { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes scale-in  { from { transform: scale(0.94); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  @keyframes fade-up   { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  @keyframes float     { 0%,100% { transform: translateY(0px);} 50% { transform: translateY(-12px); } }
  @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .animate-slide-in { animation: slide-in 0.32s cubic-bezier(.4,0,.2,1); }
  .animate-scale-in { animation: scale-in 0.22s cubic-bezier(.4,0,.2,1); }
  .animate-fade-up  { animation: fade-up  0.4s cubic-bezier(.4,0,.2,1) both; }
  .animate-float    { animation: float 4s ease-in-out infinite; }
  .spin-slow        { animation: spin-slow 18s linear infinite; }
  ::-webkit-scrollbar       { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: #F1F5F9; }
  ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 99px; }
  .card-hover { transition: transform 0.2s ease, box-shadow 0.2s ease; }
  .card-hover:hover { transform: translateY(-3px); box-shadow: 0 12px 32px -8px rgba(37,99,235,0.15); }
  .stat-hover { transition: transform 0.18s ease, box-shadow 0.18s ease; }
  .stat-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 24px -6px rgba(15,23,42,0.12); }
`;

// ─── DATA ────────────────────────────────────────────────────────────────────
const DEPARTMENTS = [
  { id: 1, name: "B.Tech AI & Data Science", short: "AI&DS", icon: "🤖", students: 124, attendance: 87 },
  { id: 2, name: "B.Tech Agricultural Engg.", short: "AgriE", icon: "🌾", students: 98, attendance: 79 },
  { id: 3, name: "B.E Automobile Engg.", short: "Auto", icon: "🚗", students: 112, attendance: 83 },
  { id: 4, name: "B.E Civil Engineering", short: "Civil", icon: "🏗️", students: 136, attendance: 91 },
  { id: 5, name: "B.E Computer Science", short: "CSE", icon: "💻", students: 158, attendance: 88 },
  { id: 6, name: "B.E Mechanical Engg.", short: "Mech", icon: "⚙️", students: 142, attendance: 76 },
  { id: 7, name: "B.E Mechatronics", short: "Mecha", icon: "🦾", students: 87, attendance: 82 },
  { id: 8, name: "B.E CSE (AI & ML)", short: "AIML", icon: "🧠", students: 145, attendance: 90 },
  { id: 9, name: "B.E CSE (Cyber Security)", short: "CySec", icon: "🛡️", students: 119, attendance: 85 },
];

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

const STUDENTS = [
  { id: 1, name: "Varatharajan K  ", roll: "CS001", status: "present", parent: "Raj Sharma", phone: "+91 98765 43210" },
  { id: 2, name: "Priya Nair", roll: "CS002", status: "absent", parent: "Suresh Nair", phone: "+91 87654 32109" },
  { id: 3, name: "Mohammed Ali", roll: "CS003", status: "present", parent: "Ahmed Ali", phone: "+91 76543 21098" },
  { id: 4, name: "Kavya Reddy", roll: "CS004", status: "absent", parent: "Ravi Reddy", phone: "+91 65432 10987" },
  { id: 5, name: "Vikram Singh", roll: "CS005", status: "present", parent: "Harpal Singh", phone: "+91 54321 09876" },
  { id: 6, name: "Sneha Patel", roll: "CS006", status: "present", parent: "Nilesh Patel", phone: "+91 43210 98765" },
  { id: 7, name: "Rahul Kumar", roll: "CS007", status: "absent", parent: "Sunil Kumar", phone: "+91 32109 87654" },
  { id: 8, name: "Ananya Iyer", roll: "CS008", status: "present", parent: "Venkat Iyer", phone: "+91 21098 76543" },
  { id: 9, name: "Karthik Raj", roll: "CS009", status: "present", parent: "Murugan Raj", phone: "+91 10987 65432" },
  { id: 10, name: "Deepika Menon", roll: "CS010", status: "absent", parent: "Krishnan Menon", phone: "+91 90876 54321" },
];

const ATTENDANCE_TREND = [
  { day: "Mon", present: 82, absent: 18 }, { day: "Tue", present: 88, absent: 12 },
  { day: "Wed", present: 75, absent: 25 }, { day: "Thu", present: 91, absent: 9 },
  { day: "Fri", present: 85, absent: 15 }, { day: "Sat", present: 70, absent: 30 },
];

const DEPT_ATTENDANCE = [
  { dept: "AI&DS", rate: 87 }, { dept: "CSE", rate: 88 }, { dept: "Civil", rate: 91 },
  { dept: "Mech", rate: 76 }, { dept: "Auto", rate: 83 }, { dept: "AIML", rate: 90 },
  { dept: "CySec", rate: 85 }, { dept: "Mecha", rate: 82 }, { dept: "AgriE", rate: 79 },
];

const RECENT_ALERTS = [
  { id: 1, student: "Priya Nair", dept: "CSE", type: "Absence", status: "Sent", time: "10:32 AM" },
  { id: 2, student: "Kavya Reddy", dept: "AI&DS", type: "Fee Reminder", status: "Pending", time: "10:28 AM" },
  { id: 3, student: "Rahul Kumar", dept: "Mech", type: "Absence", status: "Failed", time: "10:25 AM" },
  { id: 4, student: "Deepika Menon", dept: "Civil", type: "Exam Alert", status: "Sent", time: "10:20 AM" },
  { id: 5, student: "Mohammed Ali", dept: "AIML", type: "Absence", status: "Sent", time: "10:15 AM" },
];

// CALL STATUS — used in Reports only
const CALL_STATUS = [
  { name: "Picked", value: 58, color: "#22C55E" },
  { name: "Not Picked", value: 24, color: "#EF4444" },
  { name: "Retry", value: 18, color: "#F59E0B" },
];

// ─── UTILS ────────────────────────────────────────────────────────────────────
const cn = (...c) => c.filter(Boolean).join(" ");

// ─── TOAST ────────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = "info") => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4200);
  };
  const removeToast = id => setToasts(p => p.filter(t => t.id !== id));
  return { toasts, addToast, removeToast };
}

function ToastContainer({ toasts, removeToast }) {
  const icons = { success: "✓", error: "✕", warning: "⚠", info: "ℹ" };
  const colors = { success: "bg-emerald-500", error: "bg-red-500", warning: "bg-amber-500", info: "bg-blue-600" };
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5">
      {toasts.map(t => (
        <div key={t.id}
          className={cn("flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-white text-sm font-medium animate-slide-in min-w-[300px]", colors[t.type])}>
          <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0">{icons[t.type]}</span>
          <span className="flex-1">{t.message}</span>
          <button onClick={() => removeToast(t.id)} className="opacity-60 hover:opacity-100 text-xs ml-1">✕</button>
        </div>
      ))}
    </div>
  );
}

// ─── REUSABLE COMPONENTS ──────────────────────────────────────────────────────
function StatCard({ icon, label, value, trend, trendLabel, color, bg, accentBorder }) {
  return (
    <div className={cn(
      "bg-white rounded-2xl p-5 shadow-sm border border-slate-100 stat-hover cursor-default relative overflow-hidden",
      accentBorder && `border-l-4 ${accentBorder}`
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0", bg)}>{icon}</div>
        {trend !== undefined && (
          <span className={cn("text-xs font-bold px-2.5 py-1 rounded-xl",
            trend >= 0 ? "text-emerald-700 bg-emerald-50" : "text-red-600 bg-red-50"
          )}>
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className={cn("text-3xl font-extrabold tracking-tight", color || "text-slate-800")}>{value}</div>
      <div className="text-sm text-slate-500 mt-1 font-medium">{label}</div>
      {trendLabel && <div className="text-xs text-slate-400 mt-0.5">{trendLabel}</div>}
    </div>
  );
}

function Badge({ status }) {
  const map = {
    Sent: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    Pending: "bg-amber-50 text-amber-700 border border-amber-200",
    Failed: "bg-red-50 text-red-600 border border-red-200",
    present: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    absent: "bg-red-50 text-red-600 border border-red-200",
  };
  return (
    <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", map[status] || "bg-slate-100 text-slate-600")}>
      {status}
    </span>
  );
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-base">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)}
      className={cn("relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none shrink-0",
        checked ? "bg-blue-600" : "bg-slate-200"
      )}>
      <span className={cn("absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200",
        checked ? "translate-x-5" : "translate-x-0"
      )} />
    </button>
  );
}

function Skeleton({ className }) {
  return <div className={cn("bg-slate-100 animate-pulse rounded-xl", className)} />;
}

function Avatar({ name, size = "md", gradient = "from-blue-400 to-indigo-600" }) {
  const initials = name ? name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?";
  const sizeMap = { sm: "w-7 h-7 text-xs", md: "w-9 h-9 text-sm", lg: "w-11 h-11 text-base" };
  return (
    <div className={cn(`rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold shrink-0`, sizeMap[size])}>
      {initials}
    </div>
  );
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <h2 className="text-base font-bold text-slate-800">{title}</h2>
        {subtitle && <p className="text-slate-400 text-xs mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Admin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  useEffect(() => {
    const syncAutofill = () => {
      if (emailRef.current?.value) setEmail(emailRef.current.value);
      if (passwordRef.current?.value) setPassword(passwordRef.current.value);
    };

    syncAutofill();
    const timer = window.setTimeout(syncAutofill, 100);
    return () => window.clearTimeout(timer);
  }, []);

  const handleLogin = async () => {
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);

    const result = await apiClient.login(email, password, role);
    setLoading(false);

    if (result.success) {
      apiClient.setToken(result.data.token);
      onLogin(result.data.user);
    } else {
      setError(result.error || "Invalid credentials. Try again.");
    }
  };

  const demoFill = (r) => {
    if (r === "Admin") {
      setEmail("admin@rvs.edu");
      setPassword("admin123");
    } else {
      setEmail("teacher@rvs.edu");
      setPassword("teacher123");
    }
    setRole(r);
    setError("");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Hero Panel */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #2563EB 100%)" }}>
        {/* Decorative circles */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/5 spin-slow" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 rounded-full bg-blue-500/20" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full bg-indigo-600/20" />

        <div className="relative z-10 flex flex-col h-full p-14 justify-between">
          {/* Top logo */}
          <div className="flex items-center gap-3">
            <img src="/rvs-logo.png" alt="RVS Campus Logo" className="w-12 h-12 object-contain" />
            <div>
              <div className="text-white font-bold text-sm">RVS Technical Campus</div>
              <div className="text-blue-300 text-xs">Coimbatore</div>
            </div>
          </div>

          {/* Center content */}
          <div className="animate-fade-up">
            <div className="text-6xl mb-6 animate-float">🎓</div>
            <h1 className="text-4xl font-extrabold text-white leading-tight mb-3">
              Smart Attendance<br />& Alert System
            </h1>
            <p className="text-blue-200 text-base leading-relaxed max-w-xs">
              Automated parent notifications via Voice, SMS & WhatsApp. Real-time attendance tracking for every department.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 mt-8">
              {["📞 Voice Calls", "💬 SMS Alerts", "🟢 WhatsApp", "📊 Analytics"].map(f => (
                <span key={f} className="text-xs bg-white/10 backdrop-blur border border-white/20 text-white px-3 py-1.5 rounded-full font-medium">{f}</span>
              ))}
            </div>
          </div>

          {/* Bottom stats */}
          <div className="grid grid-cols-3 gap-4">
            {[["1,121", "Students"], ["9", "Departments"], ["293", "Alerts Today"]].map(([v, l]) => (
              <div key={l} className="bg-white/10 backdrop-blur border border-white/15 rounded-2xl p-4">
                <div className="text-2xl font-extrabold text-white">{v}</div>
                <div className="text-blue-300 text-xs mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="flex flex-col justify-center items-center w-full lg:w-[480px] bg-slate-50 px-8 py-12">
        <div className="w-full max-w-sm animate-fade-up">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <img src="/rvs-logo.png" alt="RVS Campus Logo" className="w-10 h-10 object-contain" />
            <div className="text-slate-800 font-bold">Smart Attendance System</div>
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Welcome back 👋</h2>
          <p className="text-slate-500 text-sm mb-8">Sign in to access your dashboard</p>

          {/* Role selector */}
          <div className="flex gap-2 mb-6 p-1 bg-slate-200/60 rounded-2xl">
            {["Admin", "Teacher"].map(r => (
              <button key={r} onClick={() => { setRole(r); setError(""); }}
                className={cn("flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150",
                  role === r ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}>
                {r === "Admin" ? "🔑 Admin" : "🧑‍🏫 Teacher"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleLogin(); }}>
            <div>
              <label htmlFor="login-email" className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Email</label>
              <input
                id="login-email"
                name="email"
                ref={emailRef}
                type="email"
                value={email}
                autoComplete="username"
                onChange={e => setEmail(e.target.value)}
                placeholder={role === "Admin" ? "admin@rvs.edu" : "teacher@rvs.edu"}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  ref={passwordRef}
                  type={showPw ? "text" : "password"}
                  value={password}
                  autoComplete="current-password"
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all pr-12"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm">
                  {showPw ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2.5 font-medium">
                <span>⚠</span> {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white font-semibold rounded-xl transition-all duration-150 flex items-center justify-center gap-2 shadow-sm shadow-blue-200 mt-2">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing in…</>
                : `Sign in as ${role}`}
            </button>
          </form>

          {/* Demo quick-fill */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-400 text-center mb-3">Demo credentials</p>
            <div className="flex gap-2">
              {["Admin", "Teacher"].map(r => (
                <button key={r} onClick={() => demoFill(r)}
                  className="flex-1 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl transition-colors">
                  Fill {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── COLLEGE HEADER BANNER ────────────────────────────────────────────────────
// Used only inside DashboardPage
function CollegeBanner({ user }) {
  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ minHeight: 180 }}>
      {/* Background image via CSS (unsplash campus photo) */}
      <div className="absolute inset-0"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1562774053-701939374585?w=1400&q=80')`,
          backgroundSize: "cover",
          backgroundPosition: "center 40%",
        }} />
      {/* Dark gradient overlay */}
      <div className="absolute inset-0"
        style={{ background: "linear-gradient(100deg, rgba(15,23,42,0.90) 0%, rgba(37,99,235,0.75) 60%, rgba(15,23,42,0.4) 100%)" }} />

      {/* Decorative shapes */}
      <div className="absolute top-0 right-0 w-72 h-full opacity-10">
        <div className="w-64 h-64 rounded-full bg-white absolute -top-16 -right-16" />
        <div className="w-32 h-32 rounded-full bg-blue-300 absolute bottom-0 right-8" />
      </div>

      <div className="relative z-10 p-7 flex items-center justify-between">
        {/* Left: Logo + Name */}
        <div className="flex items-center gap-5">
          {/* College Logo */}
          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-lg shrink-0 border-2 border-white/30 p-1">
            <img src="/rvs-logo.png" alt="RVS Campus Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-white font-extrabold text-xl leading-tight tracking-tight">
              RVS Technical Campus – Coimbatore
            </h1>
            <p className="text-blue-200 text-xs font-medium mt-0.5">(An Autonomous Institution)</p>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-xs bg-white/15 backdrop-blur border border-white/20 text-white px-3 py-1 rounded-full">
                📅 {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </span>
              <span className="text-xs bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-3 py-1 rounded-full font-semibold">
                ● System Online
              </span>
            </div>
          </div>
        </div>

        {/* Right: Profile */}
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-4 py-3">
          <Avatar name={user.email.split("@")[0]} gradient="from-blue-300 to-indigo-400" size="md" />
          <div>
            <div className="text-white font-semibold text-sm capitalize">{user.email.split("@")[0]}</div>
            <div className="text-blue-200 text-xs">{user.role}</div>
          </div>
          <span className="text-white/50 text-xs ml-1">▾</span>
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const ALL_NAV = [
  { id: "dashboard", label: "Dashboard", icon: "⊞", roles: ["Admin", "Teacher"] },
  { id: "attendance", label: "Mark Attendance", icon: "✓", roles: ["Admin", "Teacher"] },
  { id: "alerts", label: "Send Alerts", icon: "🔔", roles: ["Admin", "Teacher"] },
  { id: "reports", label: "Reports", icon: "📊", roles: ["Admin"] },
  { id: "parents", label: "Parent Data", icon: "👥", roles: ["Admin"] },
  { id: "settings", label: "Settings", icon: "⚙", roles: ["Admin"] },
];

function Sidebar({ active, setActive, user, onLogout }) {
  const navItems = ALL_NAV.filter(n => n.roles.includes(user.role));
  return (
    <aside className="w-60 bg-slate-900 h-screen flex flex-col fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <img src="/rvs-logo.png" alt="RVS Campus Logo" className="w-9 h-9 object-contain shrink-0" />
          <div>
            <div className="text-white font-bold text-sm leading-tight">RVS Campus</div>
            <div className="text-slate-400 text-xs">Attendance System</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(item => (
          <button key={item.id} onClick={() => setActive(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
              active === item.id
                ? "bg-blue-600 text-white shadow-sm shadow-blue-900"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}>
            <span className="text-base w-5 text-center">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Role badge */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 rounded-xl">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-slate-400 text-xs font-medium">{user.role} Access</span>
        </div>
      </div>

      {/* User + Logout */}
      <div className="p-4 pt-2 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-800 cursor-pointer group">
          <Avatar name={user.email} size="sm" gradient="from-blue-400 to-indigo-600" />
          <div className="flex-1 min-w-0">
            <div className="text-slate-200 text-xs font-semibold truncate capitalize">{user.email.split("@")[0]}</div>
            <div className="text-slate-500 text-[10px]">{user.role}</div>
          </div>
          <button onClick={onLogout}
            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 text-xs transition-all"
            title="Logout">⏏</button>
        </div>
      </div>
    </aside>
  );
}

// ─── TOPBAR ───────────────────────────────────────────────────────────────────
function Topbar({ title, subtitle, addToast, user, onLogout }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const notifs = ["47 absentees marked today", "Fee alerts queued (12)", "API: Twilio connected ✓"];
  return (
    <header className="h-15 bg-white border-b border-slate-100 flex items-center px-6 gap-4 sticky top-0 z-20" style={{ minHeight: 60 }}>
      <div className="flex-1">
        <div className="text-sm font-bold text-slate-800">{title}</div>
        {subtitle && <div className="text-xs text-slate-400 leading-none mt-0.5">{subtitle}</div>}
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-52">
        <span className="text-slate-400 text-xs">🔍</span>
        <input placeholder="Search…" className="bg-transparent text-sm text-slate-600 outline-none flex-1 placeholder-slate-400" />
      </div>

      {/* Notifications */}
      <div className="relative">
        <button onClick={() => setNotifOpen(!notifOpen)}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-50 border border-slate-200 text-slate-600 relative transition-colors">
          🔔
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold">3</span>
        </button>
        {notifOpen && (
          <div className="absolute right-0 top-11 w-72 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-scale-in">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="font-bold text-slate-800 text-sm">Notifications</span>
              <button className="text-xs text-blue-600 hover:underline" onClick={() => setNotifOpen(false)}>Clear all</button>
            </div>
            {notifs.map((n, i) => (
              <div key={i} className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <p className="text-sm text-slate-600">{n}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User + Logout */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
          <Avatar name={user.email} size="sm" />
          <span className="text-sm font-semibold text-slate-700 hidden sm:block capitalize">{user.email.split("@")[0]}</span>
          <span className="text-xs text-slate-400">({user.role})</span>
        </div>
        <button onClick={onLogout}
          className="px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 border border-red-100 rounded-xl transition-colors"
          title="Logout">
          ⏏ Logout
        </button>
      </div>
    </header>
  );
}

// ─── CUSTOM CHART TOOLTIP ─────────────────────────────────────────────────────
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-lg text-xs">
      <p className="font-bold text-slate-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <b>{p.value}{typeof p.value === "number" && p.value <= 100 ? "%" : ""}</b></p>
      ))}
    </div>
  );
}

// ─── DASHBOARD PAGE ───────────────────────────────────────────────────────────
function DashboardPage({ addToast, user }) {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const result = await apiClient.getDashboard();
      if (result.success) {
        setDashboardData(result.data);
      } else {
        addToast(`Failed to fetch dashboard: ${result.error}`, "error");
      }
      setLoading(false);
    };
    fetchData();
  }, [addToast]);

  return (
    <div className="space-y-5">
      {/* College Hero Banner */}
      <CollegeBanner user={user} />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading || !dashboardData ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32" />) : (
          <>
            <StatCard icon="👥" label="Total Students" value={dashboardData.totalStudents} trend={2.1} trendLabel="vs last semester" bg="bg-blue-50" color="text-blue-700" accentBorder="border-l-blue-500" />
            <StatCard icon="📵" label="Absentees Today" value={dashboardData.absenteesToday} trend={0} trendLabel="Live Count" bg="bg-red-50" color="text-red-600" accentBorder="border-l-red-500" />
            <StatCard icon="📨" label="Alerts Sent" value={dashboardData.alertsSent} trend={0} trendLabel="Sent by Cron" bg="bg-emerald-50" color="text-emerald-700" accentBorder="border-l-emerald-500" />
            <StatCard icon="📞" label="Pending Alerts" value={dashboardData.pendingCalls} trend={0} trendLabel="Fires at 5PM" bg="bg-amber-50" color="text-amber-600" accentBorder="border-l-amber-500" />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Attendance trend — wider */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <SectionHeader title="Attendance Overview" subtitle="Weekly presence vs absence %"
            action={
              <select className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100">
                <option>This Week</option><option>Last Week</option><option>This Month</option>
              </select>
            } />
          {loading ? <Skeleton className="h-48" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={ATTENDANCE_TREND}>
                <defs>
                  <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#64748B" }} />
                <Area type="monotone" dataKey="present" name="Present %" stroke="#2563EB" strokeWidth={2.5} fill="url(#gP)" dot={{ fill: "#2563EB", r: 3, strokeWidth: 0 }} />
                <Area type="monotone" dataKey="absent" name="Absent %" stroke="#EF4444" strokeWidth={2.5} fill="url(#gA)" dot={{ fill: "#EF4444", r: 3, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Dept bar — narrower */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <SectionHeader title="Dept-wise Attendance" subtitle="Avg. rate by department" />
          {loading ? <Skeleton className="h-48" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={DEPT_ATTENDANCE} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="dept" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis domain={[60, 100]} tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="rate" name="Rate" radius={[4, 4, 0, 0]}>
                  {DEPT_ATTENDANCE.map((d, i) => (
                    <Cell key={i} fill={d.rate >= 88 ? "#2563EB" : d.rate >= 80 ? "#60A5FA" : "#BFDBFE"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-800 text-sm">Recent Alerts</h2>
            <p className="text-slate-400 text-xs mt-0.5">Live notification feed</p>
          </div>
          <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 rounded-full font-semibold">{RECENT_ALERTS.length} today</span>
        </div>
        <div className="divide-y divide-slate-50">
          {loading ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-14 mx-5 my-2" />) :
            RECENT_ALERTS.map(a => (
              <div key={a.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/60 transition-colors cursor-default">
                <Avatar name={a.student} size="sm" gradient="from-blue-100 to-indigo-100" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800 truncate">{a.student}</p>
                    <Badge status={a.status} />
                  </div>
                  <p className="text-xs text-slate-400">{a.type} · {a.dept} · {a.time}</p>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Quick Action */}
      <button
        onClick={() => addToast("Navigating to Mark Attendance…", "info")}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md shadow-blue-200 text-sm flex items-center justify-center gap-2">
        ✓ Mark Attendance & Send Alerts →
      </button>
    </div>
  );
}

// ─── DEPARTMENT GRID ──────────────────────────────────────────────────────────
function DeptGrid({ onSelect }) {
  const [hover, setHover] = useState(null);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {DEPARTMENTS.map(d => (
        <div key={d.id}
          onMouseEnter={() => setHover(d.id)} onMouseLeave={() => setHover(null)}
          onClick={() => onSelect(d)}
          className={cn(
            "bg-white border-2 rounded-2xl p-5 cursor-pointer transition-all duration-200 card-hover",
            hover === d.id ? "border-blue-400 shadow-lg shadow-blue-100" : "border-slate-100 shadow-sm"
          )}>
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl">{d.icon}</div>
            <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">{d.short}</span>
          </div>
          <h3 className="font-bold text-slate-800 text-sm leading-tight mb-2">{d.name}</h3>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-slate-400">{d.students} students</span>
            <span className={d.attendance >= 85 ? "text-emerald-600 font-semibold" : "text-amber-600 font-semibold"}>{d.attendance}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3">
            <div className={cn("h-1.5 rounded-full transition-all", d.attendance >= 85 ? "bg-emerald-500" : "bg-amber-400")}
              style={{ width: `${d.attendance}%` }} />
          </div>
          <button className={cn("w-full py-2 rounded-xl text-xs font-bold transition-all duration-150",
            hover === d.id ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
          )}>
            Select →
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── ATTENDANCE PAGE (3-step) ─────────────────────────────────────────────────
function AttendancePage({ addToast }) {
  const [step, setStep] = useState(1);
  const [selectedDept, setDept] = useState(null);
  const [selectedYear, setYear] = useState(null);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selectedDept && selectedYear) {
      const fetchStudents = async () => {
        const result = await apiClient.getStudents(selectedDept.name, selectedYear);
        if (result.success) {
          setStudents(result.data.map(s => ({ ...s, id: s._id, status: 'present' })));
        } else {
          addToast(`Failed to fetch students: ${result.error}`, "error");
        }
      };
      fetchStudents();
    }
  }, [selectedDept, selectedYear, addToast]);

  const STEPS = ["Select Department", "Select Year", "Mark Attendance"];

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.roll.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = id => setStudents(prev => prev.map(s => s.id === id ? { ...s, status: s.status === "present" ? "absent" : "present" } : s));
  const markAll = status => setStudents(prev => prev.map(s => ({ ...s, status })));

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        date: new Date().toISOString(),
        department: selectedDept.name,
        year: selectedYear,
        records: students.map(s => ({ student: s.id, status: s.status }))
      };
      const result = await apiClient.saveAttendance(payload);
      setSaving(false);

      if (result.success) {
        addToast(`Attendance saved! ${result.data.absenteesCount} absent.`, "success");
      } else {
        addToast(`Failed to save attendance: ${result.error}`, "error");
      }
    } catch (err) {
      setSaving(false);
      addToast("Failed to save attendance", "error");
    }
  };

  const present = students.filter(s => s.status === "present").length;
  const absent = students.filter(s => s.status === "absent").length;

  return (
    <div className="space-y-5">
      {/* Breadcrumb steps */}
      <div className="flex items-center gap-2 flex-wrap">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
              step > i + 1 ? "bg-emerald-100 text-emerald-700" :
                step === i + 1 ? "bg-blue-600 text-white shadow-sm shadow-blue-300" : "bg-slate-100 text-slate-400"
            )}>
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                {step > i + 1 ? "✓" : i + 1}
              </span>
              {s}
            </div>
            {i < 2 && <span className="text-slate-300 text-sm">→</span>}
          </div>
        ))}
      </div>

      {/* Step 1 — Department */}
      {step === 1 && (
        <div>
          <div className="mb-5">
            <h2 className="text-base font-bold text-slate-800">Select Department</h2>
            <p className="text-slate-400 text-xs mt-0.5">Choose the department to mark attendance</p>
          </div>
          <DeptGrid onSelect={d => { setDept(d); setStep(2); }} />
        </div>
      )}

      {/* Step 2 — Year */}
      {step === 2 && (
        <div className="max-w-xl">
          <div className="mb-5 flex items-center gap-3">
            <button onClick={() => setStep(1)} className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1 font-medium">← Back</button>
            <div>
              <h2 className="text-base font-bold text-slate-800">Select Year</h2>
              <p className="text-slate-400 text-xs">{selectedDept?.name}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {YEARS.map((y, i) => (
              <button key={y} onClick={() => { setYear(y); setStep(3); }}
                className="bg-white border-2 border-slate-100 hover:border-blue-400 rounded-2xl p-6 text-left transition-all duration-150 card-hover group">
                <div className="text-3xl mb-3">{["🟦", "🟩", "🟧", "🟥"][i]}</div>
                <div className="font-bold text-slate-800 text-sm">{y}</div>
                <div className="text-slate-400 text-xs mt-0.5">{selectedDept?.students} students</div>
                <div className="mt-3 text-xs text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Select →</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3 — Attendance Table */}
      {step === 3 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => setStep(2)} className="text-slate-400 hover:text-slate-700 text-xs font-medium">← Back</button>
                <span className="text-slate-300">|</span>
                <h2 className="font-bold text-slate-800 text-sm">{selectedDept?.name}</h2>
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold border border-blue-100">{selectedYear}</span>
              </div>
              <p className="text-slate-400 text-xs mt-1">Mark attendance for today</p>
            </div>
            <div className="flex gap-2 bg-slate-50 rounded-xl p-1">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-emerald-700">{present} Present</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-xs font-bold text-red-600">{absent} Absent</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 flex-1 max-w-xs">
              <span className="text-slate-400 text-xs">🔍</span>
              <input placeholder="Search name or roll no…" value={search} onChange={e => setSearch(e.target.value)}
                className="bg-transparent text-sm text-slate-600 outline-none flex-1 placeholder-slate-400" />
            </div>
            <button onClick={() => markAll("present")} className="px-3 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl hover:bg-emerald-100 border border-emerald-100 transition-colors">All Present</button>
            <button onClick={() => markAll("absent")} className="px-3 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-xl hover:bg-red-100 border border-red-100 transition-colors">All Absent</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {["#", "Student", "Roll No.", "Parent Contact", "Status", "Toggle"].map(h => (
                    <th key={h} className={cn("px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide", h === "Status" || h === "Toggle" ? "text-center" : "text-left")}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((s, i) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 text-xs text-slate-400 font-mono">{i + 1}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.name} size="sm" gradient="from-blue-100 to-indigo-200" />
                        <span className="text-sm font-semibold text-slate-800">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 font-mono">{s.roll}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">{s.phone}</td>
                    <td className="px-5 py-3.5 text-center"><Badge status={s.status} /></td>
                    <td className="px-5 py-3.5 text-center"><Toggle checked={s.status === "present"} onChange={() => toggle(s.id)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">{filtered.length} students shown</p>
            <button onClick={save} disabled={saving}
              className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-70 transition-all flex items-center gap-2 shadow-sm shadow-blue-200">
              {saving
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
                : "Save & Trigger Alerts →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ALERTS PAGE ──────────────────────────────────────────────────────────────
const ALERT_TYPES = [
  { id: "absence", label: "Absence Alert", icon: "📵", color: "red", template: "Dear Parent of [Student Name], your ward [Student Name] was absent today, [Date]. Please ensure regular attendance. – RVS Admin" },
  { id: "fee", label: "Fee Reminder", icon: "💳", color: "amber", template: "Dear Parent of [Student Name], the fee for [Semester] is due on [Due Date]. Please pay at the earliest. – RVS Admin" },
  { id: "exam", label: "Exam Alert", icon: "📝", color: "blue", template: "Dear Parent of [Student Name], [Exam Name] is on [Exam Date] at [Time]. Ensure your ward is prepared. – RVS Admin" },
  { id: "result", label: "Result Update", icon: "📊", color: "emerald", template: "Dear Parent of [Student Name], results for [Exam Name] are published. Visit the portal to view. – RVS Admin" },
];

function AlertsPage({ addToast }) {
  const [type, setType] = useState(null);
  const [lang, setLang] = useState("english");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [scheduleModal, setSchedModal] = useState(false);

  const cActive = { red: "border-red-500 bg-red-500 text-white shadow-md shadow-red-200", amber: "border-amber-500 bg-amber-500 text-white shadow-md shadow-amber-200", blue: "border-blue-500 bg-blue-600 text-white shadow-md shadow-blue-200", emerald: "border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-200" };
  const cInactive = { red: "border-red-100 bg-red-50 text-red-700", amber: "border-amber-100 bg-amber-50 text-amber-700", blue: "border-blue-100 bg-blue-50 text-blue-700", emerald: "border-emerald-100 bg-emerald-50 text-emerald-700" };

  const send = async () => {
    if (!type) { addToast("Please select an alert type", "warning"); return; }
    setSending(true);
    try {
      const result = await apiClient.sendAlert("+1234567890", msg);
      setSending(false);

      if (result.success) {
        addToast(`${type.label} alert queued successfully!`, "success");
        setMsg(type.template);
      } else {
        addToast(`Failed to send alert: ${result.error}`, "error");
      }
    } catch (e) {
      setSending(false);
      addToast("Failed to send alerts", "error");
    }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <SectionHeader title="Send Alerts" subtitle="Notify parents via Voice Call, SMS & WhatsApp" />

      {/* Alert type */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">1. Select Alert Type</p>
        <div className="grid grid-cols-2 gap-3">
          {ALERT_TYPES.map(t => (
            <button key={t.id} onClick={() => { setType(t); setMsg(t.template); }}
              className={cn("flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-150 text-left",
                type?.id === t.id ? cActive[t.color] : cInactive[t.color] + " hover:opacity-80"
              )}>
              <span className="text-2xl">{t.icon}</span>
              <span className="font-bold text-sm">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">2. Select Language</p>
        <div className="flex gap-3">
          {[["english", "🇬🇧 English"], ["tamil", "🇮🇳 Tamil"]].map(([l, label]) => (
            <button key={l} onClick={() => setLang(l)}
              className={cn("px-5 py-2.5 rounded-xl border-2 text-sm font-bold transition-all",
                lang === l ? "border-blue-500 bg-blue-600 text-white shadow-sm shadow-blue-200" : "border-slate-200 text-slate-600 hover:border-blue-300"
              )}>{label}</button>
          ))}
        </div>
      </div>

      {/* Message */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">3. Message Preview</p>
          <button onClick={() => addToast("Playing voice preview…", "info")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
            🔊 Voice Preview
          </button>
        </div>
        <textarea rows={4} value={msg} onChange={e => setMsg(e.target.value)}
          placeholder="Select an alert type to auto-generate message…"
          className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 placeholder-slate-400" />
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {["[Student Name]", "[Date]", "[Department]", "[Semester]"].map(p => (
            <button key={p} onClick={() => setMsg(m => m + ` ${p}`)}
              className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-mono border border-blue-100">{p}</button>
          ))}
        </div>
      </div>

      {/* Channels */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">4. Notification Channels</p>
        <div className="grid grid-cols-3 gap-3">
          {[["📞", "Voice Call"], ["💬", "SMS"], ["🟢", "WhatsApp"]].map(([icon, label]) => (
            <div key={label} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span>{icon}</span>
              <span className="text-sm text-slate-700 font-semibold flex-1">{label}</span>
              <Toggle checked onChange={() => { }} />
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={send} disabled={sending}
          className="flex-1 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-70 transition-all flex items-center justify-center gap-2 shadow-sm shadow-blue-200">
          {sending ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending…</> : "📤 Send Now"}
        </button>
        <button onClick={() => setSchedModal(true)}
          className="px-6 py-3.5 border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:border-blue-300 hover:text-blue-700 transition-all">
          🕐 Schedule
        </button>
      </div>

      <Modal open={scheduleModal} onClose={() => setSchedModal(false)} title="Schedule Alert">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1.5">Date & Time</label>
            <input type="datetime-local" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1.5">Recurrence</label>
            <select className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
              <option>One-time</option><option>Daily</option><option>Weekly</option>
            </select>
          </div>
          <button onClick={() => { setSchedModal(false); addToast("Alert scheduled!", "success"); }}
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all">
            Confirm Schedule
          </button>
        </div>
      </Modal>
    </div>
  );
}

// ─── REPORTS PAGE (with Call Performance Analytics) ───────────────────────────
function ReportsPage({ addToast }) {
  const [dept, setDept] = useState("All");
  const [dateRange, setDateRange] = useState("This Week");

  const absentees = [
    { name: "Rahul Kumar", dept: "Mech", absences: 12, rate: "40%" },
    { name: "Priya Nair", dept: "CSE", absences: 9, rate: "30%" },
    { name: "Kavya Reddy", dept: "AI&DS", absences: 8, rate: "27%" },
    { name: "Deepika Menon", dept: "Civil", absences: 7, rate: "23%" },
    { name: "Arjun Pillai", dept: "Auto", absences: 6, rate: "20%" },
  ];

  const notifSuccess = [
    { channel: "Voice Call", sent: 293, delivered: 201, rate: 69 },
    { channel: "SMS", sent: 293, delivered: 278, rate: 95 },
    { channel: "WhatsApp", sent: 293, delivered: 267, rate: 91 },
  ];

  const totalCalls = 293;
  const picked = Math.round(totalCalls * 0.58);
  const notPicked = Math.round(totalCalls * 0.24);
  const retry = Math.round(totalCalls * 0.18);

  const RADIAN = Math.PI / 180;
  const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const r = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <SectionHeader title="Reports & Analytics" subtitle="Attendance and notification insights" />
        <button onClick={() => addToast("Report exported as PDF!", "success")}
          className="px-4 py-2.5 border-2 border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:border-blue-300 hover:text-blue-700 transition-all flex items-center gap-2">
          📥 Export PDF
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-wrap gap-3 items-center">
        {[
          { label: "Department", opts: ["All", ...DEPARTMENTS.map(d => d.short)], val: dept, set: setDept },
          { label: "Date Range", opts: ["Today", "This Week", "This Month", "Custom"], val: dateRange, set: setDateRange },
        ].map((f, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">{f.label}:</span>
            <select value={f.val} onChange={e => f.set(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white">
              {f.opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <button className="ml-auto px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors">Apply</button>
      </div>

      {/* ★ CALL PERFORMANCE ANALYTICS (moved from Dashboard) ★ */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <h3 className="font-bold text-slate-800">📞 Today's Notification Outcomes</h3>
          <p className="text-slate-400 text-xs mt-0.5">Real-time call performance analytics</p>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Pie Chart */}
          <div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={CALL_STATUS} cx="50%" cy="50%" outerRadius={100} labelLine={false} label={renderPieLabel} dataKey="value">
                  {CALL_STATUS.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={v => [`${v}%`]} />
              </PieChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div className="flex justify-center gap-4 mt-2">
              {CALL_STATUS.map(s => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                  <span className="text-xs text-slate-500 font-medium">{s.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Total Calls", value: totalCalls, icon: "📞", color: "text-slate-800", bg: "bg-slate-50", border: "border-slate-200" },
              { label: "Successful (Picked)", value: picked, icon: "✅", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-100" },
              { label: "Failed (Not Picked)", value: notPicked, icon: "❌", color: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
              { label: "Retry Queued", value: retry, icon: "🔄", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
            ].map(c => (
              <div key={c.label} className={cn("p-4 rounded-2xl border", c.bg, c.border)}>
                <div className="text-xl mb-1">{c.icon}</div>
                <div className={cn("text-2xl font-extrabold", c.color)}>{c.value}</div>
                <div className="text-xs text-slate-500 font-medium mt-0.5 leading-tight">{c.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <SectionHeader title="Attendance Trend" subtitle="Daily presence rate this week" />
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={ATTENDANCE_TREND}>
              <defs>
                <linearGradient id="rpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="present" name="Present %" stroke="#2563EB" strokeWidth={2.5} fill="url(#rpGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <SectionHeader title="Notification Success Rate" subtitle="Delivery performance by channel" />
          <div className="space-y-5 mt-2">
            {notifSuccess.map(n => (
              <div key={n.channel}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-semibold text-slate-700">{n.channel}</span>
                  <span className="text-slate-400 text-xs">{n.delivered}/{n.sent} delivered ({n.rate}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className={cn("h-2 rounded-full transition-all duration-700", n.rate >= 90 ? "bg-blue-600" : "bg-amber-500")}
                    style={{ width: `${n.rate}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Frequent absentees */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Frequent Absentees</h3>
            <p className="text-slate-400 text-xs">Students with highest absence count this month</p>
          </div>
          <span className="text-xs bg-red-50 text-red-600 border border-red-100 px-2.5 py-1 rounded-full font-bold">🔴 {absentees.length} flagged</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-50 bg-slate-50">
              {["Student", "Department", "Absences", "Rate", "Action"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide last:text-right">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {absentees.map((a, i) => (
              <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <Avatar name={a.name} size="sm" gradient="from-red-100 to-orange-100" />
                    <span className="text-sm font-semibold text-slate-800">{a.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-slate-500">{a.dept}</td>
                <td className="px-5 py-3.5 text-sm font-extrabold text-red-600">{a.absences}</td>
                <td className="px-5 py-3.5"><Badge status={parseInt(a.rate) >= 35 ? "Failed" : "Pending"} /></td>
                <td className="px-5 py-3.5 text-right">
                  <button onClick={() => addToast(`Alert sent to ${a.name}'s parent!`, "success")}
                    className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 font-bold transition-colors border border-blue-100">
                    Send Alert
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── PARENT DATA PAGE ─────────────────────────────────────────────────────────
function ParentsPage({ addToast }) {
  const [search, setSearch] = useState("");
  const [editModal, setEditModal] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [importedStudents, setImportedStudents] = useState([]);
  const [importErrors, setImportErrors] = useState("");
  const [isSavingImported, setIsSavingImported] = useState(false);
  const fileInputRef = useRef(null);

  const parents = [...STUDENTS, ...importedStudents].map(s => ({
    ...s,
    parentName: s.parent || s.parentName,
  }));
  const filtered = parents.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.parentName.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search)
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SectionHeader title="Parent Data Management" subtitle="Student and parent contact information" />
        <div className="flex gap-2">
          <input type="file" accept=".xlsx,.xls,.csv" ref={fileInputRef} onChange={async e => {
            const file = e.target.files?.[0];
            if (!file) return;
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

            if (!rows.length) {
              setImportErrors("Excel file contains no rows.");
              addToast("Excel file is empty or has no readable rows.", "error");
              e.target.value = "";
              return;
            }

            const imported = rows.map((row, index) => {
              const normalized = Object.keys(row).reduce((acc, key) => {
                acc[key.trim().toLowerCase()] = row[key];
                return acc;
              }, {});

              const name = normalized['student name'] || normalized['name'] || normalized['student'] || "";
              const roll = normalized['roll number'] || normalized['roll no.'] || normalized['roll'] || "";
              const parentName = normalized['parent name'] || normalized['parent'] || "";
              const phone = normalized['parent phone'] || normalized['contact'] || normalized['phone'] || "";
              const dept = normalized['department'] || normalized['dept'] || "B.Tech AI & Data Science";
              const year = normalized['year'] || normalized['class'] || "2nd Year";

              return {
                id: `import-${Date.now()}-${index}`,
                name: String(name).trim(),
                roll: String(roll).trim(),
                parent: String(parentName).trim(),
                parentName: String(parentName).trim(),
                phone: String(phone).trim(),
                status: "present",
                dept,
                year,
              };
            }).filter(item => item.name && item.roll && item.parent && item.phone);

            if (!imported.length) {
              setImportErrors("No valid student records found in the Excel file.");
              addToast("No valid student rows found in the Excel file.", "error");
              e.target.value = "";
              return;
            }

            setImportedStudents(imported);
            setImportErrors("");
            addToast(`${imported.length} student record(s) imported from Excel.`, "success");
            e.target.value = "";
          }} style={{ display: 'none' }} />

          <button onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 border-2 border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:border-blue-300 hover:text-blue-700 transition-all flex items-center gap-2">
            📤 Import Excel
          </button>
          <button onClick={() => { setEditStudent(null); setEditModal(true); }}
            className="px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm shadow-blue-200">
            + Add Student
          </button>
        </div>
      </div>
      {importErrors && (
        <div className="mt-3 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {importErrors}
        </div>
      )}
      {importedStudents.length > 0 && (
        <div className="mt-3 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center justify-between">
          <span>{importedStudents.length} imported student record(s) loaded from Excel. You can search or edit them below.</span>
          <button onClick={async () => {
            setIsSavingImported(true);
            let saved = 0;
            for (const student of importedStudents) {
              const result = await apiClient.createStudent({
                name: student.name,
                roll: student.roll,
                dept: student.dept,
                year: student.year,
                parent: student.parent,
                phone: student.phone,
              });
              if (result.success) saved++;
            }
            setIsSavingImported(false);
            if (saved === importedStudents.length) {
              addToast(`✅ All ${saved} students saved to database successfully!`, "success");
              setImportedStudents([]);
            } else {
              addToast(`⚠️ Saved ${saved}/${importedStudents.length} students. Some failed.`, "warning");
            }
          }} disabled={isSavingImported}
            className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center gap-2 shrink-0">
            {isSavingImported ? <>⏳ Saving...</> : <>💾 Save to Database</>}
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1 max-w-xs">
            <span className="text-slate-400 text-xs">🔍</span>
            <input placeholder="Search by name or phone…" value={search} onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-sm text-slate-600 outline-none flex-1 placeholder-slate-400" />
          </div>
          <p className="text-xs text-slate-400 ml-auto">{filtered.length} records</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Student", "Roll No.", "Parent Name", "Contact", "Status", "Actions"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide last:text-right">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={s.name} size="sm" />
                      <span className="text-sm font-semibold text-slate-800">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500 font-mono">{s.roll}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-700 font-medium">{s.parentName}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500 font-mono">{s.phone}</td>
                  <td className="px-5 py-3.5"><Badge status={s.status} /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setEditStudent(s); setEditModal(true); }}
                        className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 font-semibold transition-colors">
                        ✏️ Edit
                      </button>
                      <button onClick={() => { setEditStudent(s); setDeleteModal(true); }}
                        className="text-xs px-3 py-1.5 bg-red-50 border border-red-100 text-red-600 rounded-xl hover:bg-red-100 font-semibold transition-colors">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={editModal} onClose={() => setEditModal(false)} title={editStudent ? "Edit Student" : "Add Student"}>
        <div className="space-y-4">
          {[
            { label: "Student Name", ph: "e.g. Arjun Sharma", def: editStudent?.name },
            { label: "Roll Number", ph: "e.g. CS001", def: editStudent?.roll },
            { label: "Parent Name", ph: "e.g. Raj Sharma", def: editStudent?.parentName },
            { label: "Parent Phone", ph: "+91 98765 43210", def: editStudent?.phone },
          ].map(f => (
            <div key={f.label}>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1.5">{f.label}</label>
              <input defaultValue={f.def} placeholder={f.ph}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all" />
            </div>
          ))}
          <button onClick={() => { setEditModal(false); addToast("Student record saved!", "success"); }}
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-sm shadow-blue-200">
            Save Changes
          </button>
        </div>
      </Modal>

      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Delete Record">
        <div className="text-center">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">🗑️</div>
          <p className="text-slate-700 font-semibold">Delete <strong>{editStudent?.name}</strong>?</p>
          <p className="text-slate-400 text-sm mt-1">This action cannot be undone.</p>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setDeleteModal(false)} className="flex-1 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button onClick={() => { setDeleteModal(false); addToast("Record deleted.", "error"); }}
              className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────
function SettingsPage({ addToast, user }) {
  const [twilioKey, setTwilioKey] = useState("SK•••••••••••••••••••••••••");
  const [waKey, setWaKey] = useState("WA•••••••••••••••••••••••••");
  const [retries, setRetries] = useState(3);
  const [retryDelay, setRetryDelay] = useState(15);
  const [saving, setSaving] = useState(false);

  const save = async () => { setSaving(true); await new Promise(r => setTimeout(r, 1000)); setSaving(false); addToast("Settings saved!", "success"); };

  const sections = [
    {
      title: "Role-Based Access", icon: "🔐",
      content: (
        <div className="space-y-3">
          {[["Admin", "Full access — all modules"], ["Teacher", "Attendance & alerts only"], ["Department Head", "Reports & analytics only"]].map(([role, desc], i) => (
            <div key={role} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="text-sm font-semibold text-slate-700">{role}</p>
                <p className="text-xs text-slate-400">{desc}</p>
              </div>
              <Toggle checked={i < 2} onChange={() => { }} />
            </div>
          ))}
        </div>
      )
    },
    {
      title: "API Integrations", icon: "🔗",
      content: (
        <div className="space-y-4">
          {[["Twilio (Voice/SMS)", twilioKey, setTwilioKey], ["WhatsApp Business API", waKey, setWaKey]].map(([label, key, set]) => (
            <div key={label}>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1.5">{label}</label>
              <div className="flex gap-2">
                <input value={key} onChange={e => set(e.target.value)}
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-200" />
                <button onClick={() => addToast(`${label} connected!`, "success")}
                  className="px-4 py-2.5 bg-emerald-50 text-emerald-700 text-sm font-bold rounded-xl hover:bg-emerald-100 border border-emerald-200 transition-colors whitespace-nowrap">
                  ✓ Test
                </button>
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      title: "Retry Settings", icon: "🔄",
      content: (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-2">Max Retries</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 5].map(n => (
                <button key={n} onClick={() => setRetries(n)}
                  className={cn("w-11 h-11 rounded-xl text-sm font-black border-2 transition-all",
                    retries === n ? "border-blue-500 bg-blue-600 text-white shadow-sm shadow-blue-200" : "border-slate-200 text-slate-600 hover:border-blue-300"
                  )}>{n}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1.5">Retry Delay (minutes)</label>
            <input type="number" value={retryDelay} onChange={e => setRetryDelay(e.target.value)}
              className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 w-32" />
          </div>
        </div>
      )
    },
    {
      title: "Language Settings", icon: "🌐",
      content: (
        <div className="grid grid-cols-2 gap-3">
          {["English (Default)", "Tamil", "Hindi", "Telugu"].map((lang, i) => (
            <div key={lang} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-sm text-slate-700 font-semibold">{lang}</span>
              <Toggle checked={i < 2} onChange={() => { }} />
            </div>
          ))}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-5 max-w-2xl">
      <SectionHeader title="Settings" subtitle="System configuration and integrations" />
      {sections.map((s, i) => (
        <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <span className="text-lg">{s.icon}</span>
            <h3 className="font-bold text-slate-800 text-sm">{s.title}</h3>
          </div>
          {s.content}
        </div>
      ))}
      <button onClick={save} disabled={saving}
        className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-70 transition-all flex items-center justify-center gap-2 shadow-sm shadow-blue-200">
        {saving ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</> : "💾 Save All Settings"}
      </button>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
const PAGE_META = {
  dashboard: { title: "Dashboard", subtitle: "Smart Attendance & Alert System — RVS Campus" },
  attendance: { title: "Mark Attendance", subtitle: "Select department, year, and mark today's attendance" },
  alerts: { title: "Send Alerts", subtitle: "Notify parents via voice, SMS & WhatsApp" },
  reports: { title: "Reports & Analytics", subtitle: "Attendance insights and notification performance" },
  parents: { title: "Parent Data", subtitle: "Manage student and parent contact records" },
  settings: { title: "Settings", subtitle: "System configuration and integrations" },
};

export default function App() {
  const [user, setUser] = useState(null);   // null = logged out
  const [page, setPage] = useState("dashboard");
  const { toasts, addToast, removeToast } = useToast();

  const handleLogin = (u) => { setUser(u); addToast(`Welcome back, ${u.role}! 👋`, "success"); };
  const handleLogout = () => {
    apiClient.clearToken();
    setUser(null);
    setPage("dashboard");
    addToast("Logged out successfully.", "info");
  };

  if (!user) {
    return (
      <>
        <style>{GLOBAL_CSS}</style>
        <LoginPage onLogin={handleLogin} />
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </>
    );
  }

  const meta = PAGE_META[page];
  const pages = {
    dashboard: <DashboardPage addToast={addToast} user={user} />,
    attendance: <AttendancePage addToast={addToast} />,
    alerts: <AlertsPage addToast={addToast} />,
    reports: <ReportsPage addToast={addToast} />,
    parents: <ParentsPage addToast={addToast} />,
    settings: <SettingsPage addToast={addToast} user={user} />,
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar active={page} setActive={setPage} user={user} onLogout={handleLogout} />
        <div className="flex-1 flex flex-col ml-60 min-h-screen">
          <Topbar title={meta.title} subtitle={meta.subtitle} addToast={addToast} user={user} onLogout={handleLogout} />
          <main className="flex-1 p-6 overflow-y-auto">
            {pages[page]}
          </main>
        </div>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    </>
  );
}

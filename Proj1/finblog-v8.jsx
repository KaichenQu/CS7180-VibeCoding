import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from "recharts";

const LIGHT = {
  primary: "#6b5744", primaryH: "#7d6854", secondary: "#2c2420", accent: "#c4703f",
  pageBg: "#f5f1eb", cardBg: "#fffdf9", inputBg: "#faf8f4", reflectBg: "#faf6ee",
  text: "#2c2420", textSec: "#7a6e63", textMuted: "#b5a99a",
  border: "#e8e0d4", borderLight: "#efe8dc",
  success: "#5a7d5c", error: "#c45a4a",
  heading: "'Playfair Display', serif", body: "'DM Sans', sans-serif", journal: "'Caveat', cursive",
  sidebarBg: "#2c2420", sidebarText: "#8a7e72", sidebarTextActive: "#f0ebe3", sidebarAccentBg: "rgba(196,112,63,0.1)",
  sidebarTagline: "#7a6e63", sidebarVersion: "#5a4e44", sidebarBorder: "#3d342e",
  bannerBg: "#2c2420", bannerText: "#f0ebe3", bannerMuted: "#7a6e63",
  promptBg: "#f0ebe3", chartGrid: "#efe8dc",
  tipBg: "#2c2420", tipText: "#f0ebe3",
  toggleBg: "rgba(196,112,63,0.15)", toggleColor: "#c4703f",
};

const DARK = {
  primary: "#c4703f", primaryH: "#d4804f", secondary: "#161210", accent: "#c4703f",
  pageBg: "#1c1814", cardBg: "#262019", inputBg: "#302820", reflectBg: "#2a231b",
  text: "#e8e0d4", textSec: "#a09585", textMuted: "#6b5f54",
  border: "#3d342c", borderLight: "#332b24",
  success: "#6a9a6c", error: "#d46a5a",
  heading: "'Playfair Display', serif", body: "'DM Sans', sans-serif", journal: "'Caveat', cursive",
  sidebarBg: "#161210", sidebarText: "#6b5f54", sidebarTextActive: "#e8e0d4", sidebarAccentBg: "rgba(196,112,63,0.15)",
  sidebarTagline: "#5a4e44", sidebarVersion: "#3d342c", sidebarBorder: "#2a231b",
  bannerBg: "#161210", bannerText: "#e8e0d4", bannerMuted: "#6b5f54",
  promptBg: "#302820", chartGrid: "#332b24",
  tipBg: "#161210", tipText: "#e8e0d4",
  toggleBg: "rgba(196,112,63,0.2)", toggleColor: "#c4703f",
};

const ThemeContext = createContext(LIGHT);
function useTheme() { return useContext(ThemeContext); }
const THEME_KEY = "finblog-theme";
function loadTheme() { try { return localStorage.getItem(THEME_KEY) || "light"; } catch(e) { return "light"; } }
function saveThemePref(t) { try { localStorage.setItem(THEME_KEY, t); } catch(e) {} }

const CATEGORIES = [
  { value: "food", label: "Food", color: "#d47352" },
  { value: "transport", label: "Transport", color: "#5c8a9a" },
  { value: "shopping", label: "Shopping", color: "#7a9e82" },
  { value: "entertainment", label: "Entertainment", color: "#d4a853" },
  { value: "bills", label: "Bills", color: "#8a7e8f" },
  { value: "health", label: "Health", color: "#c47a5a" },
  { value: "education", label: "Education", color: "#5a7a8f" },
  { value: "other", label: "Other", color: "#a07a7a" },
];

const EXP_KEY = "finblog-expenses";
const REF_KEY = "finblog-reflections";
const SORT_OPTS = [{ value: "newest", label: "Newest First" }, { value: "oldest", label: "Oldest First" }, { value: "highest", label: "Highest Amount" }, { value: "lowest", label: "Lowest Amount" }];
const DATE_OPTS = [{ value: "month", label: "This Month" }, { value: "year", label: "This Year" }, { value: "all", label: "All Time" }];

function useWindowWidth() { const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200); useEffect(() => { const h = () => setW(window.innerWidth); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []); return w; }
function useBreakpoint() { const w = useWindowWidth(); return { isMobile: w < 768, isDesktop: w >= 1024 }; }
function getCategoryMeta(v) { return CATEGORIES.find((c) => c.value === v) || CATEGORIES[CATEGORIES.length - 1]; }
function formatDate(iso) { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); }
function getStartOfWeek() { const n = new Date(); const d = n.getDay(); const diff = d === 0 ? 6 : d - 1; const m = new Date(n.getFullYear(), n.getMonth(), n.getDate() - diff); m.setHours(0,0,0,0); return m; }
function getStartOfMonth() { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); }
function getStartOfYear() { return new Date(new Date().getFullYear(), 0, 1); }
function filterByDateRange(exp, range) { if (range === "all") return exp; const c = range === "year" ? getStartOfYear() : getStartOfMonth(); return exp.filter((e) => new Date(e.createdAt) >= c); }
function getCurrentMonthKey() { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}`; }
function getRecentMonths(count = 6) { const r = []; const now = new Date(); for (let i = 0; i < count; i++) { const d = new Date(now.getFullYear(), now.getMonth()-i, 1); r.push({ key: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`, label: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }), shortLabel: d.toLocaleDateString("en-US", { month: "short" }) }); } return r; }
function getTodayLocal() { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`; }
function dateToISO(ds) { const [y,m,d] = ds.split("-").map(Number); const n = new Date(); return new Date(y,m-1,d,n.getHours(),n.getMinutes(),n.getSeconds()).toISOString(); }
function isoToLocalDate(iso) { const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function isoToLocalMonthKey(iso) { const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; }
function getExpensesForMonth(exp, mk) { return exp.filter((e) => isoToLocalMonthKey(e.createdAt) === mk); }
function sortExpenses(exp, by) { const s = [...exp]; switch(by){ case "oldest": return s.sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt)); case "highest": return s.sort((a,b)=>b.amount-a.amount); case "lowest": return s.sort((a,b)=>a.amount-b.amount); default: return s.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)); } }
function loadExpenses() { try { const r = localStorage.getItem(EXP_KEY); if (r) return JSON.parse(r); } catch(e){} return []; }
function saveExpenses(e) { try { localStorage.setItem(EXP_KEY, JSON.stringify(e)); } catch(x){} }
function loadReflections() { try { const r = localStorage.getItem(REF_KEY); if (r) return JSON.parse(r); } catch(e){} return {}; }
function saveReflections(r) { try { localStorage.setItem(REF_KEY, JSON.stringify(r)); } catch(e){} }

function Hoverable({ children, hoverStyle, style, ...props }) { const [h, setH] = useState(false); return (<div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{ ...style, ...(h ? hoverStyle : {}) }} {...props}>{children}</div>); }

function useStyles() {
  const T = useTheme(); const { isMobile } = useBreakpoint();
  return {
    card: { background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 12, padding: isMobile ? "16px 18px" : "20px 22px" },
    input: { width: "100%", padding: isMobile ? "12px 14px" : "10px 14px", fontSize: 14, border: `1.5px solid ${T.border}`, borderRadius: 8, outline: "none", fontFamily: T.body, background: T.inputBg, boxSizing: "border-box", color: T.text },
    pillOff: { padding: "5px 14px", fontSize: 12, fontWeight: 500, border: `1.5px solid ${T.borderLight}`, borderRadius: 20, cursor: "pointer", fontFamily: T.body, background: T.cardBg, color: T.textSec, whiteSpace: "nowrap", flexShrink: 0 },
    pillOn: { padding: "5px 14px", fontSize: 12, fontWeight: 500, border: `1.5px solid ${T.primary}`, borderRadius: 20, cursor: "pointer", fontFamily: T.body, background: T.primary, color: "#fff", whiteSpace: "nowrap", flexShrink: 0 },
    btn: { display: "inline-block", padding: isMobile ? "12px 28px" : "10px 28px", fontSize: 14, fontWeight: 600, background: T.primary, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontFamily: T.body },
    title: { fontSize: isMobile ? 22 : 26, fontWeight: 700, marginBottom: 6, fontFamily: T.heading, letterSpacing: "-0.5px", color: T.text },
    label: { fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" },
  };
}

function SunIcon() { return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>); }
function MoonIcon() { return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>); }

function ThemeToggle({ isDark, onToggle }) { const T = useTheme(); return (<Hoverable onClick={onToggle} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 20, cursor: "pointer", background: T.toggleBg, color: T.toggleColor, fontSize: 12, fontWeight: 500, fontFamily: T.body }} hoverStyle={{ opacity: 0.8 }}>{isDark ? <SunIcon /> : <MoonIcon />}{isDark ? "Light" : "Dark"}</Hoverable>); }

function DesktopSidebar({ currentPage, onNavigate, isDark, onToggleTheme }) {
  const T = useTheme();
  const nav = [{ id: "dashboard", label: "Dashboard", icon: "◉" }, { id: "expenses", label: "Expenses", icon: "◎" }, { id: "reflection", label: "Reflection", icon: "◈" }];
  return (
    <div style={{ width: 220, minHeight: "100vh", background: T.sidebarBg, padding: "32px 0", display: "flex", flexDirection: "column", fontFamily: T.body, flexShrink: 0 }}>
      <div style={{ padding: "0 24px", marginBottom: 48 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: T.sidebarTextActive, fontFamily: T.heading }}>Fin<span style={{ color: T.accent }}>Blog</span></div>
        <div style={{ fontSize: 11, color: T.sidebarTagline, marginTop: 4, letterSpacing: "0.5px" }}>TRACK THE WHY</div>
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {nav.map((item) => { const a = currentPage === item.id; return (
          <Hoverable key={item.id} onClick={() => onNavigate(item.id)} style={{ padding: "12px 24px", fontSize: 14, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", borderLeft: a ? `3px solid ${T.accent}` : "3px solid transparent", color: a ? T.sidebarTextActive : T.sidebarText, background: a ? T.sidebarAccentBg : "transparent" }} hoverStyle={!a ? { background: "rgba(255,255,255,0.05)", color: T.textMuted } : {}}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>{item.label}
          </Hoverable>); })}
      </nav>
      <div style={{ marginTop: "auto", padding: "0 24px", display: "flex", flexDirection: "column", gap: 12 }}>
        <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
        <div style={{ fontSize: 11, color: T.sidebarVersion }}>v8.0 — Insights & Review Loop</div>
      </div>
    </div>);
}

function MobileHeader({ isDark, onToggleTheme }) { const T = useTheme(); return (<div style={{ background: T.sidebarBg, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}><div style={{ display: "flex", alignItems: "baseline", gap: 8 }}><div style={{ fontSize: 20, fontWeight: 700, color: T.sidebarTextActive, fontFamily: T.heading }}>Fin<span style={{ color: T.accent }}>Blog</span></div><div style={{ fontSize: 10, color: T.sidebarTagline, letterSpacing: "0.5px" }}>TRACK THE WHY</div></div><ThemeToggle isDark={isDark} onToggle={onToggleTheme} /></div>); }

function MobileTabBar({ currentPage, onNavigate }) { const T = useTheme(); const nav = [{ id: "dashboard", label: "Dashboard", icon: "◉" }, { id: "expenses", label: "Expenses", icon: "◎" }, { id: "reflection", label: "Reflection", icon: "◈" }]; return (<div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: T.sidebarBg, display: "flex", justifyContent: "space-around", alignItems: "center", padding: "8px 0 12px", zIndex: 100, borderTop: `1px solid ${T.sidebarBorder}` }}>{nav.map((item) => { const a = currentPage === item.id; return (<div key={item.id} onClick={() => onNavigate(item.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", padding: "4px 16px", color: a ? T.accent : T.sidebarText, fontSize: 10, fontFamily: T.body, fontWeight: a ? 600 : 400 }}><span style={{ fontSize: 20 }}>{item.icon}</span>{item.label}</div>); })}</div>); }

function ExpenseForm({ onAdd, selectedCategory }) {
  const T = useTheme(); const S = useStyles(); const { isMobile } = useBreakpoint();
  const [amount, setAmount] = useState(""); const [category, setCategory] = useState(""); const [note, setNote] = useState(""); const [date, setDate] = useState(getTodayLocal()); const [error, setError] = useState("");
  const [splitOpen, setSplitOpen] = useState(false); const [splitCount, setSplitCount] = useState(2); const [splitMode, setSplitMode] = useState("equal"); const [customShare, setCustomShare] = useState("");
  useEffect(() => { if (selectedCategory && selectedCategory !== "all") setCategory(selectedCategory); else if (selectedCategory === "all") setCategory(""); }, [selectedCategory]);
  const pa = parseFloat(amount) || 0;
  const share = (() => { if (!splitOpen || pa <= 0) return pa; if (splitMode === "custom") return parseFloat(customShare) || 0; return splitCount > 0 ? Math.round((pa / splitCount) * 100) / 100 : 0; })();
  function submit() {
    if (!pa || pa <= 0) { setError("Enter a positive amount."); return; } if (!category) { setError("Pick a category."); return; } if (!note.trim()) { setError("Add a reason — that's the whole point."); return; }
    if (splitOpen && splitMode === "custom" && (!parseFloat(customShare) || parseFloat(customShare) <= 0)) { setError("Enter your custom share amount."); return; }
    if (splitOpen && share <= 0) { setError("Your share must be positive."); return; }
    let fn = note.trim(); if (splitOpen && splitCount >= 2) fn += ` (split ${splitCount} ways)`;
    onAdd({ id: crypto.randomUUID(), amount: share, totalAmount: splitOpen && splitCount >= 2 ? pa : null, category, note: fn, createdAt: date ? dateToISO(date) : new Date().toISOString() });
    setAmount(""); setCategory(""); setNote(""); setDate(getTodayLocal()); setError(""); setSplitOpen(false); setSplitCount(2); setSplitMode("equal"); setCustomShare("");
  }
  function kd(e) { if (e.key === "Enter") { e.preventDefault(); submit(); } }
  return (
    <div style={{ marginBottom: isMobile ? 24 : 32 }}><div style={S.card}>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: isMobile ? 16 : 20, color: T.text, fontFamily: T.body }}>Log an Expense</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
        <div style={{ flex: isMobile ? "1 1 45%" : "0 0 140px" }}><label style={{ fontSize: 12, color: T.textSec, display: "block", marginBottom: 6 }}>Amount ($){splitOpen && <span style={{ color: T.textMuted, fontWeight: 400 }}> — total</span>}</label><input type="number" step="0.01" min="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} onKeyDown={kd} style={S.input} /></div>
        <div style={{ flex: isMobile ? "1 1 45%" : "0 0 150px" }}><label style={{ fontSize: 12, color: T.textSec, display: "block", marginBottom: 6 }}>Date</label><input type="date" value={date} max={getTodayLocal()} onChange={(e) => setDate(e.target.value)} onKeyDown={kd} style={S.input} /></div>
        <div style={{ flex: isMobile ? "1 1 100%" : 1 }}><label style={{ fontSize: 12, color: T.textSec, display: "block", marginBottom: 6 }}>Category</label><select value={category} onChange={(e) => setCategory(e.target.value)} onKeyDown={kd} style={{ ...S.input, color: category ? T.text : T.textMuted }}><option value="" disabled>Select category...</option>{CATEGORIES.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}</select></div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <Hoverable onClick={() => { setSplitOpen(!splitOpen); if (splitOpen) { setSplitCount(2); setSplitMode("equal"); setCustomShare(""); } }} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", fontSize: 12, fontWeight: 500, border: splitOpen ? `1.5px solid ${T.primary}` : `1.5px solid ${T.borderLight}`, borderRadius: 20, cursor: "pointer", fontFamily: T.body, background: splitOpen ? T.toggleBg : T.inputBg, color: splitOpen ? T.primary : T.textMuted }} hoverStyle={!splitOpen ? { borderColor: T.border, color: T.textSec } : {}}><span style={{ fontSize: 14 }}>{splitOpen ? "✕" : "÷"}</span>{splitOpen ? "Cancel split" : "Split bill"}</Hoverable>
        {splitOpen && (<div style={{ marginTop: 12, background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 10, padding: isMobile ? 14 : 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><label style={{ fontSize: 12, color: T.textSec, whiteSpace: "nowrap" }}>Split between</label><input type="number" min="2" max="20" value={splitCount} onChange={(e) => setSplitCount(Math.max(2, parseInt(e.target.value) || 2))} onKeyDown={kd} style={{ width: 56, padding: "7px 10px", fontSize: 14, border: `1.5px solid ${T.border}`, borderRadius: 6, outline: "none", fontFamily: T.body, background: T.cardBg, textAlign: "center", boxSizing: "border-box", color: T.text }} /><span style={{ fontSize: 12, color: T.textSec }}>people</span></div>
            <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>{["equal", "custom"].map((mode) => (<Hoverable key={mode} onClick={() => setSplitMode(mode)} style={{ padding: "5px 12px", fontSize: 11, fontWeight: 500, borderRadius: 6, cursor: "pointer", fontFamily: T.body, background: splitMode === mode ? T.primary : T.cardBg, color: splitMode === mode ? "#fff" : T.textMuted, border: splitMode === mode ? `1px solid ${T.primary}` : `1px solid ${T.border}` }} hoverStyle={splitMode !== mode ? { borderColor: T.primary + "80" } : {}}>{mode === "equal" ? "Equal" : "Custom"}</Hoverable>))}</div>
          </div>
          {splitMode === "custom" && (<div style={{ marginBottom: 12 }}><label style={{ fontSize: 12, color: T.textSec, display: "block", marginBottom: 4 }}>Your share ($)</label><input type="number" step="0.01" min="0.01" placeholder="0.00" value={customShare} onChange={(e) => setCustomShare(e.target.value)} onKeyDown={kd} style={{ ...S.input, width: isMobile ? "100%" : 160 }} /></div>)}
          {pa > 0 && (<div style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "10px 14px", background: T.cardBg, borderRadius: 8, border: `1px solid ${T.border}` }}><span style={{ fontSize: 12, color: T.textMuted }}>Your share:</span><span style={{ fontSize: 20, fontWeight: 700, color: T.primary, fontFamily: T.body }}>${share.toFixed(2)}</span>{splitMode === "equal" && <span style={{ fontSize: 11, color: T.textMuted }}>(${pa.toFixed(2)} ÷ {splitCount})</span>}</div>)}
        </div>)}
      </div>
      <div style={{ marginBottom: 16 }}><label style={{ fontSize: 12, color: T.textSec, display: "block", marginBottom: 6 }}>Why did you spend this? <span style={{ color: T.accent }}>*</span></label><input type="text" placeholder="e.g. Grabbed coffee because I was exhausted before my 8am class" value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={kd} style={S.input} /></div>
      {error && <div style={{ fontSize: 13, color: T.error, marginBottom: 12 }}>{error}</div>}
      <Hoverable onClick={submit} style={S.btn} hoverStyle={{ background: T.primaryH }}>Add Expense</Hoverable>
    </div></div>);
}

function FilterSortBar({ categoryFilter: cf, setCategoryFilter: scf, dateRange: dr, setDateRange: sdr, sortBy, setSortBy }) {
  const T = useTheme(); const S = useStyles();
  return (<div style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 12 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <button onClick={() => scf("all")} style={cf === "all" ? S.pillOn : S.pillOff}>All</button>
      {CATEGORIES.map((c) => { const on = cf === c.value; return (<button key={c.value} onClick={() => scf(c.value)} style={on ? { ...S.pillOff, background: c.color, color: "#fff", borderColor: c.color } : S.pillOff}><span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: on ? "#fff" : c.color, marginRight: 6, verticalAlign: "middle" }} />{c.label}</button>); })}
    </div>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
      <div style={{ display: "flex", gap: 6 }}>{DATE_OPTS.map((d) => (<button key={d.value} onClick={() => sdr(d.value)} style={dr === d.value ? S.pillOn : S.pillOff}>{d.label}</button>))}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontSize: 11, color: T.textMuted, fontWeight: 500 }}>Sort:</span><select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: "5px 10px", fontSize: 12, border: `1.5px solid ${T.borderLight}`, borderRadius: 6, background: T.cardBg, color: T.textSec, fontFamily: T.body, cursor: "pointer", outline: "none" }}>{SORT_OPTS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}</select></div>
    </div>
  </div>);
}

function EditForm({ expense, onSave, onCancel }) {
  const T = useTheme(); const { isMobile } = useBreakpoint();
  const sm = expense.note.match(/\(split (\d+) ways\)$/);
  const cn = sm ? expense.note.replace(/\s*\(split \d+ ways\)$/, "") : expense.note;
  const [amount, setAmount] = useState(String(expense.totalAmount || expense.amount));
  const [category, setCategory] = useState(expense.category); const [note, setNote] = useState(cn);
  const [date, setDate] = useState(isoToLocalDate(expense.createdAt)); const [error, setError] = useState("");
  const [splitOpen, setSplitOpen] = useState(!!sm); const [splitCount, setSplitCount] = useState(sm ? parseInt(sm[1]) : 2);
  const [splitMode, setSplitMode] = useState("equal"); const [customShare, setCustomShare] = useState("");
  const is = { width: "100%", padding: "9px 12px", fontSize: 13, border: `1.5px solid ${T.border}`, borderRadius: 6, outline: "none", fontFamily: T.body, background: T.cardBg, boxSizing: "border-box", color: T.text };
  const pa = parseFloat(amount) || 0;
  const share = (() => { if (!splitOpen || pa <= 0) return pa; if (splitMode === "custom") return parseFloat(customShare) || 0; return splitCount > 0 ? Math.round((pa / splitCount) * 100) / 100 : 0; })();
  function save() { if (!pa || pa <= 0) { setError("Enter a positive amount."); return; } if (!category) { setError("Pick a category."); return; } if (!note.trim()) { setError("The reason is required."); return; } if (splitOpen && splitMode === "custom" && (!parseFloat(customShare) || parseFloat(customShare) <= 0)) { setError("Enter your custom share."); return; } let fn = note.trim(); if (splitOpen && splitCount >= 2) fn += ` (split ${splitCount} ways)`; onSave({ ...expense, amount: share, totalAmount: splitOpen && splitCount >= 2 ? pa : null, category, note: fn, createdAt: date ? dateToISO(date) : expense.createdAt }); }
  function kd(e) { if (e.key === "Escape") onCancel(); if (e.key === "Enter") { e.preventDefault(); save(); } }
  return (
    <div style={{ background: T.inputBg, borderTop: `1px dashed ${T.border}`, padding: "16px 0 8px", marginTop: 12 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
        <div style={{ flex: isMobile ? "1 1 45%" : "0 0 120px" }}><label style={{ fontSize: 11, color: T.textMuted, display: "block", marginBottom: 4 }}>Amount ($){splitOpen && <span style={{ fontWeight: 400 }}> — total</span>}</label><input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} onKeyDown={kd} style={is} /></div>
        <div style={{ flex: isMobile ? "1 1 45%" : "0 0 130px" }}><label style={{ fontSize: 11, color: T.textMuted, display: "block", marginBottom: 4 }}>Date</label><input type="date" value={date} max={getTodayLocal()} onChange={(e) => setDate(e.target.value)} onKeyDown={kd} style={is} /></div>
        <div style={{ flex: isMobile ? "1 1 100%" : 1 }}><label style={{ fontSize: 11, color: T.textMuted, display: "block", marginBottom: 4 }}>Category</label><select value={category} onChange={(e) => setCategory(e.target.value)} onKeyDown={kd} style={{ ...is, color: T.text }}>{CATEGORIES.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}</select></div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <Hoverable onClick={() => { setSplitOpen(!splitOpen); if (splitOpen) { setSplitCount(2); setSplitMode("equal"); setCustomShare(""); } }} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 12px", fontSize: 11, fontWeight: 500, border: splitOpen ? `1.5px solid ${T.primary}` : `1.5px solid ${T.border}`, borderRadius: 16, cursor: "pointer", fontFamily: T.body, background: splitOpen ? T.toggleBg : T.cardBg, color: splitOpen ? T.primary : T.textMuted }} hoverStyle={!splitOpen ? { borderColor: T.primary + "80", color: T.textSec } : {}}><span style={{ fontSize: 12 }}>{splitOpen ? "✕" : "÷"}</span>{splitOpen ? "Cancel split" : "Split bill"}</Hoverable>
        {splitOpen && (<div style={{ marginTop: 10, background: T.toggleBg, border: `1px solid ${T.border}`, borderRadius: 8, padding: isMobile ? 12 : 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}><div style={{ display: "flex", alignItems: "center", gap: 6 }}><label style={{ fontSize: 11, color: T.textSec, whiteSpace: "nowrap" }}>Split between</label><input type="number" min="2" max="20" value={splitCount} onChange={(e) => setSplitCount(Math.max(2, parseInt(e.target.value) || 2))} onKeyDown={kd} style={{ width: 50, padding: "5px 8px", fontSize: 13, border: `1.5px solid ${T.border}`, borderRadius: 5, outline: "none", fontFamily: T.body, background: T.cardBg, textAlign: "center", boxSizing: "border-box", color: T.text }} /><span style={{ fontSize: 11, color: T.textSec }}>people</span></div><div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>{["equal", "custom"].map((m) => (<Hoverable key={m} onClick={() => setSplitMode(m)} style={{ padding: "4px 10px", fontSize: 10, fontWeight: 500, borderRadius: 5, cursor: "pointer", fontFamily: T.body, background: splitMode === m ? T.primary : T.cardBg, color: splitMode === m ? "#fff" : T.textMuted, border: splitMode === m ? `1px solid ${T.primary}` : `1px solid ${T.border}` }} hoverStyle={splitMode !== m ? { borderColor: T.primary + "80" } : {}}>{m === "equal" ? "Equal" : "Custom"}</Hoverable>))}</div></div>
          {splitMode === "custom" && (<div style={{ marginBottom: 10 }}><label style={{ fontSize: 11, color: T.textSec, display: "block", marginBottom: 3 }}>Your share ($)</label><input type="number" step="0.01" min="0.01" placeholder="0.00" value={customShare} onChange={(e) => setCustomShare(e.target.value)} onKeyDown={kd} style={{ ...is, width: isMobile ? "100%" : 140 }} /></div>)}
          {pa > 0 && (<div style={{ display: "flex", alignItems: "baseline", gap: 6, padding: "8px 12px", background: T.cardBg, borderRadius: 6, border: `1px solid ${T.border}` }}><span style={{ fontSize: 11, color: T.textMuted }}>Your share:</span><span style={{ fontSize: 17, fontWeight: 700, color: T.primary, fontFamily: T.body }}>${share.toFixed(2)}</span>{splitMode === "equal" && <span style={{ fontSize: 10, color: T.textMuted }}>(${pa.toFixed(2)} ÷ {splitCount})</span>}</div>)}
        </div>)}
      </div>
      <div style={{ marginBottom: 10 }}><label style={{ fontSize: 11, color: T.textMuted, display: "block", marginBottom: 4 }}>Why? <span style={{ color: T.accent }}>*</span></label><input type="text" value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={kd} style={is} /></div>
      {error && <div style={{ fontSize: 12, color: T.error, marginBottom: 8 }}>{error}</div>}
      <div style={{ display: "flex", gap: 8 }}><Hoverable onClick={save} style={{ padding: "7px 18px", fontSize: 13, fontWeight: 600, background: T.primary, color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: T.body }} hoverStyle={{ background: T.primaryH }}>Save</Hoverable><Hoverable onClick={onCancel} style={{ padding: "7px 18px", fontSize: 13, fontWeight: 500, background: "transparent", color: T.textMuted, border: `1px solid ${T.border}`, borderRadius: 6, cursor: "pointer", fontFamily: T.body }} hoverStyle={{ borderColor: T.primary + "80", color: T.textSec }}>Cancel</Hoverable></div>
    </div>);
}

function DeleteButton({ onDelete }) { const T = useTheme(); const [c, setC] = useState(false); const tr = useRef(null); useEffect(() => { if (c) { tr.current = setTimeout(() => setC(false), 3000); } return () => clearTimeout(tr.current); }, [c]); if (c) return (<button onClick={() => { clearTimeout(tr.current); onDelete(); }} onKeyDown={(e) => { if (e.key === "Enter") { clearTimeout(tr.current); onDelete(); } }} style={{ background: "none", border: `1px solid ${T.error}`, cursor: "pointer", fontSize: 11, color: T.error, padding: "2px 8px", borderRadius: 4, fontFamily: T.body, fontWeight: 600 }} tabIndex={0} autoFocus>Sure?</button>); return (<button onClick={() => setC(true)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: T.textMuted, padding: "2px 6px", borderRadius: 4, fontFamily: T.body }} tabIndex={0}>✕</button>); }

function ExpenseItem({ expense, isEditing, onEdit, onSave, onCancel, onDelete }) {
  const T = useTheme(); const { isMobile } = useBreakpoint(); const cat = getCategoryMeta(expense.category);
  return (<div style={{ padding: isMobile ? "14px 0" : "16px 0", borderBottom: `1px solid ${T.borderLight}` }}>
    <div style={{ display: "flex", alignItems: "flex-start", gap: isMobile ? 10 : 14 }}>
      <div style={{ width: 10, height: 10, borderRadius: "50%", background: cat.color, marginTop: 5, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: cat.color, background: `${cat.color}15`, padding: "2px 10px", borderRadius: 20 }}>{cat.label}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{!isEditing && (<><button onClick={onEdit} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: T.textMuted, padding: "4px 6px", borderRadius: 4, fontFamily: T.body }}>✎</button><DeleteButton onDelete={onDelete} /></>)}<span style={{ fontSize: isMobile ? 15 : 16, fontWeight: 700, color: T.text, marginLeft: 2 }}>${expense.amount.toFixed(2)}</span></div>
        </div>
        <p style={{ fontSize: isMobile ? 13 : 14, color: T.textSec, margin: "6px 0 4px", lineHeight: 1.45 }}>{expense.note}</p>
        <span style={{ fontSize: 11, color: T.textMuted }}>{formatDate(expense.createdAt)}</span>
        {expense.totalAmount && <span style={{ fontSize: 11, color: T.primary, marginLeft: 10 }}>Total: ${expense.totalAmount.toFixed(2)}</span>}
      </div>
    </div>
    {isEditing && <div style={{ marginLeft: isMobile ? 0 : 24, marginTop: isMobile ? 8 : 0 }}><EditForm expense={expense} onSave={onSave} onCancel={onCancel} /></div>}
  </div>);
}

function ExpenseList({ expenses, editingId, onEdit, onSave, onCancelEdit, onDelete, hasFilters }) {
  const T = useTheme(); const S = useStyles(); const { isMobile } = useBreakpoint();
  if (!expenses.length) return (<div style={{ textAlign: "center", padding: isMobile ? "32px 16px" : "40px 24px", color: T.textMuted, background: T.inputBg, borderRadius: 12, border: `1px dashed ${T.border}` }}><div style={{ fontSize: hasFilters ? 24 : 28, marginBottom: 10 }}>{hasFilters ? "🔍" : "📝"}</div><div style={{ fontSize: hasFilters ? 14 : 15, fontWeight: 500, color: T.textSec }}>{hasFilters ? "No expenses match these filters" : "No expenses yet"}</div><div style={{ fontSize: 13, marginTop: 6, color: T.textMuted }}>{hasFilters ? "Try changing the category or date range." : <>Start tracking your spending — and <em>why</em> you spent it.</>}</div></div>);
  return (<div style={S.card}><h3 style={{ ...S.label, margin: "4px 0 12px" }}>Recent Expenses</h3>{expenses.map((e) => (<ExpenseItem key={e.id} expense={e} isEditing={editingId === e.id} onEdit={() => onEdit(e.id)} onSave={onSave} onCancel={onCancelEdit} onDelete={() => onDelete(e.id)} />))}</div>);
}

function buildLabel(cf, dr) { const p = []; if (cf !== "all") p.push(getCategoryMeta(cf).label); if (dr !== "all") { const d = DATE_OPTS.find((x) => x.value === dr); p.push(d?.label || ""); } return p.length === 0 ? "Total Spent" : `Total · ${p.join(" · ")}`; }

function ExpensesPage({ expenses, onAdd, onDelete, onSaveEdit }) {
  const T = useTheme(); const S = useStyles(); const { isMobile } = useBreakpoint();
  const [eid, setEid] = useState(null); const [cf, setCf] = useState("all"); const [dr, setDr] = useState("month"); const [sb, setSb] = useState("newest");
  const f = (() => { let r = expenses; if (cf !== "all") r = r.filter((e) => e.category === cf); r = filterByDateRange(r, dr); return sortExpenses(r, sb); })();
  const ft = f.reduce((s, e) => s + e.amount, 0);
  return (<><h1 style={S.title}>Expenses</h1><p style={{ fontSize: 14, color: T.textSec, marginBottom: isMobile ? 20 : 32 }}>Track what you spend and why you spend it.</p>
    <div style={{ background: T.bannerBg, color: T.bannerText, borderRadius: 12, padding: isMobile ? "16px 18px" : "20px 24px", marginBottom: 20, display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}><span style={{ fontSize: 13, color: T.bannerMuted, fontWeight: 500 }}>{buildLabel(cf, dr)}</span><span style={{ fontSize: isMobile ? 24 : 28, fontWeight: 700, fontFamily: T.body, letterSpacing: "-1px" }}>${ft.toFixed(2)}</span><span style={{ fontSize: 12, color: T.bannerMuted }}>{f.length} {f.length === 1 ? "entry" : "entries"}</span></div>
    <FilterSortBar categoryFilter={cf} setCategoryFilter={setCf} dateRange={dr} setDateRange={setDr} sortBy={sb} setSortBy={setSb} />
    <ExpenseForm onAdd={onAdd} selectedCategory={cf} />
    <ExpenseList expenses={f} editingId={eid} onEdit={(id) => setEid(id)} onSave={(u) => { onSaveEdit(u); setEid(null); }} onCancelEdit={() => setEid(null)} onDelete={onDelete} hasFilters={cf !== "all" || dr !== "all"} />
  </>);
}

// ══════════════════════════════════════════════════════════════════════
// V8: INSIGHT GENERATION ENGINE
// ══════════════════════════════════════════════════════════════════════
function generateInsights(expenses, reflections, currentMonthKey) {
  const insights = [];
  const [cy, cm] = currentMonthKey.split("-").map(Number);
  const prevDate = new Date(cy, cm - 2, 1);
  const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
  const curExp = getExpensesForMonth(expenses, currentMonthKey);
  const prevExp = getExpensesForMonth(expenses, prevKey);
  const now = new Date();
  const dayOfMonth = now.getDate();

  // Helper: category totals for a set of expenses
  function catTotals(exps) {
    const t = {};
    exps.forEach((e) => { t[e.category] = (t[e.category] || 0) + e.amount; });
    return t;
  }

  const curTotals = catTotals(curExp);
  const prevTotals = catTotals(prevExp);

  // (f) REFLECTION CALLBACK — highest priority
  const prevReflection = reflections[prevKey];
  if (prevReflection && prevReflection.content) {
    const refText = prevReflection.content.toLowerCase();
    CATEGORIES.forEach((cat) => {
      if (refText.includes(cat.label.toLowerCase())) {
        const curAmt = curTotals[cat.value] || 0;
        const prevAmt = prevTotals[cat.value] || 0;
        if (prevAmt > 0 && curAmt > 0) {
          const pct = Math.round(((curAmt - prevAmt) / prevAmt) * 100);
          if (Math.abs(pct) >= 5) {
            if (curAmt < prevAmt) {
              insights.push({ id: `ref-${cat.value}`, type: "reflection", icon: "\uD83D\uDCD3", text: `Last month you reflected on ${cat.label} spending \u2014 it\u2019s down ${Math.abs(pct)}% this month. Nice work.`, sentiment: "positive", priority: 1, tag: "from your reflection" });
            } else {
              insights.push({ id: `ref-${cat.value}`, type: "reflection", icon: "\uD83D\uDCD3", text: `You mentioned ${cat.label} in last month\u2019s reflection \u2014 spending is up ${pct}% this month. Worth revisiting?`, sentiment: "caution", priority: 1, tag: "from your reflection" });
            }
          }
        }
      }
    });
  }

  // (a) MONTH-OVER-MONTH COMPARISON
  if (prevExp.length > 0) {
    CATEGORIES.forEach((cat) => {
      const cur = curTotals[cat.value] || 0;
      const prev = prevTotals[cat.value] || 0;
      if (prev > 0 && Math.abs(cur - prev) > 10) {
        const pct = Math.round(((cur - prev) / prev) * 100);
        if (Math.abs(pct) > 15) {
          // Skip if we already have a reflection callback for this category
          if (insights.some((i) => i.id === `ref-${cat.value}`)) return;
          if (cur > prev) {
            insights.push({ id: `cmp-${cat.value}`, type: "comparison", icon: "\uD83D\uDCC8", text: `You spent $${(cur - prev).toFixed(2)} more on ${cat.label} this month vs last (+${pct}%)`, sentiment: "caution", priority: 2 });
          } else {
            insights.push({ id: `cmp-${cat.value}`, type: "comparison", icon: "\uD83D\uDCC9", text: `Your ${cat.label} spending dropped by $${(prev - cur).toFixed(2)} this month vs last (${pct}%)`, sentiment: "positive", priority: 2 });
          }
        }
      }
    });
  }

  // (b) TOP CATEGORY STREAK
  const months = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(cy, cm - 1 - i, 1);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const me = getExpensesForMonth(expenses, k);
    if (!me.length) break;
    const t = catTotals(me);
    const top = Object.entries(t).sort((a, b) => b[1] - a[1])[0];
    if (top) months.push(top[0]); else break;
  }
  if (months.length >= 2) {
    let streak = 1;
    for (let i = 1; i < months.length; i++) { if (months[i] === months[0]) streak++; else break; }
    if (streak >= 2) {
      const cat = getCategoryMeta(months[0]);
      insights.push({ id: "streak", type: "streak", icon: "\uD83D\uDD25", text: `${cat.label} has been your top spending category for ${streak} consecutive months`, sentiment: "neutral", priority: 3 });
    }
  }

  // (d) SPENDING VELOCITY
  if (dayOfMonth <= 21 && curExp.length > 0) {
    const curTotal = curExp.reduce((s, e) => s + e.amount, 0);
    const daysInMonth = new Date(cy, cm, 0).getDate();
    const projected = Math.round((curTotal / dayOfMonth) * daysInMonth * 100) / 100;
    insights.push({ id: "velocity", type: "velocity", icon: "\u26A1", text: `You\u2019ve spent $${curTotal.toFixed(2)} in the first ${dayOfMonth} days \u2014 on pace for $${projected.toFixed(2)} by month end`, sentiment: "neutral", priority: 4 });
  }

  // (c) BIGGEST EXPENSE THIS MONTH
  if (curExp.length > 0) {
    const biggest = [...curExp].sort((a, b) => b.amount - a.amount)[0];
    const cat = getCategoryMeta(biggest.category);
    const noteExcerpt = biggest.note.length > 40 ? biggest.note.slice(0, 40) + "\u2026" : biggest.note;
    insights.push({ id: "biggest", type: "biggest", icon: "\uD83D\uDCB0", text: `Largest expense this month: $${biggest.amount.toFixed(2)} on ${cat.label} \u2014 \u201C${noteExcerpt}\u201D`, sentiment: "neutral", priority: 5 });
  }

  // (e) CATEGORY COUNT ALERT
  if (curExp.length > 0) {
    const counts = {};
    curExp.forEach((e) => { counts[e.category] = (counts[e.category] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (sorted.length >= 2 && sorted[0][1] - sorted[1][1] >= 3) {
      const cat = getCategoryMeta(sorted[0][0]);
      insights.push({ id: "count", type: "count", icon: "\uD83D\uDCCA", text: `You logged ${sorted[0][1]} expenses in ${cat.label} this month \u2014 more than any other category`, sentiment: "neutral", priority: 6 });
    }
  }

  // Sort by priority, cap at 4
  insights.sort((a, b) => a.priority - b.priority);
  return insights.slice(0, 4);
}

// ══════════════════════════════════════════════════════════════════════
// DASHBOARD PAGE (V8: with Insights panel)
// ══════════════════════════════════════════════════════════════════════
function DashboardPage({ expenses, reflections, onNavigate }) {
  const T = useTheme(); const S = useStyles(); const { isMobile, isDesktop } = useBreakpoint();
  const mk = getCurrentMonthKey();
  const [dashRange, setDashRange] = useState("month");

  // Filter expenses by selected range
  const filtered = filterByDateRange(expenses, dashRange);
  const filteredTotal = filtered.reduce((s,e) => s+e.amount, 0);
  const filteredCount = filtered.length;
  const rangeLabel = DATE_OPTS.find((d) => d.value === dashRange)?.label || "";

  // Top category for filtered range
  const tc = (() => { if (!filtered.length) return null; const t = {}; filtered.forEach((e) => { t[e.category]=(t[e.category]||0)+e.amount; }); const top = Object.entries(t).sort((a,b)=>b[1]-a[1])[0]; return getCategoryMeta(top[0]); })();
  // Category breakdown for filtered range (donut chart)
  const cd = (() => { const t = {}; filtered.forEach((e) => { t[e.category]=(t[e.category]||0)+e.amount; }); return Object.entries(t).map(([c,a])=>({ name: getCategoryMeta(c).label, value: Math.round(a*100)/100, color: getCategoryMeta(c).color })).sort((a,b)=>b.value-a.value); })();
  // Monthly trend always shows 6 months (independent of filter)
  const td = (() => { const m = getRecentMonths(6).reverse(); return m.map((mo) => { const me = getExpensesForMonth(expenses, mo.key); return { month: mo.shortLabel, amount: Math.round(me.reduce((s,e)=>s+e.amount,0)*100)/100 }; }); })();
  const rc = [...filtered].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,5);
  const cr = reflections[mk];
  const insights = generateInsights(expenses, reflections, mk);
  const AMBER = "#d4a853";

  const Tip = ({ active, payload, label }) => { if (active && payload && payload.length) return (<div style={{ background: T.tipBg, color: T.tipText, padding: "6px 12px", borderRadius: 6, fontSize: 12, fontFamily: T.body }}><span style={{ fontWeight: 600 }}>{label || payload[0].name}</span>: ${payload[0].value.toFixed(2)}</div>); return null; };

  function insightBorderColor(sentiment) {
    if (sentiment === "positive") return T.success;
    if (sentiment === "caution") return AMBER;
    return T.textMuted;
  }

  return (<div><h1 style={S.title}>FinBlog Overview</h1><p style={{ fontSize: 14, color: T.textSec, marginBottom: isMobile ? 12 : 16 }}>Your spending at a glance.</p>

    {/* Date range pills */}
    <div style={{ display: "flex", gap: 6, marginBottom: isMobile ? 16 : 20, flexWrap: "wrap" }}>
      {DATE_OPTS.map((d) => (<button key={d.value} onClick={() => setDashRange(d.value)} style={dashRange === d.value ? S.pillOn : S.pillOff}>{d.label}</button>))}
    </div>

    {/* Summary Cards — driven by filtered data */}
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>{[{l:"Total Spent",v:`$${filteredTotal.toFixed(2)}`,s:rangeLabel},{l:"Top Category",v:tc?tc.label:"\u2014",s:tc?"":"No data"},{l:"Expenses",v:filteredCount,s:rangeLabel},{l:"Avg / Entry",v:filteredCount > 0 ? `$${(filteredTotal/filteredCount).toFixed(2)}` : "\u2014",s:filteredCount > 0 ? "" : "No data"}].map((c,i)=>(<div key={i} style={{ flex: isMobile ? "1 1 45%" : 1, ...S.card }}><div style={{ ...S.label, marginBottom: 6 }}>{c.l}</div><div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 700, color: T.text }}>{c.v}</div>{c.s && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{c.s}</div>}</div>))}</div>

    {/* Charts */}
    {!filtered.length ? (<div style={{ ...S.card, textAlign: "center", border: `1px dashed ${T.border}`, marginBottom: 20, padding: "40px 24px" }}><div style={{ fontSize: 28, marginBottom: 10 }}>{"\uD83D\uDCCA"}</div><div style={{ fontSize: 15, fontWeight: 500, color: T.textSec }}>No expenses for this period yet</div></div>) : (
      <div style={{ display: "flex", flexDirection: isDesktop ? "row" : "column", gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, ...S.card }}><div style={{ ...S.label, marginBottom: 8 }}>By Category</div><div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "center", gap: isMobile ? 12 : 0 }}><ResponsiveContainer width={isMobile ? "100%" : "55%"} height={160}><PieChart><Pie data={cd} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={36} outerRadius={64} paddingAngle={2} strokeWidth={0}>{cd.map((e,i)=>(<Cell key={i} fill={e.color} />))}</Pie><Tooltip content={<Tip />} /></PieChart></ResponsiveContainer><div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, width: isMobile ? "100%" : "auto" }}>{cd.map((d)=>(<div key={d.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, flexShrink: 0 }} /><span style={{ color: T.textSec, flex: 1 }}>{d.name}</span><span style={{ color: T.textMuted, fontWeight: 500 }}>${d.value.toFixed(0)}</span></div>))}</div></div></div>
        <div style={{ flex: 1, ...S.card }}><div style={{ ...S.label, marginBottom: 8 }}>Monthly Trend</div><ResponsiveContainer width="100%" height={160}><LineChart data={td} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}><CartesianGrid strokeDasharray="3 3" stroke={T.chartGrid} /><XAxis dataKey="month" tick={{ fontSize: 11, fill: T.textMuted }} axisLine={{ stroke: T.border }} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: T.textMuted }} axisLine={false} tickLine={false} tickFormatter={(v)=>`$${v}`} /><Tooltip content={<Tip />} /><Line type="monotone" dataKey="amount" stroke={T.accent} strokeWidth={2.5} dot={{ r: 4, fill: T.accent, strokeWidth: 0 }} activeDot={{ r: 6, fill: T.accent }} /></LineChart></ResponsiveContainer></div>
      </div>)}

    {/* V8: Insights + Reflection Snippet — side by side on desktop */}
    <div style={{ display: "flex", flexDirection: isDesktop ? "row" : "column", gap: 12, marginBottom: 20 }}>
      {/* Insights Panel */}
      <div style={{ flex: 3, ...S.card }}>
        <div style={{ ...S.label, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <span>{"\u2728"}</span> Insights
        </div>
        {insights.length === 0 ? (
          <div style={{ fontSize: 13, color: T.textMuted, padding: "12px 0", lineHeight: 1.5 }}>
            Keep logging expenses {"\u2014"} insights will appear as your spending history grows.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {insights.map((ins) => (
              <div key={ins.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", background: T.inputBg, borderRadius: 8, borderLeft: `3px solid ${insightBorderColor(ins.sentiment)}` }}>
                <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{ins.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: T.textSec, lineHeight: 1.5 }}>{ins.text}</div>
                  {ins.tag && (
                    <div style={{ fontSize: 10, color: T.textMuted, fontStyle: "italic", marginTop: 4 }}>{ins.tag}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reflection Snippet */}
      <div style={{ flex: 2, ...S.card, display: "flex", flexDirection: "column" }}>
        <div style={{ ...S.label, marginBottom: 10 }}>This Month's Reflection</div>
        {cr && cr.content ? (
          <><p style={{ fontSize: 13, color: T.textSec, lineHeight: 1.6, flex: 1, margin: 0 }}>{cr.content.length > 120 ? cr.content.slice(0,120)+"..." : cr.content}</p>
          <Hoverable onClick={() => onNavigate("reflection")} style={{ fontSize: 12, color: T.accent, cursor: "pointer", fontWeight: 500, marginTop: 10 }} hoverStyle={{ textDecoration: "underline" }}>Read more {"\u2192"}</Hoverable></>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <p style={{ fontSize: 13, color: T.textMuted, margin: "0 0 10px", lineHeight: 1.5 }}>You haven't reflected on this month's spending yet.</p>
            <Hoverable onClick={() => onNavigate("reflection")} style={{ fontSize: 12, color: T.accent, cursor: "pointer", fontWeight: 500 }} hoverStyle={{ textDecoration: "underline" }}>Start reflecting {"\u2192"}</Hoverable>
          </div>
        )}
      </div>
    </div>

    {/* Recent Expenses — full width */}
    <div style={S.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={S.label}>Recent Expenses</div>
        {filtered.length > 0 && (<Hoverable onClick={() => onNavigate("expenses")} style={{ fontSize: 12, color: T.accent, cursor: "pointer", fontWeight: 500 }} hoverStyle={{ textDecoration: "underline" }}>View All {"\u2192"}</Hoverable>)}
      </div>
      {!rc.length ? <div style={{ fontSize: 13, color: T.textMuted, padding: "12px 0" }}>No expenses logged yet.</div> : rc.map((e) => {
        const c = getCategoryMeta(e.category);
        return (<div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${T.borderLight}`, flexWrap: isMobile ? "wrap" : "nowrap" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: c.color, background: `${c.color}15`, padding: "1px 8px", borderRadius: 10, flexShrink: 0 }}>{c.label}</span>
          <span style={{ fontSize: 12, color: T.textSec, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{e.note}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.text, flexShrink: 0 }}>${e.amount.toFixed(2)}</span>
        </div>);
      })}
    </div>
  </div>);
}

const REFLECTION_PROMPTS = [
  { q: "What was your biggest unnecessary expense this month?", starter: "The one purchase I probably didn't need was " },
  { q: "Did any spending surprise you when you look back?", starter: "Looking back, I was surprised to see that " },
  { q: "What's one habit you'd like to change next month?", starter: "Next month, I want to try to " },
  { q: "Was there a purchase you're genuinely glad you made?", starter: "One thing I'm really glad I spent money on was " },
  { q: "If you could redo one purchase this month, which would it be?", starter: "If I could go back, I would change " },
  { q: "What triggered your most impulsive spend?", starter: "I spent on impulse when " },
  { q: "Did you stick to any goals you set last month?", starter: "Last month I wanted to " },
  { q: "What would you tell a friend about your spending this month?", starter: "Honestly, if a friend asked about my spending, I'd say " },
  { q: "Was there something you wanted to buy but held off on?", starter: "There was this one thing I almost bought — " },
  { q: "What does your spending say about your priorities right now?", starter: "Right now, my spending tells me that " },
];
function getRandomPrompts(count = 3, seed = 0) { return [...REFLECTION_PROMPTS].sort(() => Math.sin(seed++) - 0.5).slice(0, count); }
function genHighlights(mE, aE, sk) { if (!mE.length) return []; const h = []; const big = [...mE].sort((a,b)=>b.amount-a.amount)[0]; if (big) { const c = getCategoryMeta(big.category); h.push({ text: `Your biggest expense was $${big.amount.toFixed(2)} on ${c.label}`, detail: big.note, color: c.color }); } const ct = {}; mE.forEach((e) => { ct[e.category]=(ct[e.category]||0)+e.amount; }); const te = Object.entries(ct).sort((a,b)=>b[1]-a[1])[0]; if (te) { const c = getCategoryMeta(te[0]); const n = mE.filter((e)=>e.category===te[0]).length; h.push({ text: `You logged ${n} expense${n>1?"s":""} in ${c.label}, totaling $${te[1].toFixed(2)}`, color: c.color }); } const [y,m] = sk.split("-").map(Number); const pD = new Date(y,m-2,1); const pK = `${pD.getFullYear()}-${String(pD.getMonth()+1).padStart(2,"0")}`; const pE = getExpensesForMonth(aE, pK); if (pE.length > 0) { const pT = pE.reduce((s,e)=>s+e.amount,0); const tT = mE.reduce((s,e)=>s+e.amount,0); const diff = tT-pT; const pL = pD.toLocaleDateString("en-US",{month:"short"}); if (Math.abs(diff) > 0.01) h.push({ text: diff > 0 ? `You spent $${diff.toFixed(2)} more than in ${pL}` : `You spent $${Math.abs(diff).toFixed(2)} less than in ${pL}`, color: diff > 0 ? "#c4703f" : "#5a7d5c" }); } return h; }

function ReflectionPage({ expenses, reflections, onSaveReflection }) {
  const T = useTheme(); const S = useStyles(); const { isMobile } = useBreakpoint();
  const rm = getRecentMonths(6); const [sm, setSm] = useState(getCurrentMonthKey()); const [text, setText] = useState(""); const [ss, setSs] = useState("idle"); const [ps, setPs] = useState(() => Math.floor(Math.random() * 100)); const tr = useRef(null);
  useEffect(() => { const s = reflections[sm]; setText(s ? s.content : ""); setSs("idle"); }, [sm, reflections]);
  useEffect(() => () => clearTimeout(tr.current), []);
  const mE = getExpensesForMonth(expenses, sm); const mT = mE.reduce((s,e)=>s+e.amount,0); const mC = mE.length;
  const tC = (() => { if (!mE.length) return null; const t = {}; mE.forEach((e) => { t[e.category]=(t[e.category]||0)+e.amount; }); const top = Object.entries(t).sort((a,b)=>b[1]-a[1])[0]; return { category: getCategoryMeta(top[0]), amount: top[1] }; })();
  const sR = reflections[sm]; const sL = rm.find((m) => m.key === sm)?.label || sm;
  const prompts = getRandomPrompts(3, ps); const hl = genHighlights(mE, expenses, sm);
  function save() { onSaveReflection(sm, text); setSs("saved"); clearTimeout(tr.current); tr.current = setTimeout(() => setSs("idle"), 2000); }
  return (<div style={{ maxWidth: 640 }}><h1 style={S.title}>Monthly Reflection</h1><p style={{ fontSize: 14, color: T.textSec, marginBottom: isMobile ? 20 : 32 }}>Look back on your spending. Notice patterns. Set intentions.</p>
    <div style={{ display: "flex", gap: 6, marginBottom: isMobile ? 20 : 28, flexWrap: "wrap" }}>{rm.map((m) => { const on = sm === m.key; return (<button key={m.key} onClick={() => setSm(m.key)} style={on ? { ...S.pillOn, padding: "7px 16px", fontSize: 13 } : { ...S.pillOff, padding: "7px 16px", fontSize: 13 }}>{m.label}</button>); })}</div>
    <div style={{ ...S.card, marginBottom: 16, display: "flex", flexWrap: "wrap", gap: isMobile ? 16 : 32, alignItems: "center" }}>{mC === 0 ? <div style={{ fontSize: 14, color: T.textMuted }}>No expenses logged for {sL}.</div> : (<><div><div style={{ ...S.label, marginBottom: 4 }}>Spent</div><div style={{ fontSize: isMobile ? 20 : 22, fontWeight: 700, color: T.text }}>${mT.toFixed(2)}</div></div><div><div style={{ ...S.label, marginBottom: 4 }}>Entries</div><div style={{ fontSize: isMobile ? 20 : 22, fontWeight: 700, color: T.text }}>{mC}</div></div>{tC && (<div><div style={{ ...S.label, marginBottom: 4 }}>Top Category</div><div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 9, height: 9, borderRadius: "50%", background: tC.category.color }} /><span style={{ fontSize: 15, fontWeight: 600, color: T.text }}>{tC.category.label}</span><span style={{ fontSize: 13, color: T.textMuted }}>${tC.amount.toFixed(2)}</span></div></div>)}</>)}</div>
    {hl.length > 0 && (<div style={{ marginBottom: isMobile ? 20 : 28, display: "flex", flexDirection: "column", gap: 8 }}>{hl.map((h, i) => (<div key={i} style={{ ...S.card, borderLeft: `3px solid ${h.color}`, padding: "12px 16px" }}><div style={{ fontSize: 13, color: T.textSec, fontWeight: 500 }}>{h.text}</div>{h.detail && <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3, fontStyle: "italic" }}>"{h.detail}"</div>}</div>))}</div>)}
    <div style={{ background: T.reflectBg, border: `1px solid ${T.border}`, borderRadius: 12, padding: isMobile ? 20 : 28 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: T.text, marginBottom: 4, fontFamily: T.heading }}>{sL}</h2>
      <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 16 }}>Write freely — this is your space to reflect.</p>
      <div style={{ marginBottom: 18 }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}><span style={S.label}>Prompts to get you started</span><Hoverable onClick={() => setPs((s) => s + 7)} style={{ fontSize: 12, color: T.accent, cursor: "pointer", fontFamily: T.body, fontWeight: 500 }} hoverStyle={{ textDecoration: "underline" }}>Shuffle ↻</Hoverable></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{prompts.map((p, i) => { const isDef = !text.trim() || REFLECTION_PROMPTS.some((rp) => rp.starter === text); return (<div key={`${ps}-${i}`} onClick={() => { if (isDef) { setText(p.starter); setSs("idle"); } }} style={{ fontSize: 13, color: T.textSec, background: T.promptBg, padding: "8px 14px", borderRadius: 8, lineHeight: 1.45, fontStyle: "italic", cursor: isDef ? "pointer" : "default" }}>{p.q}</div>); })}</div>
      </div>
      <textarea value={text} onChange={(e) => { setText(e.target.value); setSs("idle"); }} placeholder="Start writing your reflection here..." style={{ width: "100%", minHeight: isMobile ? 180 : 220, padding: "18px 20px", fontSize: 20, lineHeight: 1.8, border: `1.5px solid ${T.border}`, borderRadius: 10, outline: "none", fontFamily: T.journal, background: T.cardBg, boxSizing: "border-box", resize: "vertical", color: T.text }} />
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16, flexWrap: "wrap" }}><Hoverable onClick={save} style={{ ...S.btn, minWidth: 120, background: ss === "saved" ? T.success : T.primary }} hoverStyle={ss !== "saved" ? { background: T.primaryH } : {}}>{ss === "saved" ? "Saved ✓" : "Save Reflection"}</Hoverable>{sR && ss === "idle" && (<span style={{ fontSize: 12, color: T.textMuted }}>Last saved {formatDate(sR.updatedAt)}</span>)}</div>
    </div>
  </div>);
}

export default function FinBlog() {
  const { isMobile } = useBreakpoint();
  const [expenses, setExpenses] = useState(() => loadExpenses());
  const [reflections, setReflections] = useState(() => loadReflections());
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [isDark, setIsDark] = useState(() => loadTheme() === "dark");
  useEffect(() => { saveExpenses(expenses); }, [expenses]);
  useEffect(() => { saveReflections(reflections); }, [reflections]);
  useEffect(() => { saveThemePref(isDark ? "dark" : "light"); }, [isDark]);
  const tokens = isDark ? DARK : LIGHT;
  return (
    <ThemeContext.Provider value={tokens}>
      <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", minHeight: "100vh", fontFamily: tokens.body, background: tokens.pageBg, color: tokens.text, overflow: "hidden" }}>
        {isMobile ? <MobileHeader isDark={isDark} onToggleTheme={() => setIsDark(!isDark)} /> : <DesktopSidebar currentPage={currentPage} onNavigate={setCurrentPage} isDark={isDark} onToggleTheme={() => setIsDark(!isDark)} />}
        <main style={{ flex: 1, minWidth: 0, padding: isMobile ? "20px 16px 80px" : "40px 48px", maxWidth: isMobile ? "100%" : (currentPage === "dashboard" ? 820 : 720), width: "100%", boxSizing: "border-box", overflowX: "hidden" }}>
          {currentPage === "dashboard" && <DashboardPage expenses={expenses} reflections={reflections} onNavigate={setCurrentPage} />}
          {currentPage === "expenses" && <ExpensesPage expenses={expenses} onAdd={(e) => setExpenses((p) => [e,...p])} onDelete={(id) => setExpenses((p) => p.filter((e) => e.id !== id))} onSaveEdit={(u) => setExpenses((p) => p.map((e) => e.id === u.id ? u : e))} />}
          {currentPage === "reflection" && <ReflectionPage expenses={expenses} reflections={reflections} onSaveReflection={(mk,c) => setReflections((p) => ({...p, [mk]: { monthKey: mk, content: c, updatedAt: new Date().toISOString() }}))} />}
        </main>
        {isMobile && <MobileTabBar currentPage={currentPage} onNavigate={setCurrentPage} />}
      </div>
    </ThemeContext.Provider>
  );
}

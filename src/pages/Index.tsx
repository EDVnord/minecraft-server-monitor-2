import { useState, useEffect, useCallback, createContext, useContext } from "react";
import Icon from "@/components/ui/icon";

// ─── Конфиг API ───────────────────────────────────────────────────────────────

const API = "https://functions.poehali.dev/09b533d2-c1db-4000-80a6-6d371d4a4df4";

// ─── Авторизация: контекст ────────────────────────────────────────────────────

interface AuthUser { id: number; email: string; created_at: string; }
interface AuthCtx  { user: AuthUser | null; token: string; login: (token: string, email: string, id: number, created_at: string) => void; logout: () => void; }

const AuthContext = createContext<AuthCtx>({ user: null, token: "", login: () => {}, logout: () => {} });
const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState(() => localStorage.getItem("mt_token") || "");
  const [user,  setUser]  = useState<AuthUser | null>(() => {
    try { return JSON.parse(localStorage.getItem("mt_user") || "null"); } catch { return null; }
  });

  const login = (t: string, email: string, id: number, created_at: string) => {
    const u = { id, email, created_at };
    setToken(t); setUser(u);
    localStorage.setItem("mt_token", t);
    localStorage.setItem("mt_user", JSON.stringify(u));
  };

  const logout = () => {
    fetch(`${API}/auth/logout`, { method: "POST", headers: { "X-Auth-Token": token } });
    setToken(""); setUser(null);
    localStorage.removeItem("mt_token");
    localStorage.removeItem("mt_user");
  };

  return <AuthContext.Provider value={{ user, token, login, logout }}>{children}</AuthContext.Provider>;
}

// ─── Модалка входа ────────────────────────────────────────────────────────────

function LoginModal({ onClose }: { onClose: () => void }) {
  const { login } = useAuth();
  const [step,    setStep]    = useState<"email" | "code">("email");
  const [email,   setEmail]   = useState("");
  const [code,    setCode]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const sendCode = async () => {
    if (!email.trim() || !email.includes("@")) { setError("Введи корректный email"); return; }
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${API}/auth/send`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim().toLowerCase() }) });
      const data = await res.json();
      if (res.ok) setStep("code");
      else setError(data.error || "Ошибка отправки");
    } catch { setError("Сеть недоступна"); }
    finally { setLoading(false); }
  };

  const verify = async () => {
    if (code.length !== 6) { setError("Код — 6 цифр"); return; }
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${API}/auth/verify`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim().toLowerCase(), code }) });
      const data = await res.json();
      if (res.ok) {
        // Получаем полный профиль
        const me = await fetch(`${API}/auth/me`, { headers: { "X-Auth-Token": data.token } });
        const meData = await me.json();
        login(data.token, data.email, meData.user.id, meData.user.created_at);
        onClose();
      } else setError(data.error || "Неверный код");
    } catch { setError("Сеть недоступна"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm glass-card rounded-2xl p-7 relative border border-white/10" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white/70"><Icon name="X" size={18} /></button>

        <div className="mb-6">
          <div className="text-xs font-mono uppercase tracking-widest text-green-400 mb-1">Вход в MineED</div>
          <h3 className="font-display text-2xl font-bold text-white uppercase">
            {step === "email" ? "Введи email" : "Введи код"}
          </h3>
          <p className="text-white/35 text-xs mt-1">
            {step === "email" ? "Пришлём код — пароль не нужен" : `Код отправлен на ${email}`}
          </p>
        </div>

        {step === "email" ? (
          <div className="space-y-4">
            <input type="email" placeholder="your@email.ru" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendCode()}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-green-500/45 transition-colors" />
            {error && <div className="text-red-400 text-xs flex items-center gap-1.5"><Icon name="AlertCircle" size={12}/>{error}</div>}
            <button onClick={sendCode} disabled={loading}
              className="w-full py-3 bg-green-500 text-black font-bold rounded-xl hover:bg-green-400 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin"/> : <Icon name="Mail" size={16}/>}
              Получить код
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <input type="text" inputMode="numeric" placeholder="000000" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
              onKeyDown={e => e.key === "Enter" && verify()}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 text-sm text-center text-2xl tracking-widest font-bold font-display focus:outline-none focus:border-green-500/45 transition-colors" />
            {error && <div className="text-red-400 text-xs flex items-center gap-1.5"><Icon name="AlertCircle" size={12}/>{error}</div>}
            <button onClick={verify} disabled={loading}
              className="w-full py-3 bg-green-500 text-black font-bold rounded-xl hover:bg-green-400 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin"/> : <Icon name="LogIn" size={16}/>}
              Войти
            </button>
            <button onClick={() => { setStep("email"); setCode(""); setError(""); }} className="w-full text-xs text-white/30 hover:text-white/50 transition-colors">
              ← Другой email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Типы ─────────────────────────────────────────────────────────────────────

type ServerPlan = "free" | "standard" | "vip" | "premium" | "boost_24h" | "boost_72h" | "banner_24h" | "widget";

interface Server {
  id: number;
  name: string;
  ip: string;
  version: string;
  type: string;
  description: string;
  discord: string;
  site: string;
  plan: ServerPlan;
  votes: number;
  online: number;
  max_players: number;
  uptime: number;
  banner_color: string;
  created_at: string;
}

// ─── Константы ────────────────────────────────────────────────────────────────

const NAV = [
  { id: "home",        label: "Каталог" },
  { id: "add",         label: "Добавить сервер" },
  { id: "pricing",     label: "Продвижение" },
  { id: "widget-demo", label: "Виджет" },
];

const TICKER = [
  "⛏️ CraftRealm — 847 онлайн",
  "🗳️ PvPWorld получил 1200 голосов",
  "🆕 SkyBlock Paradise только что добавлен",
  "👑 TopMine — #1 в рейтинге",
  "🔥 HungerGames — 312 онлайн",
  "⚡ Новый сервер добавлен только что",
  "🏆 Голосуй за любимый сервер раз в 24 часа",
];

const TYPES = ["Все", "Выживание", "PvP", "SkyBlock", "Анархия", "Мини-игры", "Ролевой", "Творчество", "Хардкор"];

const PLANS = [
  {
    key: "free" as ServerPlan,
    name: "Бесплатно", price: "0",
    color: "#64748b", highlight: false,
    features: ["Размещение в каталоге", "Стандартная позиция", "Базовая статистика"],
    cta: "Разместить бесплатно",
  },
  {
    key: "standard" as ServerPlan,
    name: "Старт", price: "99",
    color: "#22c55e", highlight: false,
    features: ["Всё из Бесплатного", "Приоритет в поиске", "Цветной баннер карточки", "Значок «Старт» в списке", "Расширенная статистика", "Виджет онлайна для сайта"],
    cta: "Подключить за 99 ₽",
  },
  {
    key: "vip" as ServerPlan,
    name: "VIP", price: "299",
    color: "#f59e0b", highlight: true,
    features: ["Всё из Старта", "Значок 👑 VIP на карточке", "Топ-10 в категории", "Выделение цветом в списке", "Бонусные голоса ×2", "Закреп в ленте на 7 дней", "Кастомный виджет с цветами сервера"],
    cta: "Стать VIP",
  },
  {
    key: "premium" as ServerPlan,
    name: "Premium", price: "599",
    color: "#e879f9", highlight: false,
    features: ["Всё из VIP", "Место в Топ-3 на главной", "Баннер на главной странице", "Бонусные голоса ×3", "Значок 💎 Premium", "Закреп на 30 дней", "Виджет с анимацией и брендингом"],
    cta: "Получить Premium",
  },
];

const PLAN_BADGE: Record<ServerPlan, { label: string; cls: string }> = {
  free:       { label: "",            cls: "" },
  standard:   { label: "⭐ Старт",   cls: "text-green-400 bg-green-500/12 border border-green-500/25" },
  vip:        { label: "👑 VIP",      cls: "text-amber-400 bg-amber-500/12 border border-amber-500/30" },
  premium:    { label: "💎 Premium",  cls: "text-fuchsia-400 bg-fuchsia-500/12 border border-fuchsia-500/30" },
  boost_24h:  { label: "",            cls: "" },
  boost_72h:  { label: "",            cls: "" },
  banner_24h: { label: "",            cls: "" },
  widget:     { label: "🔲 Виджет",   cls: "text-cyan-400 bg-cyan-500/12 border border-cyan-500/25" },
};

// ─── Вспомогательные компоненты ───────────────────────────────────────────────

function OnlineBadge({ online, max }: { online: number; max: number }) {
  const pct = max > 0 ? online / max : 0;
  const color = pct > 0.8 ? "#ef4444" : pct > 0.5 ? "#f59e0b" : "#22c55e";
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full pulse-dot flex-shrink-0"
        style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
      <span className="text-xs font-mono text-white/70 whitespace-nowrap">
        <span className="text-white font-semibold">{online}</span>/{max}
      </span>
    </div>
  );
}

function VoteBar({ votes }: { votes: number }) {
  const pct = Math.min(100, (votes / 5000) * 100);
  return (
    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
      <div className="h-full rounded-full bg-gradient-to-r from-amber-500/70 to-amber-400"
        style={{ width: `${pct}%`, transition: "width 0.8s ease" }} />
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 rounded-full border-2 border-green-500/30 border-t-green-400 animate-spin" />
    </div>
  );
}

// ─── Демо-серверы (показываются пока база пустая) ─────────────────────────────

const DEMO_SERVERS: Server[] = [
  { id: -1, name: "CraftMine | Выживание, Анархия, SkyBlock", ip: "play.craftmine.ru", version: "1.21.1", type: "Выживание", description: "Лучший сервер выживания с анархией и SkyBlock. Без доната, честная игра!", discord: "", site: "", plan: "premium", votes: 2841, online: 1843, max_players: 3000, uptime: 99.2, banner_color: "linear-gradient(135deg,#1a0533,#6d28d9)", created_at: new Date(Date.now() - 10 * 86400000).toISOString() },
  { id: -2, name: "FunnyPvP | PvP, Бедварс, Мини-игры", ip: "play.funnypvp.ru", version: "1.20.4", type: "PvP", description: "Топовый PvP сервер с бедварсами и мини-играми. Ежедневные турниры!", discord: "", site: "", plan: "vip", votes: 1537, online: 612, max_players: 1000, uptime: 97.8, banner_color: "linear-gradient(135deg,#1c0a0a,#dc2626)", created_at: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: -3, name: "SkyWorld | SkyBlock, Фарм, Экономика", ip: "play.skyworld.ru", version: "1.21.1", type: "SkyBlock", description: "Уникальный SkyBlock с экономикой, фермами и кланами. Заходи — не пожалеешь!", discord: "", site: "", plan: "standard", votes: 934, online: 289, max_players: 500, uptime: 98.5, banner_color: "linear-gradient(135deg,#0a1a2e,#0ea5e9)", created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: -4, name: "AnarxiaRU | Анархия 1.21", ip: "anarxia.ru", version: "1.21.1", type: "Анархия", description: "Честная анархия без правил. Гриф, кража, PvP — всё разрешено.", discord: "", site: "", plan: "free", votes: 412, online: 74, max_players: 200, uptime: 95.1, banner_color: "linear-gradient(135deg,#0f0f0f,#374151)", created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: -5, name: "MegaCraft | Творчество, Ролевой", ip: "play.megacraft.ru", version: "1.20.1", type: "Творчество", description: "Большой ролевой сервер с творческим режимом и своей экономикой.", discord: "", site: "", plan: "free", votes: 187, online: 43, max_players: 300, uptime: 96.0, banner_color: "linear-gradient(135deg,#0a1f0a,#15803d)", created_at: new Date(Date.now() - 1 * 86400000).toISOString() },
];

// ─── Карточка сервера ─────────────────────────────────────────────────────────

function ServerCard({ server, rank, onVoted }: { server: Server; rank: number; onVoted: (id: number, votes: number) => void }) {
  const [voting, setVoting]       = useState(false);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [copied, setCopied]       = useState(false);
  const badge     = PLAN_BADGE[server.plan];
  const isPremium = server.plan === "premium";
  const isVip     = server.plan === "vip";
  const isNew     = Date.now() - new Date(server.created_at).getTime() < 48 * 3600 * 1000;
  const isDemo    = server.id < 0;

  const handleVote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (voting || alreadyVoted || isDemo) return;
    setVoting(true);
    try {
      const res  = await fetch(`${API}/vote`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ server_id: server.id }) });
      const data = await res.json();
      if (data.voted === false) setAlreadyVoted(true);
      onVoted(server.id, data.votes);
    } finally { setVoting(false); }
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(server.ip).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };

  return (
    <div className={`group relative flex flex-col sm:flex-row gap-0 rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 cursor-pointer ${
      isPremium ? "neon-border shadow-[0_0_24px_rgba(34,197,94,0.1)]"
      : isVip   ? "gold-border shadow-[0_0_16px_rgba(245,158,11,0.08)]"
      : "glass-card hover:border-white/14"
    }`}>

      {/* Левая часть — номер + голоса */}
      <div className="flex sm:flex-col items-center justify-between sm:justify-start gap-3 sm:gap-0 px-4 py-3 sm:py-4 sm:w-16 bg-white/2 border-b sm:border-b-0 sm:border-r border-white/5 flex-shrink-0">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-display flex-shrink-0 ${
          rank === 1 ? "bg-amber-500 text-black"
          : rank === 2 ? "bg-slate-400 text-black"
          : rank === 3 ? "bg-amber-700/80 text-white"
          : "bg-white/8 text-white/50"
        }`}>{rank}</div>
        <button
          onClick={handleVote}
          disabled={voting || alreadyVoted || isDemo}
          className={`flex flex-col items-center gap-0.5 mt-auto transition-all ${
            alreadyVoted ? "text-amber-400 cursor-default"
            : isDemo     ? "text-white/20 cursor-default"
            : "text-white/35 hover:text-green-400"
          }`}
        >
          {voting
            ? <div className="w-4 h-4 rounded-full border border-current border-t-transparent animate-spin" />
            : <Icon name="ThumbsUp" size={14} />}
          <span className="text-[11px] font-bold font-mono">{server.votes.toLocaleString("ru")}</span>
        </button>
      </div>

      {/* Баннер */}
      <div className="sm:w-52 h-24 sm:h-auto flex-shrink-0 relative overflow-hidden"
        style={{ background: server.banner_color }}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/30" />
        {badge.label && (
          <div className={`absolute top-2 left-2 px-2 py-0.5 text-[10px] font-semibold rounded-full ${badge.cls}`}>
            {badge.label}
          </div>
        )}
        {isNew && (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-green-500 text-black text-[10px] font-bold rounded-full uppercase tracking-wide">
            Новый
          </div>
        )}
      </div>

      {/* Основная информация */}
      <div className="flex-1 min-w-0 px-4 py-3 flex flex-col justify-center gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-sm font-bold text-white uppercase tracking-wide leading-tight group-hover:text-green-300 transition-colors line-clamp-2">
            {server.name}
          </h3>
          {isNew && <span className="hidden"/>}
        </div>
        <p className="text-xs text-white/40 line-clamp-1">{server.description}</p>
        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
          <span className="px-2 py-0.5 bg-white/5 border border-white/8 rounded-md text-[10px] text-white/40 font-mono">{server.version}</span>
          <span className="px-2 py-0.5 bg-green-500/8 border border-green-500/18 rounded-md text-[10px] text-green-400/70">{server.type}</span>
          <OnlineBadge online={server.online} max={server.max_players} />
        </div>
      </div>

      {/* Правая часть — IP + кнопка */}
      <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-2 px-4 py-3 sm:py-4 sm:w-48 border-t sm:border-t-0 sm:border-l border-white/5 flex-shrink-0">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/4 border border-white/8 hover:bg-white/8 transition-all group/ip w-full justify-center"
        >
          <Icon name={copied ? "Check" : "Copy"} size={12} className={copied ? "text-green-400" : "text-white/40"} />
          <span className="text-xs font-mono text-white/55 truncate max-w-[120px]">{server.ip}</span>
        </button>
        <button onClick={handleCopy} className="w-full py-2 rounded-lg bg-green-500 text-black text-xs font-bold hover:bg-green-400 transition-all neon-glow flex items-center justify-center gap-1.5">
          <Icon name={copied ? "Check" : "Play"} size={12} />
          {copied ? "IP скопирован!" : "Играть"}
        </button>
      </div>
    </div>
  );
}

// ─── Навбар ────────────────────────────────────────────────────────────────────

function Navbar({ page, setPage }: { page: string; setPage: (p: string) => void }) {
  const { user, logout } = useAuth();
  const [scrolled,   setScrolled]   = useState(false);
  const [open,       setOpen]       = useState(false);
  const [showLogin,  setShowLogin]  = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "py-2 bg-[#080c10]/95 backdrop-blur-xl border-b border-white/5" : "py-4"}`}>
        <div className="max-w-7xl mx-auto px-5 flex items-center justify-between">
          <button onClick={() => setPage("home")} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-green-500/18 neon-border flex items-center justify-center text-base">⛏️</div>
            <span className="font-display text-lg font-bold text-white tracking-wider">
              Mine<span className="neon-text">ED</span>
            </span>
          </button>
          <div className="hidden md:flex items-center gap-1">
            {NAV.map(n => (
              <button key={n.id} onClick={() => setPage(n.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  page === n.id ? "text-green-400 bg-green-500/10 neon-border" : "text-white/55 hover:text-white/85 hover:bg-white/5"
                }`}>{n.label}</button>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <button onClick={() => setPage("cabinet")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    page === "cabinet" ? "bg-green-500/12 text-green-400 neon-border" : "bg-white/5 text-white/60 border border-white/8 hover:bg-white/8"
                  }`}>
                  <Icon name="User" size={14} />
                  {user.email.split("@")[0]}
                </button>
                <button onClick={() => setPage("add")}
                  className="px-4 py-2 bg-green-500 text-black font-bold text-sm rounded-xl hover:bg-green-400 neon-glow transition-all hover:scale-105">
                  + Добавить
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setShowLogin(true)}
                  className="px-4 py-2 bg-white/6 border border-white/10 text-white/70 text-sm font-semibold rounded-xl hover:bg-white/10 transition-all">
                  Войти
                </button>
                <button onClick={() => setPage("add")}
                  className="px-4 py-2 bg-green-500 text-black font-bold text-sm rounded-xl hover:bg-green-400 neon-glow transition-all hover:scale-105">
                  + Добавить сервер
                </button>
              </>
            )}
          </div>
          <button onClick={() => setOpen(!open)} className="md:hidden text-white/60 hover:text-white">
            <Icon name={open ? "X" : "Menu"} size={22} />
          </button>
        </div>
        {open && (
          <div className="md:hidden mt-2 mx-4 rounded-xl bg-[#0d1117] border border-white/8 p-3 space-y-1">
            {NAV.map(n => (
              <button key={n.id} onClick={() => { setPage(n.id); setOpen(false); }}
                className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-white/75 hover:bg-white/5">{n.label}</button>
            ))}
            <div className="pt-2 border-t border-white/5 space-y-2">
              {user ? (
                <button onClick={() => { setPage("cabinet"); setOpen(false); }}
                  className="w-full py-2.5 bg-white/6 border border-white/10 text-white/70 font-semibold text-sm rounded-xl">
                  Мой кабинет
                </button>
              ) : (
                <button onClick={() => { setShowLogin(true); setOpen(false); }}
                  className="w-full py-2.5 bg-white/6 border border-white/10 text-white/70 font-semibold text-sm rounded-xl">
                  Войти
                </button>
              )}
              <button onClick={() => { setPage("add"); setOpen(false); }}
                className="w-full py-2.5 bg-green-500 text-black font-bold text-sm rounded-xl">
                + Добавить сервер
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

// ─── Страница: Каталог ────────────────────────────────────────────────────────

function HomePage({ setPage }: { setPage: (p: string) => void }) {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [activeType, setActiveType] = useState("Все");
  const [search, setSearch]   = useState("");
  const [sort, setSort]       = useState<"votes" | "online" | "new">("votes");

  const fetchServers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ sort });
      if (activeType !== "Все") params.set("type", activeType);
      if (search) params.set("q", search);
      const res = await fetch(`${API}/?${params}`);
      const data = await res.json();
      setServers(data.servers || []);
    } catch {
      setError("Не удалось загрузить серверы. Попробуй позже.");
    } finally {
      setLoading(false);
    }
  }, [activeType, sort, search]);

  useEffect(() => { fetchServers(); }, [fetchServers]);

  const handleVoted = (id: number, votes: number) => {
    setServers(prev => prev.map(s => s.id === id ? { ...s, votes } : s));
  };

  const totalOnline = servers.reduce((a, s) => a + s.online, 0);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative pt-28 pb-14 px-5 grid-bg overflow-hidden">
        <div className="absolute top-20 left-1/3 w-80 h-80 bg-green-500/7 rounded-full blur-3xl pointer-events-none" />

        {/* Тикер */}
        <div className="absolute top-[72px] left-0 right-0 overflow-hidden py-1.5 border-y border-green-500/10 bg-green-500/3">
          <div className="flex animate-ticker whitespace-nowrap">
            {[...TICKER, ...TICKER].map((t, i) => (
              <span key={i} className="text-[11px] text-green-400/60 mx-8 font-mono">{t}</span>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 neon-border text-green-400 text-xs font-semibold mb-6 slide-up">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-dot" />
            {loading ? "Загрузка..." : `${totalOnline.toLocaleString("ru")} игроков онлайн прямо сейчас`}
          </div>

          <h1 className="font-display text-5xl md:text-6xl font-bold text-white uppercase tracking-wide mb-4 slide-up d1">
            Найди свой<br /><span className="neon-text">Minecraft сервер</span>
          </h1>
          <p className="text-white/45 text-base max-w-xl mx-auto mb-8 slide-up d2">
            Каталог лучших серверов СНГ. Голосуй, продвигай, играй.
          </p>

          <div className="relative max-w-lg mx-auto slide-up d3">
            <Icon name="Search" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Название или IP сервера..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3.5 bg-white/6 border border-white/10 rounded-xl text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-green-500/45 transition-colors"
            />
          </div>

          {!loading && (
            <div className="flex justify-center gap-8 mt-7 slide-up d4">
              {[
                { v: servers.length, label: "серверов" },
                { v: totalOnline.toLocaleString("ru"), label: "онлайн" },
                { v: servers.reduce((a, s) => a + s.votes, 0).toLocaleString("ru"), label: "голосов" },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <div className="font-display text-2xl font-bold neon-text">{s.v}</div>
                  <div className="text-xs text-white/35">{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Фильтры */}
      <section className="px-5 py-4 border-b border-white/5 sticky top-[60px] z-30 bg-[#080c10]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {TYPES.map(t => (
              <button key={t} onClick={() => setActiveType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  activeType === t
                    ? "bg-green-500/18 text-green-400 neon-border"
                    : "bg-white/4 text-white/45 border border-white/7 hover:text-white/70 hover:bg-white/7"
                }`}>{t}</button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-white/30">Сорт:</span>
            {(["votes", "online", "new"] as const).map(s => (
              <button key={s} onClick={() => setSort(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  sort === s ? "bg-green-500/18 text-green-400 neon-border" : "text-white/40 hover:text-white/60 hover:bg-white/5"
                }`}>
                {s === "votes" ? "Голоса" : s === "online" ? "Онлайн" : "Новые"}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Сетка */}
      <section className="px-5 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Рекламный баннер */}
          <div className="mb-6 rounded-2xl neon-border p-5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-green-500/4 relative overflow-hidden">
            <div className="absolute inset-0 grid-bg opacity-50" />
            <div className="relative z-10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 neon-border flex items-center justify-center text-lg">📣</div>
              <div>
                <div className="text-xs text-green-400/60 font-mono uppercase tracking-widest">Рекламное место</div>
                <div className="font-display font-bold text-white text-lg uppercase">Здесь может быть ваш сервер</div>
                <div className="text-xs text-white/40">Premium размещение — первое место на главной</div>
              </div>
            </div>
            <button onClick={() => setPage("pricing")}
              className="relative z-10 flex-shrink-0 px-6 py-2.5 bg-green-500 text-black font-bold text-sm rounded-xl hover:bg-green-400 neon-glow transition-all hover:scale-105">
              Разместить рекламу
            </button>
          </div>

          {loading ? <Spinner /> : error ? (
            <div className="text-center py-20">
              <Icon name="AlertCircle" size={36} className="mx-auto mb-3 text-red-400/60" />
              <p className="text-white/40 text-sm">{error}</p>
              <button onClick={fetchServers} className="mt-4 px-5 py-2 bg-white/8 border border-white/10 rounded-xl text-sm text-white/70 hover:bg-white/12">
                Повторить
              </button>
            </div>
          ) : (
            <>
              {servers.length === 0 && (
                <div className="flex items-center gap-3 mb-4 px-4 py-3 rounded-xl bg-white/3 border border-white/8 text-xs text-white/35">
                  <Icon name="Info" size={14} className="flex-shrink-0" />
                  Реальных серверов пока нет — показываем примеры. Добавь свой!
                </div>
              )}
              <div className="flex flex-col gap-3">
                {(servers.length > 0 ? servers : DEMO_SERVERS).map((server, i) => (
                  <ServerCard key={server.id} server={server} rank={i + 1} onVoted={handleVoted} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

// ─── Страница: Добавить сервер ────────────────────────────────────────────────

function AddServerPage({ setPage }: { setPage: (p: string) => void }) {
  const [form, setForm] = useState({ name: "", ip: "", version: "1.20.4", type: "Выживание", description: "", discord: "", site: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState("");

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.ip.trim()) {
      setError("Название и IP-адрес обязательны");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.status === 201) {
        setSuccess(true);
      } else {
        const d = await res.json();
        setError(d.error || "Ошибка при добавлении");
      }
    } catch {
      setError("Сеть недоступна. Попробуй позже.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen pt-28 pb-16 px-5 flex items-center justify-center">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 neon-border flex items-center justify-center text-3xl mx-auto mb-6">✅</div>
          <h2 className="font-display text-3xl font-bold text-white uppercase mb-3">Сервер добавлен!</h2>
          <p className="text-white/45 text-sm mb-8">Твой сервер уже в каталоге. Хочешь больше игроков — выбери план продвижения.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setPage("home")} className="px-6 py-3 bg-green-500 text-black font-bold rounded-xl hover:bg-green-400 neon-glow transition-all">
              В каталог
            </button>
            <button onClick={() => setPage("pricing")} className="px-6 py-3 bg-white/8 border border-white/12 text-white font-semibold rounded-xl hover:bg-white/12 transition-all">
              Продвижение
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-16 px-5">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-green-400 text-xs font-mono uppercase tracking-widest mb-2">// Бесплатно и мгновенно</div>
          <h2 className="font-display text-4xl font-bold text-white uppercase tracking-wide mb-2">Добавить сервер</h2>
          <p className="text-white/40 text-sm">Заполни форму — сервер сразу появится в каталоге без модерации.</p>
        </div>

        <div className="glass-card neon-border rounded-2xl p-7 space-y-4">
          {[
            { key: "name",        label: "Название сервера *",    placeholder: "Мой крутой сервер",    type: "text" },
            { key: "ip",          label: "IP-адрес *",             placeholder: "play.myserver.ru",     type: "text" },
            { key: "version",     label: "Версия Minecraft",       placeholder: "1.20.4",               type: "text" },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs text-white/40 uppercase tracking-widest font-mono mb-2 block">{f.label}</label>
              <input
                type={f.type}
                placeholder={f.placeholder}
                value={form[f.key as keyof typeof form]}
                onChange={e => set(f.key, e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-green-500/45 transition-colors"
              />
            </div>
          ))}

          <div>
            <label className="text-xs text-white/40 uppercase tracking-widest font-mono mb-2 block">Тип сервера</label>
            <select value={form.type} onChange={e => set("type", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-green-500/45 transition-colors">
              {TYPES.slice(1).map(t => <option key={t} value={t} className="bg-[#0d1117]">{t}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-white/40 uppercase tracking-widest font-mono mb-2 block">Описание</label>
            <textarea rows={4} placeholder="Расскажи об особенностях, режимах, ивентах..."
              value={form.description} onChange={e => set("description", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-green-500/45 resize-none transition-colors" />
          </div>

          {[
            { key: "discord", label: "Discord (необязательно)", placeholder: "discord.gg/myserver" },
            { key: "site",    label: "Сайт (необязательно)",    placeholder: "https://myserver.ru" },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs text-white/40 uppercase tracking-widest font-mono mb-2 block">{f.label}</label>
              <input type="text" placeholder={f.placeholder}
                value={form[f.key as keyof typeof form]} onChange={e => set(f.key, e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-green-500/45 transition-colors" />
            </div>
          ))}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-sm">
              <Icon name="AlertCircle" size={14} />
              {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-3.5 bg-green-500 text-black font-bold rounded-xl hover:bg-green-400 neon-glow transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {loading ? <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" /> : <Icon name="Plus" size={16} />}
            {loading ? "Добавляем..." : "Добавить в каталог бесплатно"}
          </button>

          <p className="text-center text-xs text-white/25 pt-1">
            Хочешь больше игроков?{" "}
            <button onClick={() => setPage("pricing")} className="text-green-400 hover:text-green-300 underline-offset-2 hover:underline">
              Выбери план продвижения
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Модалка оплаты ───────────────────────────────────────────────────────────

function PayModal({ plan, onClose }: { plan: typeof PLANS[number] & { oneTime?: boolean }; onClose: () => void }) {
  const [email, setEmail]       = useState("");
  const [serverId, setServerId] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handlePay = async () => {
    if (!email.trim()) { setError("Введи email для получения чека"); return; }
    setError("");
    setLoading(true);
    try {
      // Генерируем временный order_id на фронте чтобы сразу вставить в return_url
      const tempOrderId = `mt_${plan.key}_${Date.now()}`;
      const returnUrl   = `${window.location.origin}${window.location.pathname}?order_id=${tempOrderId}`;

      const res = await fetch(`${API}/pay/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan:        plan.key,
          email:       email.trim(),
          server_id:   serverId ? Number(serverId) : null,
          return_url:  returnUrl,
          temp_order_id: tempOrderId,
        }),
      });
      const data = await res.json();
      if (data.payment_url) {
        // return_url уже содержит order_id — ЮКасса вернёт туда пользователя
        window.location.href = data.payment_url;
      } else {
        setError(data.error || "Ошибка создания платежа");
      }
    } catch {
      setError("Сеть недоступна. Попробуй позже.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md glass-card rounded-2xl p-7 relative" onClick={e => e.stopPropagation()}
        style={{ border: `1px solid ${plan.color}40`, boxShadow: `0 0 40px ${plan.color}15` }}>
        <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition-colors">
          <Icon name="X" size={18} />
        </button>

        <div className="mb-6">
          <div className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: plan.color }}>Оплата через ЮКассу</div>
          <h3 className="font-display text-2xl font-bold text-white uppercase">{plan.name}</h3>
          <div className="flex items-end gap-1 mt-2">
            <span className="font-display text-4xl font-bold text-white">{plan.price}₽</span>
            <span className="text-white/30 mb-1">{plan.oneTime ? "единоразово" : "/месяц"}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/40 uppercase tracking-widest font-mono mb-2 block">Email для чека *</label>
            <input type="email" placeholder="your@email.ru" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-green-500/45 transition-colors" />
          </div>
          <div>
            <label className="text-xs text-white/40 uppercase tracking-widest font-mono mb-2 block">ID сервера (необязательно)</label>
            <input type="number" placeholder="Введи ID сервера из каталога" value={serverId} onChange={e => setServerId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-green-500/45 transition-colors" />
            <p className="text-[11px] text-white/25 mt-1">После оплаты тариф применится к твоему серверу автоматически</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-xs">
              <Icon name="AlertCircle" size={13} />
              {error}
            </div>
          )}

          <button onClick={handlePay} disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 text-black"
            style={{ background: loading ? "#666" : plan.color }}>
            {loading
              ? <><div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" /> Создаём платёж...</>
              : <><Icon name="CreditCard" size={16} /> Оплатить {plan.price}₽</>
            }
          </button>

          <div className="flex items-center justify-center gap-2 text-[11px] text-white/25">
            <Icon name="Lock" size={11} />
            Безопасная оплата через ЮКассу
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Страница: Тарифы ─────────────────────────────────────────────────────────

function PricingPage({ setPage }: { setPage: (p: string) => void }) {
  const [selectedPlan, setSelectedPlan] = useState<(typeof PLANS[number] & { oneTime?: boolean }) | null>(null);

  return (
    <div className="min-h-screen pt-28 pb-16 px-5">
      {selectedPlan && <PayModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />}
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <div className="text-green-400 text-xs font-mono uppercase tracking-widest mb-3">// Продвижение</div>
          <h2 className="font-display text-5xl font-bold text-white uppercase tracking-wide mb-3">Продвижение сервера</h2>
          <p className="text-white/40 max-w-xl mx-auto text-sm leading-relaxed">
            Больше игроков — больше голосов — выше в рейтинге. Выбери пакет и прокачай свой сервер.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {PLANS.map(plan => (
            <div key={plan.key} className={`relative rounded-2xl p-5 flex flex-col transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 ${
              plan.highlight ? "gold-border bg-amber-500/4 shadow-[0_0_30px_rgba(245,158,11,0.1)]" : "glass-card border border-white/8"
            }`}>
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-amber-500 text-black text-[11px] font-bold rounded-full uppercase tracking-wide whitespace-nowrap">
                  Выбор владельцев
                </div>
              )}
              <div className="mb-5">
                <div className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: plan.color }}>{plan.name}</div>
                <div className="font-display text-3xl font-bold text-white">{plan.price === "0" ? "0₽" : `${plan.price}₽`}</div>
                <div className="text-xs text-white/25">{plan.price === "0" ? "навсегда" : "в месяц"}</div>
              </div>
              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                    <Icon name="Check" size={12} style={{ color: plan.color }} className="flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => plan.price === "0" ? setPage("add") : setSelectedPlan(plan)}
                className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                  plan.highlight ? "bg-amber-500 text-black hover:bg-amber-400 gold-glow"
                  : plan.price === "0" ? "bg-white/8 text-white border border-white/12 hover:bg-white/12"
                  : "text-black font-bold hover:opacity-90"
                }`}
                style={!plan.highlight && plan.price !== "0" ? { background: plan.color } : {}}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Разовые услуги */}
        <div className="mb-10">
          <div className="text-center mb-6">
            <div className="text-white/30 text-xs font-mono uppercase tracking-widest">// Разовые услуги — без подписки</div>
          </div>

          {/* Виджет — большой блок */}
          <div className="glass-card border border-cyan-500/20 rounded-2xl p-6 mb-4 hover:border-cyan-500/35 transition-all bg-cyan-500/3">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "#06b6d418", border: "1px solid #06b6d430" }}>
                    <Icon name="LayoutDashboard" size={18} style={{ color: "#06b6d4" }} />
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">Живой виджет для вашего сайта</div>
                    <div className="text-xs text-white/40">Разовая покупка · навсегда</div>
                  </div>
                  <div className="ml-auto font-display text-2xl font-bold" style={{ color: "#06b6d4" }}>149₽</div>
                </div>
                <p className="text-xs text-white/50 leading-relaxed mb-4">
                  Вставьте одну строку кода на сайт сервера — и посетители увидят онлайн игроков, статус и кнопку «Подключиться» в реальном времени. Автоматически обновляется каждые 60 секунд. В отличие от статичной картинки ip-games — это живой интерактивный блок.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {["Онлайн в реальном времени", "Кнопка «Подключиться»", "Авто-обновление", "5 тем оформления", "Вставка 1 строкой кода"].map(f => (
                    <span key={f} className="text-[11px] px-2.5 py-1 rounded-full text-cyan-400 bg-cyan-500/10 border border-cyan-500/20">{f}</span>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedPlan({ key: "widget" as ServerPlan, name: "Виджет для сайта", price: "149", color: "#06b6d4", highlight: false, features: [], cta: "Купить виджет — 149₽", oneTime: true })}
                    className="py-2.5 px-6 rounded-xl text-sm font-bold text-black transition-all hover:opacity-90 hover:scale-[1.02]"
                    style={{ background: "#06b6d4" }}>
                    Купить виджет — 149₽
                  </button>
                  <button
                    onClick={() => setPage("widget-demo")}
                    className="py-2.5 px-5 rounded-xl text-sm font-semibold text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/8 transition-all">
                    Посмотреть демо →
                  </button>
                </div>
              </div>
              {/* превью виджета */}
              <div className="w-full sm:w-64 flex-shrink-0">
                <div className="rounded-xl overflow-hidden border border-white/10 bg-[#0f1117]">
                  <div className="px-4 py-3 flex items-center gap-2 border-b border-white/5">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs text-white/60 font-mono">mineed.ru/widget</span>
                  </div>
                  <div className="p-4">
                    <div className="text-[11px] text-white/30 uppercase tracking-widest mb-1">Ваш сервер</div>
                    <div className="text-white font-bold text-sm mb-3">CraftRealm SMP</div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ boxShadow: "0 0 6px #22c55e" }} />
                        <span className="text-xs text-white/70"><span className="text-white font-semibold">847</span>/1200</span>
                      </div>
                      <span className="text-[11px] text-white/30">uptime 99.8%</span>
                    </div>
                    <div className="w-full py-2 rounded-lg text-xs font-bold text-black text-center" style={{ background: "#22c55e" }}>
                      Подключиться
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: "TrendingUp", color: "#22c55e",
                name: "Поднять в топ",
                price: "49₽",
                desc: "Сервер поднимается на первые позиции каталога на 24 часа",
                cta: "Поднять сейчас",
                key: "boost_24h",
              },
              {
                icon: "Zap", color: "#f59e0b",
                name: "Суперподнятие",
                price: "99₽",
                desc: "Сервер закрепляется в самом верху каталога на 72 часа",
                cta: "Закрепить на 3 дня",
                key: "boost_72h",
              },
              {
                icon: "Megaphone", color: "#e879f9",
                name: "Баннер на день",
                price: "149₽",
                desc: "Рекламный баннер твоего сервера на главной странице на 24 часа",
                cta: "Разместить баннер",
                key: "banner_24h",
              },
            ].map((item) => (
              <div key={item.key} className="glass-card border border-white/8 rounded-2xl p-5 flex flex-col hover:border-white/15 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${item.color}18`, border: `1px solid ${item.color}30` }}>
                    <Icon name={item.icon} size={16} style={{ color: item.color }} />
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">{item.name}</div>
                    <div className="font-display text-lg font-bold" style={{ color: item.color }}>{item.price}</div>
                  </div>
                </div>
                <p className="text-xs text-white/40 leading-relaxed flex-1 mb-4">{item.desc}</p>
                <button
                  onClick={() => setSelectedPlan({ key: item.key as ServerPlan, name: item.name, price: item.price.replace("₽",""), color: item.color, highlight: false, features: [], cta: item.cta, oneTime: true })}
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-black transition-all hover:opacity-90 hover:scale-[1.02]"
                  style={{ background: item.color }}>
                  {item.cta}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Таблица сравнения */}
        <div className="glass-card border border-white/8 rounded-2xl overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-white/5">
            <h3 className="font-display text-xl font-bold text-white uppercase">Сравнение планов</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-6 py-3 text-white/40 text-xs font-semibold uppercase tracking-wider">Возможность</th>
                  {PLANS.map(p => (
                    <th key={p.key} className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider" style={{ color: p.color }}>{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {[
                  ["Размещение в каталоге",  true,   true,    true,    true  ],
                  ["Цветной баннер карточки",false,  true,    true,    true  ],
                  ["Приоритет в поиске",     false,  true,    true,    true  ],
                  ["Позиция в топе",     "Случайная","Топ-50","Топ-10","Топ-3"],
                  ["Закреп в ленте",         false,  false,  "7 дней","30 дней"],
                  ["Бонус голосов",          "×1",   "×1",   "×2",    "×3"  ],
                  ["Баннер на главной",      false,  false,   false,   true  ],
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-white/2 transition-colors">
                    <td className="px-6 py-3 text-white/50 text-xs">{row[0]}</td>
                    {[1,2,3,4].map(j => (
                      <td key={j} className="px-4 py-3 text-center">
                        {typeof row[j] === "boolean"
                          ? row[j] ? <Icon name="Check" size={14} className="mx-auto text-green-400" />
                                   : <Icon name="Minus" size={14} className="mx-auto text-white/15" />
                          : <span className="text-xs text-white/55">{row[j]}</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { q: "Можно платить помесячно?",          a: "Да, все платные планы оплачиваются ежемесячно. Отменить можно в любой момент." },
            { q: "Как считаются голоса?",             a: "Каждый игрок может голосовать раз в 24 часа. VIP и Premium дают бонусный множитель ×2 и ×3." },
            { q: "Когда сервер появится в каталоге?", a: "Мгновенно — без модерации! Заполнил форму, нажал кнопку — и сервер уже в списке." },
            { q: "Можно начать бесплатно?",           a: "Да! Базовое размещение бесплатно навсегда. Платные планы нужны только для продвижения." },
          ].map((item, i) => (
            <div key={i} className="glass-card border border-white/8 rounded-xl p-5">
              <div className="font-semibold text-white text-sm mb-1">{item.q}</div>
              <div className="text-xs text-white/40 leading-relaxed">{item.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Страница: Успешная оплата ────────────────────────────────────────────────

const PLAN_LABELS: Record<string, { name: string; color: string; icon: string }> = {
  standard: { name: "Стандарт",  color: "#22c55e", icon: "⭐" },
  vip:      { name: "VIP",       color: "#f59e0b", icon: "👑" },
  premium:  { name: "Premium",   color: "#e879f9", icon: "💎" },
};

function PaySuccessPage({ setPage }: { setPage: (p: string) => void }) {
  const [status, setStatus]   = useState<"loading" | "paid" | "pending" | "failed">("loading");
  const [planInfo, setPlanInfo] = useState<{ plan: string; amount: string } | null>(null);

  useEffect(() => {
    const params  = new URLSearchParams(window.location.search);
    const orderId = params.get("order_id");
    if (!orderId) { setStatus("failed"); return; }

    const check = async () => {
      try {
        const res  = await fetch(`${API}/pay/status?order_id=${orderId}`);
        const data = await res.json();
        setPlanInfo({ plan: data.plan, amount: data.amount });
        if (data.status === "paid")    setStatus("paid");
        else if (data.status === "failed") setStatus("failed");
        else setStatus("pending");
      } catch {
        setStatus("failed");
      }
    };

    check();
    // Если pending — перепроверяем каждые 3 сек (макс 5 раз)
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const res  = await fetch(`${API}/pay/status?order_id=${orderId}`).catch(() => null);
      if (!res) return;
      const data = await res.json();
      if (data.status === "paid") { setStatus("paid"); clearInterval(interval); }
      if (data.status === "failed" || attempts >= 5) { clearInterval(interval); }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const info = planInfo ? PLAN_LABELS[planInfo.plan] : null;

  return (
    <div className="min-h-screen pt-28 pb-16 px-5 flex items-center justify-center relative">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{ background: status === "paid" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.06)" }} />

      <div className="relative z-10 max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
              <div className="w-7 h-7 rounded-full border-2 border-green-500/30 border-t-green-400 animate-spin" />
            </div>
            <h2 className="font-display text-3xl font-bold text-white uppercase mb-2">Проверяем оплату</h2>
            <p className="text-white/40 text-sm">Получаем подтверждение от ЮКассы...</p>
          </>
        )}

        {status === "paid" && (
          <>
            {/* Конфетти-эффект */}
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full neon-glow animate-ping opacity-20"
                style={{ background: info?.color || "#22c55e" }} />
              <div className="relative w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                style={{ background: `${info?.color || "#22c55e"}18`, border: `1px solid ${info?.color || "#22c55e"}40` }}>
                {info?.icon || "✅"}
              </div>
            </div>

            <div className="text-xs font-mono uppercase tracking-widest mb-2 slide-up"
              style={{ color: info?.color || "#22c55e" }}>
              Оплата прошла успешно
            </div>
            <h2 className="font-display text-4xl font-bold text-white uppercase tracking-wide mb-3 slide-up d1">
              Тариф {info?.name || ""} активирован!
            </h2>
            <p className="text-white/45 text-sm mb-8 slide-up d2">
              Твой сервер уже поднялся в рейтинге. Игроки начнут находить его быстрее — проверь каталог!
            </p>

            {/* Что дальше */}
            <div className="glass-card border border-white/8 rounded-2xl p-5 mb-6 text-left slide-up d3">
              <div className="text-xs text-white/35 font-mono uppercase tracking-widest mb-3">Что теперь происходит</div>
              {[
                { icon: "TrendingUp", text: "Сервер поднялся в топ каталога" },
                { icon: "Star",       text: "Значок тарифа появился на карточке" },
                { icon: "Users",      text: "Больше игроков видят твой сервер" },
                { icon: "Mail",       text: "Чек отправлен на указанный email" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${info?.color || "#22c55e"}15` }}>
                    <Icon name={item.icon} size={13} style={{ color: info?.color || "#22c55e" }} />
                  </div>
                  <span className="text-sm text-white/65">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-center slide-up d4">
              <button onClick={() => setPage("home")}
                className="px-6 py-3 bg-green-500 text-black font-bold rounded-xl hover:bg-green-400 neon-glow transition-all hover:scale-105">
                В каталог
              </button>
              <button onClick={() => setPage("pricing")}
                className="px-6 py-3 bg-white/6 border border-white/10 text-white/70 font-semibold rounded-xl hover:bg-white/10 transition-all">
                Тарифы
              </button>
            </div>
          </>
        )}

        {status === "pending" && (
          <>
            <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-6 text-3xl">
              ⏳
            </div>
            <h2 className="font-display text-3xl font-bold text-white uppercase mb-2">Ожидаем подтверждения</h2>
            <p className="text-white/40 text-sm mb-6">Платёж обрабатывается. Обычно это занимает до 1 минуты.</p>
            <div className="flex items-center justify-center gap-2 text-amber-400 text-xs mb-6">
              <div className="w-3 h-3 rounded-full border border-amber-400 border-t-transparent animate-spin" />
              Автоматически обновляем статус...
            </div>
            <button onClick={() => setPage("home")}
              className="px-6 py-3 bg-white/6 border border-white/10 text-white/70 font-semibold rounded-xl hover:bg-white/10 transition-all">
              Вернуться в каталог
            </button>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-6 text-3xl">
              ❌
            </div>
            <h2 className="font-display text-3xl font-bold text-white uppercase mb-2">Оплата не прошла</h2>
            <p className="text-white/40 text-sm mb-6">Платёж был отменён или отклонён. Попробуй снова.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setPage("pricing")}
                className="px-6 py-3 bg-green-500 text-black font-bold rounded-xl hover:bg-green-400 neon-glow transition-all">
                Попробовать снова
              </button>
              <button onClick={() => setPage("home")}
                className="px-6 py-3 bg-white/6 border border-white/10 text-white/70 font-semibold rounded-xl hover:bg-white/10 transition-all">
                В каталог
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Страница: Личный кабинет ─────────────────────────────────────────────────

const PLAN_PRICE_LABELS: Record<string, string> = { free: "Бесплатно", standard: "99₽/мес", vip: "299₽/мес", premium: "599₽/мес" };

function CabinetPage({ setPage }: { setPage: (p: string) => void }) {
  const { user, token, logout } = useAuth();
  const [servers,  setServers]  = useState<Server[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState<Server | null>(null);
  const [form,     setForm]     = useState({ name: "", ip: "", version: "", type: "", description: "", discord: "", site: "" });
  const [saving,   setSaving]   = useState(false);
  const [saveMsg,  setSaveMsg]  = useState("");

  useEffect(() => {
    if (!user) return;
    fetch(`${API}/auth/me`, { headers: { "X-Auth-Token": token } })
      .then(r => r.json())
      .then(d => { setServers(d.servers || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user, token]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="font-display text-2xl font-bold text-white uppercase mb-2">Нужна авторизация</h2>
          <p className="text-white/40 text-sm mb-6">Войди чтобы управлять серверами</p>
          <button onClick={() => setPage("home")} className="px-6 py-3 bg-green-500 text-black font-bold rounded-xl hover:bg-green-400 transition-all">
            На главную
          </button>
        </div>
      </div>
    );
  }

  const startEdit = (s: Server) => {
    setEditing(s);
    setForm({ name: s.name, ip: s.ip, version: s.version, type: s.type, description: s.description || "", discord: s.discord || "", site: s.site || "" });
    setSaveMsg("");
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true); setSaveMsg("");
    try {
      const res = await fetch(`${API}/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setServers(prev => prev.map(s => s.id === editing.id ? { ...s, ...form } : s));
        setSaveMsg("Сохранено!");
        setTimeout(() => setEditing(null), 1000);
      } else setSaveMsg(data.error || "Ошибка сохранения");
    } catch { setSaveMsg("Сеть недоступна"); }
    finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen pt-28 pb-16 px-5">
      <div className="max-w-3xl mx-auto">

        {/* Шапка */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-green-400 mb-1">Личный кабинет</div>
            <h2 className="font-display text-3xl font-bold text-white uppercase">{user.email.split("@")[0]}</h2>
            <div className="text-xs text-white/30 mt-0.5">{user.email}</div>
          </div>
          <button onClick={() => { logout(); setPage("home"); }}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white/50 text-sm rounded-xl hover:bg-white/8 transition-all">
            <Icon name="LogOut" size={14} />
            Выйти
          </button>
        </div>

        {/* Мои серверы */}
        <div className="glass-card border border-white/8 rounded-2xl overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-white uppercase">Мои серверы</h3>
            <button onClick={() => setPage("add")}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-black text-xs font-bold rounded-xl hover:bg-green-400 transition-all">
              <Icon name="Plus" size={12} />
              Добавить
            </button>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center"><div className="w-6 h-6 rounded-full border-2 border-green-500/30 border-t-green-400 animate-spin"/></div>
          ) : servers.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-4xl mb-3">⛏️</div>
              <p className="text-white/35 text-sm">У тебя пока нет серверов</p>
              <button onClick={() => setPage("add")} className="mt-4 px-5 py-2.5 bg-green-500 text-black font-bold text-sm rounded-xl hover:bg-green-400 transition-all">
                Добавить первый сервер
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {servers.map(s => (
                <div key={s.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ background: s.banner_color }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-sm truncate">{s.name}</div>
                    <div className="text-xs text-white/35 font-mono">{s.ip}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${PLAN_BADGE[s.plan]?.cls || "text-white/30"}`}>
                        {PLAN_BADGE[s.plan]?.label || "Бесплатно"}
                      </span>
                      <span className="text-[10px] text-white/30">{PLAN_PRICE_LABELS[s.plan]}</span>
                      <span className="text-[10px] text-amber-400">♥ {s.votes}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => startEdit(s)}
                      className="px-3 py-1.5 bg-white/6 border border-white/10 text-white/60 text-xs rounded-lg hover:bg-white/10 transition-all flex items-center gap-1">
                      <Icon name="Pencil" size={11} /> Изменить
                    </button>
                    <button onClick={() => setPage("pricing")}
                      className="px-3 py-1.5 bg-green-500/12 border border-green-500/25 text-green-400 text-xs rounded-lg hover:bg-green-500/20 transition-all flex items-center gap-1">
                      <Icon name="TrendingUp" size={11} /> Продвинуть
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Модалка редактирования */}
        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setEditing(null)}>
            <div className="w-full max-w-lg glass-card border border-white/10 rounded-2xl p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display text-xl font-bold text-white uppercase">Редактировать сервер</h3>
                <button onClick={() => setEditing(null)} className="text-white/30 hover:text-white/70"><Icon name="X" size={18}/></button>
              </div>
              <div className="space-y-3">
                {[
                  { key: "name",        label: "Название *",     placeholder: "Мой сервер" },
                  { key: "ip",          label: "IP адрес *",     placeholder: "play.myserver.ru" },
                  { key: "version",     label: "Версия",         placeholder: "1.21.1" },
                  { key: "description", label: "Описание",       placeholder: "Расскажи об сервере..." },
                  { key: "discord",     label: "Discord",        placeholder: "discord.gg/myserver" },
                  { key: "site",        label: "Сайт",           placeholder: "https://myserver.ru" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-[11px] text-white/35 uppercase tracking-widest font-mono mb-1 block">{f.label}</label>
                    {f.key === "description" ? (
                      <textarea placeholder={f.placeholder} value={form[f.key as keyof typeof form]}
                        onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} rows={3}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-green-500/45 transition-colors resize-none" />
                    ) : (
                      <input type="text" placeholder={f.placeholder} value={form[f.key as keyof typeof form]}
                        onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-green-500/45 transition-colors" />
                    )}
                  </div>
                ))}
                <div>
                  <label className="text-[11px] text-white/35 uppercase tracking-widest font-mono mb-1 block">Режим</label>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500/45 transition-colors">
                    {["Выживание","PvP","SkyBlock","Анархия","Мини-игры","Ролевой","Творчество","Хардкор"].map(t => (
                      <option key={t} value={t} className="bg-[#0d1117]">{t}</option>
                    ))}
                  </select>
                </div>
                {saveMsg && <div className={`text-xs text-center py-2 rounded-lg ${saveMsg === "Сохранено!" ? "text-green-400 bg-green-500/10" : "text-red-400 bg-red-500/10"}`}>{saveMsg}</div>}
                <button onClick={saveEdit} disabled={saving}
                  className="w-full py-3 bg-green-500 text-black font-bold rounded-xl hover:bg-green-400 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving ? <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin"/> : <Icon name="Save" size={15}/>}
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Быстрые действия */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass-card border border-white/8 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-green-500/12 flex items-center justify-center"><Icon name="TrendingUp" size={16} className="text-green-400"/></div>
              <div className="font-semibold text-white text-sm">Продвижение</div>
            </div>
            <p className="text-xs text-white/40 mb-4">Поднять в топ, купить VIP или Premium тариф</p>
            <button onClick={() => setPage("pricing")} className="w-full py-2.5 bg-green-500/12 border border-green-500/25 text-green-400 text-sm font-semibold rounded-xl hover:bg-green-500/20 transition-all">
              Перейти к тарифам
            </button>
          </div>
          <div className="glass-card border border-white/8 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/12 flex items-center justify-center"><Icon name="Zap" size={16} className="text-amber-400"/></div>
              <div className="font-semibold text-white text-sm">Разовый буст</div>
            </div>
            <p className="text-xs text-white/40 mb-4">Поднять сервер в топ на 24ч всего за 49₽</p>
            <button onClick={() => setPage("pricing")} className="w-full py-2.5 bg-amber-500/12 border border-amber-500/25 text-amber-400 text-sm font-semibold rounded-xl hover:bg-amber-500/20 transition-all">
              Поднять за 49₽
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Widget Demo Page ──────────────────────────────────────────────────────────

const WIDGET_THEMES = [
  { id: "dark",    label: "Тёмная",   bg: "#0f1117", border: "#ffffff15", accent: "#22c55e", text: "#fff" },
  { id: "glass",   label: "Стекло",   bg: "rgba(255,255,255,0.05)", border: "#ffffff25", accent: "#06b6d4", text: "#fff" },
  { id: "green",   label: "Зелёная",  bg: "#052e16", border: "#22c55e40", accent: "#22c55e", text: "#fff" },
  { id: "purple",  label: "Фиолет",   bg: "#1e0a2e", border: "#a855f740", accent: "#a855f7", text: "#fff" },
  { id: "minimal", label: "Минимал",  bg: "#18181b", border: "#3f3f46",   accent: "#fff",    text: "#a1a1aa" },
];

function WidgetDemoPage({ setPage }: { setPage: (p: string) => void }) {
  const [theme, setTheme] = useState(WIDGET_THEMES[0]);
  const [serverId, setServerId] = useState("12345");
  const [copied, setCopied]     = useState(false);

  const [compact, setCompact] = useState(false);

  const embedCode = `<script src="https://mineed.ru/widget.js" data-server="${serverId}" data-theme="${theme.id}"${compact ? ' data-compact="true"' : ''}></script>`;

  const copy = () => {
    try { navigator.clipboard.writeText(embedCode); } catch (e) { console.warn(e); }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-5 py-12">
      <button onClick={() => setPage("pricing")} className="text-xs text-white/30 hover:text-white/60 mb-8 flex items-center gap-1 transition-colors">
        ← Назад к тарифам
      </button>

      <div className="text-center mb-10">
        <div className="text-cyan-400 text-xs font-mono uppercase tracking-widest mb-3">// Виджет</div>
        <h1 className="font-display text-4xl font-bold text-white uppercase tracking-wide mb-3">Живой виджет</h1>
        <p className="text-white/40 text-sm max-w-lg mx-auto">Один тег — и на вашем сайте появится живой блок с онлайном, статусом и кнопкой подключения. Обновляется каждые 60 секунд.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Настройки */}
        <div className="space-y-6">
          <div className="glass-card border border-white/8 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4 text-sm">Настройка</h3>

            <div className="mb-5">
              <label className="text-xs text-white/30 uppercase tracking-widest font-mono mb-2 block">ID сервера</label>
              <input
                type="text"
                value={serverId}
                onChange={e => setServerId(e.target.value)}
                placeholder="Введи ID своего сервера"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-cyan-500/45 transition-colors font-mono"
              />
              <p className="text-[11px] text-white/25 mt-1">Найди ID в личном кабинете после добавления сервера</p>
            </div>

            <div>
              <label className="text-xs text-white/30 uppercase tracking-widest font-mono mb-3 block">Тема оформления</label>
              <div className="flex flex-wrap gap-2">
                {WIDGET_THEMES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      theme.id === t.id
                        ? "border-cyan-400 text-cyan-400 bg-cyan-500/10"
                        : "border-white/10 text-white/40 hover:border-white/25 hover:text-white/60"
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-white/30 uppercase tracking-widest font-mono mb-3 block">Формат</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setCompact(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    !compact ? "border-cyan-400 text-cyan-400 bg-cyan-500/10" : "border-white/10 text-white/40 hover:border-white/25 hover:text-white/60"
                  }`}>
                  Полная карточка
                </button>
                <button
                  onClick={() => setCompact(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    compact ? "border-cyan-400 text-cyan-400 bg-cyan-500/10" : "border-white/10 text-white/40 hover:border-white/25 hover:text-white/60"
                  }`}>
                  Компактная строка
                </button>
              </div>
            </div>
          </div>

          {/* Код для вставки */}
          <div className="glass-card border border-white/8 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4 text-sm">Код для вставки</h3>
            <div className="relative">
              <pre className="bg-black/40 border border-white/8 rounded-xl p-4 text-xs font-mono text-cyan-300 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
                {embedCode}
              </pre>
              <button
                onClick={copy}
                className={`absolute top-3 right-3 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  copied ? "bg-green-500 text-black" : "bg-white/10 text-white/60 hover:bg-white/15"
                }`}>
                {copied ? "Скопировано!" : "Копировать"}
              </button>
            </div>
            <p className="text-[11px] text-white/25 mt-3">Вставь этот тег в HTML-код своего сайта там, где хочешь видеть виджет</p>
          </div>

          <button
            onClick={() => setPage("pricing")}
            className="w-full py-3 rounded-xl text-sm font-bold text-black transition-all hover:opacity-90"
            style={{ background: "#06b6d4" }}>
            Купить виджет — 149₽
          </button>
        </div>

        {/* Превью */}
        <div>
          <div className="text-xs text-white/30 uppercase tracking-widest font-mono mb-4">// Предпросмотр</div>
          <div className="space-y-4">
            {/* Виджет-карточка */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
              <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: theme.border }}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs font-mono" style={{ color: theme.text + "80" }}>mineed.ru</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ color: theme.accent, background: theme.accent + "18", border: `1px solid ${theme.accent}30` }}>ONLINE</span>
              </div>
              <div className="px-5 py-4">
                <div className="text-[11px] uppercase tracking-widest mb-1" style={{ color: theme.text + "50" }}>Minecraft сервер</div>
                <div className="font-bold text-lg mb-4" style={{ color: theme.text }}>CraftRealm SMP</div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs" style={{ color: theme.text + "60" }}>Онлайн игроков</span>
                  <span className="text-xs font-mono font-bold" style={{ color: theme.accent }}>847 / 1200</span>
                </div>
                <div className="w-full h-1.5 rounded-full mb-4" style={{ background: theme.accent + "20" }}>
                  <div className="h-full rounded-full" style={{ width: "70%", background: theme.accent }} />
                </div>
                <div className="flex items-center justify-between mb-4 text-xs" style={{ color: theme.text + "40" }}>
                  <span>play.craftrealsm.ru</span>
                  <span>uptime 99.8%</span>
                </div>
                <button
                  className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                  style={{ background: theme.accent, color: theme.id === "minimal" ? "#18181b" : "#000" }}>
                  Подключиться
                </button>
              </div>
            </div>

            {/* Компактный виджет */}
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
              <div className="px-4 py-3 flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" style={{ boxShadow: "0 0 6px #22c55e" }} />
                <span className="text-sm font-semibold flex-1" style={{ color: theme.text }}>CraftRealm SMP</span>
                <span className="text-xs font-mono font-bold" style={{ color: theme.accent }}>847 онлайн</span>
                <button className="px-3 py-1 rounded-lg text-xs font-bold ml-1" style={{ background: theme.accent, color: "#000" }}>
                  Войти
                </button>
              </div>
            </div>
            <p className="text-[11px] text-white/25 text-center">Полная карточка и компактная строка — оба варианта доступны</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Oferta Page ───────────────────────────────────────────────────────────────

function OfertaPage({ setPage }: { setPage: (p: string) => void }) {
  return (
    <div className="max-w-3xl mx-auto px-5 py-12 text-white/80">
      <button onClick={() => setPage("home")} className="text-xs text-white/30 hover:text-white/60 mb-8 flex items-center gap-1 transition-colors">
        ← Назад
      </button>
      <h1 className="text-2xl font-bold text-white mb-2">Публичная оферта</h1>
      <p className="text-xs text-white/30 mb-8">Редакция от 23 апреля 2026 г.</p>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="text-white font-semibold mb-2">1. Общие положения</h2>
          <p>Настоящая публичная оферта (далее — «Оферта») является официальным предложением Ергашева Дмитрия Владимировича (далее — «Исполнитель»), ИНН 591455226727, заключить договор на оказание услуг на изложенных ниже условиях.</p>
          <p className="mt-2">Оплата услуг означает полное и безоговорочное принятие настоящей Оферты в соответствии со ст. 438 ГК РФ.</p>
        </div>

        <div>
          <h2 className="text-white font-semibold mb-2">2. Предмет договора</h2>
          <p>Исполнитель оказывает услуги по предоставлению цифровых товаров — дополнений для продвижения Minecraft-серверов на платформе MineED.ru (далее — «Услуги»). Перечень и стоимость услуг указаны на странице <button onClick={() => setPage("pricing")} className="text-green-400 hover:text-green-300 underline">Тарифы</button>.</p>
        </div>

        <div>
          <h2 className="text-white font-semibold mb-2">3. Порядок получения услуги</h2>
          <p>После успешной оплаты приобретённый тариф активируется автоматически и отображается в личном кабинете пользователя. Физическая доставка не предусмотрена — все товары являются цифровыми и предоставляются в электронном виде на сайте MineED.ru.</p>
        </div>

        <div>
          <h2 className="text-white font-semibold mb-2">4. Стоимость и оплата</h2>
          <p>Стоимость услуг указана на сайте в рублях РФ с учётом всех налогов. Оплата производится через сервис ЮKassa. Исполнитель является самозанятым и уплачивает налог на профессиональный доход.</p>
        </div>

        <div>
          <h2 className="text-white font-semibold mb-2">5. Возврат средств</h2>
          <p>Возврат возможен в течение 24 часов с момента оплаты при условии, что услуга не была активирована. Для возврата обратитесь на <a href="mailto:admin@mineed.ru" className="text-green-400 hover:text-green-300 underline">admin@mineed.ru</a>.</p>
        </div>

        <div>
          <h2 className="text-white font-semibold mb-2">6. Ответственность сторон</h2>
          <p>Исполнитель не несёт ответственности за временную недоступность сервиса по причинам, не зависящим от него. Пользователь несёт ответственность за достоверность предоставляемых данных.</p>
        </div>

        <div>
          <h2 className="text-white font-semibold mb-2">7. Контакты</h2>
          <p>По всем вопросам обращайтесь: <a href="mailto:admin@mineed.ru" className="text-green-400 hover:text-green-300 underline">admin@mineed.ru</a></p>
        </div>
      </section>
    </div>
  );
}

// ─── Contacts Page ─────────────────────────────────────────────────────────────

function ContactsPage({ setPage }: { setPage: (p: string) => void }) {
  return (
    <div className="max-w-2xl mx-auto px-5 py-12 text-white/80">
      <button onClick={() => setPage("home")} className="text-xs text-white/30 hover:text-white/60 mb-8 flex items-center gap-1 transition-colors">
        ← Назад
      </button>
      <h1 className="text-2xl font-bold text-white mb-8">Контакты и реквизиты</h1>

      <div className="space-y-6 text-sm">
        <div className="bg-white/5 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-semibold text-base">Исполнитель</h2>
          <div className="space-y-3 text-white/60">
            <div className="flex justify-between">
              <span className="text-white/30">Статус</span>
              <span>Самозанятый</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/30">ФИО</span>
              <span>Ергашев Дмитрий Владимирович</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/30">ИНН</span>
              <span className="font-mono">591455226727</span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-semibold text-base">Связь</h2>
          <div className="space-y-3 text-white/60">
            <div className="flex justify-between">
              <span className="text-white/30">Email</span>
              <a href="mailto:admin@mineed.ru" className="text-green-400 hover:text-green-300 transition-colors">admin@mineed.ru</a>
            </div>
            <div className="flex justify-between">
              <span className="text-white/30">Сайт</span>
              <span>mineed.ru</span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-semibold text-base">Платёжная информация</h2>
          <div className="space-y-3 text-white/60">
            <div className="flex justify-between">
              <span className="text-white/30">Приём платежей</span>
              <span>ЮKassa</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/30">Валюта</span>
              <span>Рубль РФ (₽)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/30">Налоговый режим</span>
              <span>НПД (самозанятый)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Footer ────────────────────────────────────────────────────────────────────

function Footer({ setPage }: { setPage: (p: string) => void }) {
  return (
    <footer className="border-t border-white/5 py-8 px-5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <button onClick={() => setPage("home")} className="flex items-center gap-2">
          <span>⛏️</span>
          <span className="font-display font-bold text-white/60 tracking-wider">Mine<span className="text-green-400">ED</span></span>
        </button>
        <div className="flex gap-6 text-xs text-white/25">
          <button onClick={() => setPage("home")}    className="hover:text-white/50 transition-colors">Каталог</button>
          <button onClick={() => setPage("add")}     className="hover:text-white/50 transition-colors">Добавить сервер</button>
          <button onClick={() => setPage("pricing")} className="hover:text-white/50 transition-colors">Тарифы</button>
          <button onClick={() => setPage("oferta")}   className="hover:text-white/50 transition-colors">Оферта</button>
          <button onClick={() => setPage("contacts")} className="hover:text-white/50 transition-colors">Реквизиты</button>
          <span>Поддержка</span>
        </div>
        <div className="text-xs text-white/18">© 2026 MineED.ru</div>
      </div>
    </footer>
  );
}

// ─── Root ──────────────────────────────────────────────────────────────────────

function AppInner() {
  const [page, setPage] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("order_id")) return "pay-success";
    return "home";
  });

  const navigate = (p: string) => {
    if (p !== "pay-success") window.history.replaceState({}, "", window.location.pathname);
    setPage(p);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar page={page} setPage={navigate} />
      {page === "home"        && <HomePage       setPage={navigate} />}
      {page === "add"         && <AddServerPage  setPage={navigate} />}
      {page === "pricing"     && <PricingPage    setPage={navigate} />}
      {page === "pay-success" && <PaySuccessPage setPage={navigate} />}
      {page === "cabinet"     && <CabinetPage    setPage={navigate} />}
      {page === "oferta"       && <OfertaPage     setPage={navigate} />}
      {page === "contacts"     && <ContactsPage   setPage={navigate} />}
      {page === "widget-demo"  && <WidgetDemoPage setPage={navigate} />}
      <Footer setPage={navigate} />
    </div>
  );
}

export default function Index() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
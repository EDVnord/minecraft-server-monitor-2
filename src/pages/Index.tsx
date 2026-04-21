import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

// ─── Данные ──────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { id: "hero", label: "Главная" },
  { id: "dashboard", label: "Дашборд" },
  { id: "pricing", label: "Тарифы" },
  { id: "integrations", label: "Интеграции" },
  { id: "contact", label: "Контакты" },
];

const SERVERS = [
  { name: "Survival #1", ip: "play.mcserver.ru", players: 247, max: 500, tps: 19.8, ram: 68, status: "online", ping: 12 },
  { name: "Creative Hub", ip: "creative.mcserver.ru", players: 89, max: 200, tps: 20.0, ram: 45, status: "online", ping: 8 },
  { name: "SkyWars", ip: "skywars.mcserver.ru", players: 312, max: 400, tps: 18.4, ram: 82, status: "online", ping: 15 },
  { name: "Lobby", ip: "lobby.mcserver.ru", players: 0, max: 100, tps: 0, ram: 12, status: "offline", ping: 0 },
];

const PLANS = [
  {
    name: "Старт",
    price: "299",
    period: "мес",
    accent: "#94a3b8",
    servers: 1,
    features: ["1 сервер", "Базовые графики", "Уведомления в Telegram", "История 7 дней", "Обновление каждые 60 сек"],
    popular: false,
  },
  {
    name: "Про",
    price: "799",
    period: "мес",
    accent: "#22c55e",
    servers: 5,
    features: ["5 серверов", "Расширенная аналитика", "Discord + Telegram", "История 30 дней", "Обновление каждые 10 сек", "API доступ", "Алерты по TPS/RAM"],
    popular: true,
  },
  {
    name: "Бизнес",
    price: "1999",
    period: "мес",
    accent: "#a78bfa",
    servers: 20,
    features: ["20 серверов", "Полная аналитика", "Все каналы уведомлений", "История 90 дней", "Обновление каждые 5 сек", "API + Webhooks", "Приоритетная поддержка", "White-label"],
    popular: false,
  },
];

const INTEGRATIONS = [
  { name: "Telegram", icon: "Send", color: "#229ED9", desc: "Алерты и статус в реальном времени" },
  { name: "Discord", icon: "MessageSquare", color: "#5865F2", desc: "Бот с командами мониторинга" },
  { name: "LuckPerms", icon: "Shield", color: "#f59e0b", desc: "Мониторинг прав и групп" },
  { name: "EssentialsX", icon: "Zap", color: "#22c55e", desc: "Статистика экономики сервера" },
  { name: "Dynmap", icon: "Map", color: "#0ea5e9", desc: "Интеграция с картой мира" },
  { name: "PlaceholderAPI", icon: "Code", color: "#e879f9", desc: "Переменные в интерфейсе" },
  { name: "Vault", icon: "Database", color: "#f97316", desc: "Экономика и баланс игроков" },
  { name: "CoreProtect", icon: "Lock", color: "#64748b", desc: "Логи действий на сервере" },
];

const STATS_TICKER = [
  "🟢 Survival #1 — 247 онлайн",
  "⚡ TPS 19.8 — стабильно",
  "📊 RAM 68% — норма",
  "🟢 Creative Hub — 89 онлайн",
  "🚀 Аптайм 99.9%",
  "🟢 SkyWars — 312 онлайн",
  "⚡ Ping 8ms — отлично",
  "📈 +18% игроков за неделю",
];

// ─── Утилиты ──────────────────────────────────────────────────────────────────

function useAnimatedNumber(target: number, duration = 1500) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

function useRealtimeGraph(length = 30) {
  const [data, setData] = useState<number[]>(() =>
    Array.from({ length }, () => 60 + Math.random() * 35)
  );
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => {
        const last = prev[prev.length - 1];
        const next = Math.max(20, Math.min(100, last + (Math.random() - 0.48) * 8));
        return [...prev.slice(1), next];
      });
    }, 800);
    return () => clearInterval(interval);
  }, []);
  return data;
}

// ─── Компонент: Мини-график SVG ───────────────────────────────────────────────

function SparklineChart({ data, color = "#22c55e", height = 60 }: { data: number[]; color?: string; height?: number }) {
  const w = 300, h = height;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 8) - 4;
    return `${x},${y}`;
  }).join(" ");
  const last = data[data.length - 1];
  const lx = w;
  const ly = h - ((last - min) / range) * (h - 8) - 4;
  const gradId = `grad${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M0,${h} L${pts.split(" ").join(" L")} L${w},${h} Z`} fill={`url(#${gradId})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="4" fill={color} className="pulse-dot" />
    </svg>
  );
}

// ─── Компонент: Индикатор статуса ─────────────────────────────────────────────

function StatusDot({ status }: { status: "online" | "offline" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
      status === "online" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "online" ? "bg-green-400 pulse-dot" : "bg-red-400"}`} />
      {status === "online" ? "Онлайн" : "Офлайн"}
    </span>
  );
}

// ─── Компонент: Прогресс-бар ──────────────────────────────────────────────────

function ProgressBar({ value, color = "#22c55e" }: { value: number; color?: string }) {
  const c = value > 80 ? "#ef4444" : value > 60 ? "#f59e0b" : color;
  return (
    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-1000"
        style={{ width: `${value}%`, background: `linear-gradient(90deg, ${c}88, ${c})`, boxShadow: `0 0 8px ${c}44` }}
      />
    </div>
  );
}

// ─── Навбар ────────────────────────────────────────────────────────────────────

function Navbar({ active, onNav }: { active: string; onNav: (id: string) => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "py-2 bg-[#0b0f0e]/95 backdrop-blur-xl border-b border-white/5" : "py-4"}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <button onClick={() => onNav("hero")} className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-green-500/20 neon-border flex items-center justify-center">
            <span className="text-sm">⛏️</span>
          </div>
          <span className="font-display text-lg font-bold text-white tracking-wider">
            MC<span className="neon-text">Monitor</span>
          </span>
        </button>
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(link => (
            <button
              key={link.id}
              onClick={() => onNav(link.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                active === link.id
                  ? "text-green-400 bg-green-500/10 neon-border"
                  : "text-white/60 hover:text-white/90 hover:bg-white/5"
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-3">
          <button className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors">Войти</button>
          <button onClick={() => onNav("pricing")} className="px-5 py-2 bg-green-500 text-black font-semibold text-sm rounded-lg hover:bg-green-400 transition-all duration-200 neon-glow hover:scale-105">
            Начать бесплатно
          </button>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-white/70 hover:text-white">
          <Icon name={mobileOpen ? "X" : "Menu"} size={22} />
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden mt-2 mx-4 rounded-xl bg-[#111817] border border-white/8 p-3 space-y-1">
          {NAV_LINKS.map(link => (
            <button key={link.id} onClick={() => { onNav(link.id); setMobileOpen(false); }} className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors">
              {link.label}
            </button>
          ))}
          <div className="pt-2 border-t border-white/5">
            <button onClick={() => { onNav("pricing"); setMobileOpen(false); }} className="w-full py-2.5 bg-green-500 text-black font-semibold text-sm rounded-lg">
              Начать бесплатно
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

// ─── Секция: Hero ──────────────────────────────────────────────────────────────

function HeroSection({ onNav }: { onNav: (id: string) => void }) {
  const players = useAnimatedNumber(1648);
  const servers = useAnimatedNumber(342);
  const uptime = useAnimatedNumber(99);

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden grid-bg">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-emerald-500/6 rounded-full blur-3xl pointer-events-none" />

      {/* Ticker */}
      <div className="absolute top-20 left-0 right-0 overflow-hidden py-2 border-y border-green-500/10 bg-green-500/3">
        <div className="flex animate-ticker whitespace-nowrap">
          {[...STATS_TICKER, ...STATS_TICKER].map((item, i) => (
            <span key={i} className="text-xs text-green-400/70 mx-8 font-mono">{item}</span>
          ))}
        </div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-32 pb-20">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 neon-border text-green-400 text-xs font-semibold mb-8 slide-up">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full pulse-dot" />
          Реальный мониторинг в реальном времени
        </div>

        <h1 className="font-display text-5xl md:text-7xl font-bold text-white tracking-wide uppercase mb-6 slide-up fade-in-delay-1">
          Держи руку на пульсе<br />
          <span className="neon-text">каждого сервера</span>
        </h1>

        <p className="text-lg text-white/50 max-w-2xl mx-auto mb-10 font-sans slide-up fade-in-delay-2">
          Мониторинг TPS, RAM, игроков и событий в реальном времени. Алерты в Telegram и Discord, графики, аналитика — всё в одном дашборде.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 slide-up fade-in-delay-3">
          <button onClick={() => onNav("dashboard")} className="px-8 py-3.5 bg-green-500 text-black font-bold rounded-xl hover:bg-green-400 transition-all duration-200 neon-glow hover:scale-105 text-base">
            Смотреть дашборд
          </button>
          <button onClick={() => onNav("pricing")} className="px-8 py-3.5 bg-white/5 text-white font-semibold rounded-xl hover:bg-white/10 border border-white/10 transition-all duration-200 text-base">
            Выбрать тариф
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6 max-w-xl mx-auto slide-up fade-in-delay-4">
          {[
            { value: players, suffix: "+", label: "Игроков онлайн" },
            { value: servers, suffix: "", label: "Серверов под наблюдением" },
            { value: uptime, suffix: ".9%", label: "Аптайм платформы" },
          ].map((stat, i) => (
            <div key={i} className="glass-card rounded-xl p-4">
              <div className="font-display text-2xl font-bold neon-text">{stat.value}{stat.suffix}</div>
              <div className="text-xs text-white/40 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/30">
        <span className="text-xs">Прокрути вниз</span>
        <Icon name="ChevronDown" size={16} className="animate-bounce" />
      </div>
    </section>
  );
}

// ─── Секция: Dashboard ─────────────────────────────────────────────────────────

function DashboardSection() {
  const tpsData = useRealtimeGraph(30);
  const ramData = useRealtimeGraph(30);
  const playersData = useRealtimeGraph(30);

  const lastTps = tpsData[tpsData.length - 1];
  const lastRam = ramData[ramData.length - 1];
  const lastPlayers = Math.floor(playersData[playersData.length - 1] * 6);

  return (
    <section id="dashboard" className="py-24 px-6 relative">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="text-green-400 text-xs font-mono uppercase tracking-widest mb-2">// Реальный мониторинг</div>
            <h2 className="font-display text-4xl font-bold text-white uppercase tracking-wide">Дашборд серверов</h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 px-3 py-1.5 rounded-full neon-border">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full pulse-dot" />
            Live обновление
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { label: "TPS", value: lastTps.toFixed(1), max: "20", unit: "", data: tpsData, color: "#22c55e", icon: "Zap" },
            { label: "RAM", value: lastRam.toFixed(0), max: "100", unit: "%", data: ramData, color: "#f59e0b", icon: "Cpu" },
            { label: "Игроки", value: String(lastPlayers), max: "600", unit: "", data: playersData, color: "#0ea5e9", icon: "Users" },
          ].map((metric) => (
            <div key={metric.label} className="glass-card neon-border rounded-2xl p-5 overflow-hidden relative">
              <div className="absolute top-3 right-3">
                <span className="text-[10px] text-green-400/50 font-mono animate-blink">●</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <Icon name={metric.icon} size={14} style={{ color: metric.color }} />
                <span className="text-xs text-white/40 uppercase tracking-widest font-mono">{metric.label}</span>
              </div>
              <div className="font-display text-3xl font-bold mb-3" style={{ color: metric.color }}>
                {metric.value}<span className="text-lg">{metric.unit}</span>
                <span className="text-sm text-white/20 ml-2">/ {metric.max}</span>
              </div>
              <SparklineChart data={metric.data} color={metric.color} height={60} />
            </div>
          ))}
        </div>

        {/* Servers table */}
        <div className="glass-card neon-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-white uppercase tracking-wide">Серверы</h3>
            <button className="text-xs text-green-400 hover:text-green-300 transition-colors flex items-center gap-1">
              <Icon name="Plus" size={12} />
              Добавить сервер
            </button>
          </div>
          <div className="divide-y divide-white/5">
            {SERVERS.map((server, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4 hover:bg-white/2 transition-colors group">
                <StatusDot status={server.status as "online" | "offline"} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm">{server.name}</div>
                  <div className="text-xs text-white/30 font-mono">{server.ip}</div>
                </div>
                <div className="hidden sm:flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-white">{server.players}/{server.max}</div>
                    <div className="text-xs text-white/30">Игроки</div>
                  </div>
                  <div className="text-center">
                    <div className={`font-semibold ${server.tps >= 19 ? "text-green-400" : server.tps >= 15 ? "text-yellow-400" : "text-red-400"}`}>
                      {server.tps}
                    </div>
                    <div className="text-xs text-white/30">TPS</div>
                  </div>
                  <div className="hidden md:block w-24">
                    <div className="text-xs text-white/40 mb-1">RAM {server.ram}%</div>
                    <ProgressBar value={server.ram} />
                  </div>
                  <div className="text-center hidden lg:block">
                    <div className="text-green-400 font-semibold text-sm">{server.ping}ms</div>
                    <div className="text-xs text-white/30">Ping</div>
                  </div>
                </div>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/80">
                  <Icon name="ChevronRight" size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Секция: Тарифы ────────────────────────────────────────────────────────────

function PricingSection() {
  return (
    <section id="pricing" className="py-24 px-6 relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="text-green-400 text-xs font-mono uppercase tracking-widest mb-3">// Монетизация</div>
          <h2 className="font-display text-4xl font-bold text-white uppercase tracking-wide mb-4">Тарифы и планы</h2>
          <p className="text-white/40 max-w-xl mx-auto">Выбери план под масштаб твоего проекта. Начни бесплатно, расти без ограничений.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan, i) => (
            <div key={i} className={`relative rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] ${
              plan.popular ? "neon-border bg-green-500/5 shadow-[0_0_40px_rgba(34,197,94,0.15)]" : "glass-card border border-white/8"
            }`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-green-500 text-black text-xs font-bold rounded-full uppercase tracking-wider">
                  Популярный
                </div>
              )}
              <div className="mb-6">
                <div className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: plan.accent }}>{plan.name}</div>
                <div className="flex items-end gap-1 mb-1">
                  <span className="font-display text-4xl font-bold text-white">{plan.price}₽</span>
                  <span className="text-white/30 text-sm mb-1">/{plan.period}</span>
                </div>
                <div className="text-xs text-white/30">До {plan.servers} серверов</div>
              </div>
              <ul className="space-y-2.5 mb-8">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2.5 text-sm text-white/70">
                    <Icon name="Check" size={14} style={{ color: plan.accent }} className="flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                plan.popular ? "bg-green-500 text-black hover:bg-green-400 neon-glow" : "bg-white/8 text-white hover:bg-white/12 border border-white/10"
              }`}>
                {plan.name === "Старт" ? "Начать бесплатно" : "Выбрать план"}
              </button>
            </div>
          ))}
        </div>
        <div className="mt-8 glass-card border border-white/8 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-xl font-bold text-white uppercase tracking-wide">Корпоративный план</h3>
            <p className="text-white/40 text-sm mt-1">Неограниченные серверы, SLA, выделенный менеджер</p>
          </div>
          <button className="flex-shrink-0 px-6 py-3 border border-white/20 text-white rounded-xl hover:bg-white/5 font-semibold transition-colors">
            Связаться с нами
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Секция: Интеграции + Аналитика ───────────────────────────────────────────

function IntegrationsSection() {
  return (
    <section id="integrations" className="py-24 px-6 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <div className="text-green-400 text-xs font-mono uppercase tracking-widest mb-3">// Экосистема</div>
          <h2 className="font-display text-4xl font-bold text-white uppercase tracking-wide mb-4">Интеграции</h2>
          <p className="text-white/40 max-w-xl mx-auto">Подключи MCMonitor к любимым плагинам и сервисам в один клик</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          {INTEGRATIONS.map((item, i) => (
            <div key={i} className="glass-card border border-white/8 rounded-2xl p-5 flex flex-col items-center text-center gap-3 hover:border-white/16 hover:bg-white/4 transition-all duration-200 cursor-pointer group">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110" style={{ background: `${item.color}18`, border: `1px solid ${item.color}30` }}>
                <Icon name={item.icon} size={22} style={{ color: item.color }} />
              </div>
              <div>
                <div className="font-semibold text-white text-sm">{item.name}</div>
                <div className="text-xs text-white/35 mt-0.5 leading-relaxed">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Analytics bar chart */}
        <div className="glass-card neon-border rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-green-400 text-xs font-mono uppercase tracking-widest mb-1">// Аналитика</div>
              <h3 className="font-display text-2xl font-bold text-white uppercase">Отчёты по активности</h3>
            </div>
            <div className="flex gap-2">
              {["7д", "30д", "90д"].map((p, i) => (
                <button key={p} className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  i === 1 ? "bg-green-500/20 text-green-400 neon-border" : "text-white/40 hover:text-white/70 hover:bg-white/5"
                }`}>{p}</button>
              ))}
            </div>
          </div>
          <div className="flex items-end gap-2 h-28">
            {Array.from({ length: 30 }, (_, i) => {
              const h = 30 + Math.random() * 70;
              const isToday = i === 29;
              return (
                <div key={i} className="flex-1 rounded-t-sm transition-all duration-200 hover:opacity-80"
                  style={{
                    height: `${h}%`,
                    background: isToday ? "linear-gradient(to top, #22c55e, #86efac)" : "linear-gradient(to top, rgba(34,197,94,0.3), rgba(34,197,94,0.15))",
                    boxShadow: isToday ? "0 0 8px rgba(34,197,94,0.5)" : "none",
                  }}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-white/20 mt-2 font-mono">
            <span>30 дней назад</span>
            <span>Сегодня</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Секция: Контакты ──────────────────────────────────────────────────────────

function ContactSection() {
  return (
    <section id="contact" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <div className="text-green-400 text-xs font-mono uppercase tracking-widest mb-3">// Поддержка</div>
          <h2 className="font-display text-4xl font-bold text-white uppercase tracking-wide mb-4">Контакты</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-card neon-border rounded-2xl p-8">
            <h3 className="font-display text-xl font-bold text-white uppercase mb-6">Написать нам</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/40 uppercase tracking-widest font-mono mb-2 block">Имя</label>
                <input type="text" placeholder="Иван Петров" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-green-500/50 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-white/40 uppercase tracking-widest font-mono mb-2 block">Email</label>
                <input type="email" placeholder="ivan@example.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-green-500/50 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-white/40 uppercase tracking-widest font-mono mb-2 block">Сообщение</label>
                <textarea rows={4} placeholder="Опиши свою задачу..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-green-500/50 transition-colors resize-none" />
              </div>
              <button className="w-full py-3.5 bg-green-500 text-black font-bold rounded-xl hover:bg-green-400 neon-glow transition-all duration-200 hover:scale-[1.02]">
                Отправить сообщение
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { icon: "Send", color: "#229ED9", title: "Telegram поддержка", desc: "Ответим в течение часа", action: "@mcmonitor_support" },
              { icon: "MessageSquare", color: "#5865F2", title: "Discord сервер", desc: "Сообщество и помощь", action: "discord.gg/mcmonitor" },
              { icon: "Mail", color: "#22c55e", title: "Email", desc: "Для партнёрств и бизнеса", action: "hello@mcmonitor.ru" },
            ].map((ch, i) => (
              <div key={i} className="glass-card border border-white/8 rounded-2xl p-5 flex items-center gap-4 hover:border-white/16 transition-colors cursor-pointer group">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${ch.color}18`, border: `1px solid ${ch.color}30` }}>
                  <Icon name={ch.icon} size={20} style={{ color: ch.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm">{ch.title}</div>
                  <div className="text-xs text-white/40">{ch.desc}</div>
                  <div className="text-xs font-mono mt-0.5" style={{ color: ch.color }}>{ch.action}</div>
                </div>
                <Icon name="ArrowRight" size={16} className="text-white/20 group-hover:text-white/60 transition-colors" />
              </div>
            ))}
            <div className="glass-card border border-white/8 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Icon name="HelpCircle" size={16} className="text-green-400" />
                <span className="font-semibold text-white text-sm">Часто задаваемые вопросы</span>
              </div>
              {["Как добавить сервер?", "Как настроить алерты?", "Есть ли пробный период?"].map((q, i) => (
                <button key={i} className="w-full text-left text-xs text-white/40 hover:text-white/70 py-2 border-t border-white/5 transition-colors flex items-center justify-between gap-2">
                  {q}
                  <Icon name="ChevronRight" size={12} className="flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ────────────────────────────────────────────────────────────────────

function Footer({ onNav }: { onNav: (id: string) => void }) {
  return (
    <footer className="border-t border-white/5 py-10 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <button onClick={() => onNav("hero")} className="flex items-center gap-2">
          <span className="text-lg">⛏️</span>
          <span className="font-display font-bold text-white/70 tracking-wider">MC<span className="text-green-400">Monitor</span></span>
        </button>
        <div className="flex gap-6">
          {NAV_LINKS.map(l => (
            <button key={l.id} onClick={() => onNav(l.id)} className="text-xs text-white/30 hover:text-white/60 transition-colors">{l.label}</button>
          ))}
        </div>
        <div className="text-xs text-white/20">© 2024 MCMonitor</div>
      </div>
    </footer>
  );
}

// ─── Главный компонент ─────────────────────────────────────────────────────────

export default function Index() {
  const [activeSection, setActiveSection] = useState("hero");

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
    }
  };

  useEffect(() => {
    const sections = NAV_LINKS.map(l => document.getElementById(l.id)).filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver(
      entries => { entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id); }); },
      { threshold: 0.4 }
    );
    sections.forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar active={activeSection} onNav={scrollTo} />
      <HeroSection onNav={scrollTo} />
      <DashboardSection />
      <PricingSection />
      <IntegrationsSection />
      <ContactSection />
      <Footer onNav={scrollTo} />
    </div>
  );
}
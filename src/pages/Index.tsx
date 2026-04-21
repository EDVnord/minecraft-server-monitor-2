import { useState } from "react";
import Icon from "@/components/ui/icon";

// ─── Типы ─────────────────────────────────────────────────────────────────────

type ServerPlan = "free" | "standard" | "vip" | "premium";

interface Server {
  id: number;
  name: string;
  ip: string;
  desc: string;
  version: string;
  type: string[];
  online: number;
  max: number;
  votes: number;
  plan: ServerPlan;
  uptime: number;
  banner: string;
  new?: boolean;
}

// ─── Данные ───────────────────────────────────────────────────────────────────

const NAV = [
  { id: "home", label: "Каталог" },
  { id: "add", label: "Добавить сервер" },
  { id: "pricing", label: "Продвижение" },
];

const TICKER = [
  "⛏️ CraftRealm — 847 онлайн",
  "🗳️ PvPWorld получил 1200 голосов",
  "🆕 SkyBlock Paradise только что добавлен",
  "👑 TopMine — #1 в рейтинге",
  "🔥 HungerGames — 312 онлайн",
  "⚡ Новый сервер: MineCity добавлен сегодня",
  "🏆 FunCraft победитель месяца",
];

const TYPES = ["Все", "Выживание", "PvP", "SkyBlock", "Анархия", "Мини-игры", "Ролевой", "Творчество", "Хардкор"];

const SERVERS: Server[] = [
  {
    id: 1, name: "CraftRealm", ip: "play.craftrealm.ru",
    desc: "Крупнейший выживальный сервер СНГ с уникальной экономикой, кланами и регулярными ивентами. Играй с друзьями уже сегодня!",
    version: "1.20.4", type: ["Выживание", "Ролевой"], online: 847, max: 1500, votes: 4821,
    plan: "premium", uptime: 99.8,
    banner: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)",
    new: false,
  },
  {
    id: 2, name: "PvPWorld", ip: "pvpworld.su",
    desc: "Хардкорный PvP сервер с фракциями, рейдами и крутым лутом. Выживи или умри!",
    version: "1.20.1", type: ["PvP", "Анархия"], online: 312, max: 800, votes: 3102,
    plan: "vip", uptime: 98.5,
    banner: "linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #b91c1c 100%)",
    new: false,
  },
  {
    id: 3, name: "SkyBlock Paradise", ip: "skyblock.paradise-mc.ru",
    desc: "Лучший SkyBlock с уникальными островами, аукционом и глобальным рейтингом игроков.",
    version: "1.19.4", type: ["SkyBlock"], online: 523, max: 1000, votes: 2890,
    plan: "vip", uptime: 99.2,
    banner: "linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 50%, #3b82f6 100%)",
    new: false,
  },
  {
    id: 4, name: "MineCity", ip: "minecity.pro",
    desc: "Городской сервер с развитой экономикой, шахтами, рынком и своим государством.",
    version: "1.20.2", type: ["Выживание", "Ролевой"], online: 189, max: 500, votes: 1204,
    plan: "standard", uptime: 97.1,
    banner: "linear-gradient(135deg, #134e4a 0%, #0f766e 50%, #14b8a6 100%)",
    new: true,
  },
  {
    id: 5, name: "HungerGames RU", ip: "hg.mineplay.ru",
    desc: "Классические голодные игры на 24 игрока. Быстрые раунды, рейтинг, скины победителей.",
    version: "1.20.4", type: ["Мини-игры", "PvP"], online: 98, max: 300, votes: 876,
    plan: "standard", uptime: 96.3,
    banner: "linear-gradient(135deg, #451a03 0%, #92400e 50%, #d97706 100%)",
    new: false,
  },
  {
    id: 6, name: "AnarchyZone", ip: "anarchyzone.ru",
    desc: "Чистая анархия без правил и модераторов. Только ты, мир и другие игроки.",
    version: "1.20.1", type: ["Анархия"], online: 67, max: 200, votes: 543,
    plan: "free", uptime: 94.0,
    banner: "linear-gradient(135deg, #1c1917 0%, #292524 50%, #44403c 100%)",
    new: false,
  },
  {
    id: 7, name: "BuildCraft Pro", ip: "buildcraft.games",
    desc: "Творческий сервер с WorldEdit, плотами и конкурсами построек каждую неделю.",
    version: "1.20.4", type: ["Творчество"], online: 44, max: 200, votes: 321,
    plan: "free", uptime: 95.5,
    banner: "linear-gradient(135deg, #312e81 0%, #4338ca 50%, #6366f1 100%)",
    new: true,
  },
  {
    id: 8, name: "RPG Kingdom", ip: "rpgkingdom.ru",
    desc: "Полноценная RPG: классы, квесты, данжи, боссы и уникальная история мира.",
    version: "1.19.4", type: ["Ролевой"], online: 156, max: 400, votes: 1890,
    plan: "vip", uptime: 98.9,
    banner: "linear-gradient(135deg, #3b0764 0%, #6d28d9 50%, #8b5cf6 100%)",
    new: false,
  },
];

const PLANS = [
  {
    key: "free" as ServerPlan,
    name: "Бесплатно",
    price: "0",
    color: "#64748b",
    glow: false,
    features: [
      "Размещение в каталоге",
      "До 200 игроков",
      "Стандартная позиция",
      "Базовая статистика",
    ],
    cta: "Разместить бесплатно",
    highlight: false,
  },
  {
    key: "standard" as ServerPlan,
    name: "Стандарт",
    price: "499",
    color: "#22c55e",
    glow: false,
    features: [
      "Всё из Бесплатного",
      "Приоритет в поиске",
      "Баннер сервера",
      "До 1000 игроков",
      "Расширенная статистика",
    ],
    cta: "Выбрать план",
    highlight: false,
  },
  {
    key: "vip" as ServerPlan,
    name: "VIP",
    price: "1 299",
    color: "#f59e0b",
    glow: true,
    features: [
      "Всё из Стандарта",
      "Значок VIP на карточке",
      "Топ-3 в категории",
      "Выделение в списке",
      "Бонусные голоса ×2",
      "Уведомление подписчикам",
    ],
    cta: "Стать VIP",
    highlight: true,
  },
  {
    key: "premium" as ServerPlan,
    name: "Premium",
    price: "2 999",
    color: "#e879f9",
    glow: true,
    features: [
      "Всё из VIP",
      "Место #1 на главной",
      "Баннер-реклама на сайте",
      "Неограниченные игроки",
      "Персональный менеджер",
      "Брендированная страница",
    ],
    cta: "Получить Premium",
    highlight: false,
  },
];

// ─── Утилиты ──────────────────────────────────────────────────────────────────

const PLAN_LABEL: Record<ServerPlan, { label: string; color: string; glow: string }> = {
  free: { label: "", color: "", glow: "" },
  standard: { label: "⭐ Стандарт", color: "text-green-400 bg-green-500/12 border border-green-500/25", glow: "" },
  vip: { label: "👑 VIP", color: "text-amber-400 bg-amber-500/12 border border-amber-500/30", glow: "gold-border" },
  premium: { label: "💎 Premium", color: "text-fuchsia-400 bg-fuchsia-500/12 border border-fuchsia-500/30", glow: "" },
};

function OnlineBadge({ online, max }: { online: number; max: number }) {
  const pct = online / max;
  const color = pct > 0.8 ? "#ef4444" : pct > 0.5 ? "#f59e0b" : "#22c55e";
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
      <span className="text-xs font-mono text-white/70"><span className="text-white font-semibold">{online}</span>/{max}</span>
    </div>
  );
}

function VoteBar({ votes }: { votes: number }) {
  const max = 5000;
  const pct = Math.min(100, (votes / max) * 100);
  return (
    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
      <div className="h-full rounded-full bg-gradient-to-r from-amber-500/70 to-amber-400" style={{ width: `${pct}%`, transition: "width 1s ease" }} />
    </div>
  );
}

// ─── Карточка сервера ─────────────────────────────────────────────────────────

function ServerCard({ server, rank }: { server: Server; rank: number }) {
  const [voted, setVoted] = useState(false);
  const [voteCount, setVoteCount] = useState(server.votes);
  const plan = PLAN_LABEL[server.plan];
  const isPremium = server.plan === "premium";
  const isVip = server.plan === "vip";

  const handleVote = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!voted) { setVoted(true); setVoteCount(v => v + 1); }
  };

  return (
    <div className={`group relative rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.012] hover:-translate-y-0.5 cursor-pointer ${
      isPremium ? "neon-border shadow-[0_0_30px_rgba(34,197,94,0.12)]" :
      isVip ? "gold-border shadow-[0_0_20px_rgba(245,158,11,0.08)]" :
      "glass-card hover:border-white/14"
    }`}>
      {/* Баннер */}
      <div className="h-20 relative overflow-hidden" style={{ background: server.banner }}>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
        {/* Ранг */}
        <div className={`absolute top-3 left-3 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-display ${
          rank === 1 ? "bg-amber-500 text-black" :
          rank === 2 ? "bg-slate-400 text-black" :
          rank === 3 ? "bg-amber-700 text-white" :
          "bg-black/40 text-white/70 border border-white/15"
        }`}>
          {rank}
        </div>
        {server.new && (
          <div className="absolute top-3 right-3 px-2 py-0.5 bg-green-500 text-black text-[10px] font-bold rounded-full uppercase tracking-wide">
            Новый
          </div>
        )}
        {plan.label && (
          <div className={`absolute bottom-2 right-3 px-2 py-0.5 text-[10px] font-semibold rounded-full ${plan.color}`}>
            {plan.label}
          </div>
        )}
      </div>

      {/* Контент */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <h3 className="font-display text-base font-bold text-white uppercase tracking-wide truncate group-hover:text-green-300 transition-colors">
              {server.name}
            </h3>
            <div className="text-[11px] text-white/35 font-mono truncate">{server.ip}</div>
          </div>
          <OnlineBadge online={server.online} max={server.max} />
        </div>

        <p className="text-xs text-white/50 leading-relaxed mb-3 line-clamp-2">{server.desc}</p>

        {/* Теги */}
        <div className="flex flex-wrap gap-1 mb-3">
          <span className="px-2 py-0.5 bg-white/5 border border-white/8 rounded-md text-[10px] text-white/40 font-mono">
            {server.version}
          </span>
          {server.type.slice(0, 2).map(t => (
            <span key={t} className="px-2 py-0.5 bg-green-500/8 border border-green-500/18 rounded-md text-[10px] text-green-400/70">
              {t}
            </span>
          ))}
        </div>

        {/* Голоса */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-white/30 font-mono">Голоса</span>
            <span className="text-[10px] text-amber-400 font-semibold">{voteCount.toLocaleString("ru")}</span>
          </div>
          <VoteBar votes={voteCount} />
        </div>

        {/* Действия */}
        <div className="flex gap-2">
          <button
            onClick={handleVote}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${
              voted
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : "bg-white/6 text-white/70 border border-white/10 hover:bg-amber-500/12 hover:text-amber-400 hover:border-amber-500/25"
            }`}
          >
            <Icon name={voted ? "ThumbsUp" : "ThumbsUp"} size={12} />
            {voted ? "Голос засчитан" : "Голосовать"}
          </button>
          <button className="flex-1 py-2 rounded-xl text-xs font-semibold bg-green-500/12 text-green-400 border border-green-500/25 hover:bg-green-500/20 transition-all duration-200 flex items-center justify-center gap-1.5">
            <Icon name="ExternalLink" size={12} />
            Подробнее
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Навбар ────────────────────────────────────────────────────────────────────

function Navbar({ page, setPage }: { page: string; setPage: (p: string) => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useState(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  });

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "py-2 bg-[#080c10]/95 backdrop-blur-xl border-b border-white/5" : "py-4"}`}>
      <div className="max-w-7xl mx-auto px-5 flex items-center justify-between">
        {/* Лого */}
        <button onClick={() => setPage("home")} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-green-500/18 neon-border flex items-center justify-center text-base">⛏️</div>
          <span className="font-display text-lg font-bold text-white tracking-wider">
            Mine<span className="neon-text">Top</span>
          </span>
        </button>

        {/* Десктоп */}
        <div className="hidden md:flex items-center gap-1">
          {NAV.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                page === n.id ? "text-green-400 bg-green-500/10 neon-border" : "text-white/55 hover:text-white/85 hover:bg-white/5"
              }`}
            >{n.label}</button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button onClick={() => setPage("add")} className="px-5 py-2 bg-green-500 text-black font-bold text-sm rounded-xl hover:bg-green-400 neon-glow transition-all hover:scale-105">
            + Добавить сервер
          </button>
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden text-white/60 hover:text-white">
          <Icon name={open ? "X" : "Menu"} size={22} />
        </button>
      </div>

      {open && (
        <div className="md:hidden mt-2 mx-4 rounded-xl bg-[#0d1117] border border-white/8 p-3 space-y-1">
          {NAV.map(n => (
            <button key={n.id} onClick={() => { setPage(n.id); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-white/75 hover:bg-white/5">
              {n.label}
            </button>
          ))}
          <div className="pt-2 border-t border-white/5">
            <button onClick={() => { setPage("add"); setOpen(false); }} className="w-full py-2.5 bg-green-500 text-black font-bold text-sm rounded-xl">
              + Добавить сервер
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

// ─── Страница: Каталог ────────────────────────────────────────────────────────

function HomePage({ setPage }: { setPage: (p: string) => void }) {
  const [activeType, setActiveType] = useState("Все");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"votes" | "online" | "new">("votes");

  const filtered = SERVERS
    .filter(s => {
      const matchType = activeType === "Все" || s.type.includes(activeType);
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.ip.toLowerCase().includes(search.toLowerCase());
      return matchType && matchSearch;
    })
    .sort((a, b) => {
      // Premium и VIP всегда выше
      const planOrder: Record<ServerPlan, number> = { premium: 0, vip: 1, standard: 2, free: 3 };
      const planDiff = planOrder[a.plan] - planOrder[b.plan];
      if (planDiff !== 0) return planDiff;
      if (sort === "votes") return b.votes - a.votes;
      if (sort === "online") return b.online - a.online;
      return (b.new ? 1 : 0) - (a.new ? 1 : 0);
    });

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative pt-28 pb-16 px-5 grid-bg overflow-hidden">
        <div className="absolute top-20 left-1/3 w-80 h-80 bg-green-500/7 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-emerald-400/5 rounded-full blur-3xl pointer-events-none" />

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
            {SERVERS.reduce((a, s) => a + s.online, 0).toLocaleString("ru")} игроков онлайн прямо сейчас
          </div>

          <h1 className="font-display text-5xl md:text-6xl font-bold text-white uppercase tracking-wide mb-4 slide-up d1">
            Найди свой<br /><span className="neon-text">Minecraft сервер</span>
          </h1>

          <p className="text-white/45 text-base max-w-xl mx-auto mb-8 slide-up d2">
            Каталог лучших серверов СНГ. Голосуй, продвигай, играй.
          </p>

          {/* Поиск */}
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

          {/* Статы */}
          <div className="flex justify-center gap-8 mt-8 slide-up d4">
            {[
              { v: SERVERS.length, label: "серверов" },
              { v: SERVERS.reduce((a, s) => a + s.online, 0).toLocaleString("ru"), label: "онлайн" },
              { v: SERVERS.reduce((a, s) => a + s.votes, 0).toLocaleString("ru"), label: "голосов" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="font-display text-2xl font-bold neon-text">{s.v}</div>
                <div className="text-xs text-white/35">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Фильтры */}
      <section className="px-5 py-6 border-b border-white/5 sticky top-[60px] z-30 bg-[#080c10]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {TYPES.map(t => (
              <button key={t} onClick={() => setActiveType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  activeType === t
                    ? "bg-green-500/18 text-green-400 neon-border"
                    : "bg-white/4 text-white/45 border border-white/7 hover:text-white/70 hover:bg-white/7"
                }`}
              >{t}</button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-white/30">Сортировка:</span>
            {(["votes", "online", "new"] as const).map(s => (
              <button key={s} onClick={() => setSort(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  sort === s ? "bg-green-500/18 text-green-400 neon-border" : "text-white/40 hover:text-white/60 hover:bg-white/5"
                }`}
              >
                {s === "votes" ? "Голоса" : s === "online" ? "Онлайн" : "Новые"}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Сетка серверов */}
      <section className="px-5 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Баннер рекламный (Premium место) */}
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
            <button onClick={() => setPage("pricing")} className="relative z-10 flex-shrink-0 px-6 py-2.5 bg-green-500 text-black font-bold text-sm rounded-xl hover:bg-green-400 neon-glow transition-all hover:scale-105">
              Разместить рекламу
            </button>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20 text-white/30">
              <Icon name="SearchX" size={40} className="mx-auto mb-3 opacity-40" />
              <p>Серверы не найдены</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((server, i) => (
                <ServerCard key={server.id} server={server} rank={i + 1} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// ─── Страница: Добавить сервер ────────────────────────────────────────────────

function AddServerPage({ setPage }: { setPage: (p: string) => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", ip: "", version: "", type: "", desc: "", discord: "", site: "" });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="min-h-screen pt-28 pb-16 px-5">
      <div className="max-w-2xl mx-auto">
        {/* Заголовок */}
        <div className="text-center mb-10">
          <div className="text-green-400 text-xs font-mono uppercase tracking-widest mb-2">// Регистрация</div>
          <h2 className="font-display text-4xl font-bold text-white uppercase tracking-wide mb-2">Добавить сервер</h2>
          <p className="text-white/40 text-sm">Базовое размещение бесплатно. Платное продвижение — выше в топе.</p>
        </div>

        {/* Шаги */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step >= s ? "bg-green-500 text-black neon-glow" : "bg-white/8 text-white/30 border border-white/10"
              }`}>{s}</div>
              {s < 3 && <div className={`w-12 h-px transition-all ${step > s ? "bg-green-500" : "bg-white/10"}`} />}
            </div>
          ))}
        </div>

        <div className="glass-card neon-border rounded-2xl p-7">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-display text-xl font-bold text-white uppercase mb-4">Основная информация</h3>
              {[
                { key: "name", label: "Название сервера", placeholder: "Мой крутой сервер" },
                { key: "ip", label: "IP-адрес", placeholder: "play.myserver.ru" },
                { key: "version", label: "Версия Minecraft", placeholder: "1.20.4" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-white/40 uppercase tracking-widest font-mono mb-2 block">{f.label}</label>
                  <input
                    type="text"
                    placeholder={f.placeholder}
                    value={form[f.key as keyof typeof form]}
                    onChange={e => set(f.key, e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-green-500/45 transition-colors"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs text-white/40 uppercase tracking-widest font-mono mb-2 block">Тип сервера</label>
                <select
                  value={form.type}
                  onChange={e => set("type", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-green-500/45 transition-colors"
                >
                  <option value="" className="bg-[#0d1117]">Выбрать тип...</option>
                  {TYPES.slice(1).map(t => <option key={t} value={t} className="bg-[#0d1117]">{t}</option>)}
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-display text-xl font-bold text-white uppercase mb-4">Описание и ссылки</h3>
              <div>
                <label className="text-xs text-white/40 uppercase tracking-widest font-mono mb-2 block">Описание сервера</label>
                <textarea
                  rows={5}
                  placeholder="Расскажи об особенностях, режимах, ивентах..."
                  value={form.desc}
                  onChange={e => set("desc", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-green-500/45 resize-none transition-colors"
                />
              </div>
              {[
                { key: "discord", label: "Discord сервер", placeholder: "discord.gg/myserver" },
                { key: "site", label: "Сайт (необязательно)", placeholder: "https://myserver.ru" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-white/40 uppercase tracking-widest font-mono mb-2 block">{f.label}</label>
                  <input
                    type="text"
                    placeholder={f.placeholder}
                    value={form[f.key as keyof typeof form]}
                    onChange={e => set(f.key, e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-green-500/45 transition-colors"
                  />
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-display text-xl font-bold text-white uppercase mb-4">Выбери план</h3>
              <p className="text-white/40 text-sm mb-5">Начни бесплатно или сразу выбери продвижение, чтобы получить больше игроков.</p>
              <div className="grid grid-cols-2 gap-3">
                {PLANS.map(p => (
                  <div key={p.key} className={`rounded-xl p-4 border cursor-pointer transition-all hover:scale-[1.02] ${
                    p.highlight ? "gold-border bg-amber-500/5" : "border-white/10 bg-white/3 hover:border-white/20"
                  }`}>
                    {p.highlight && <div className="text-[10px] text-amber-400 font-bold mb-1 uppercase tracking-wider">★ Популярный</div>}
                    <div className="font-display font-bold text-white text-sm uppercase" style={{ color: p.color }}>{p.name}</div>
                    <div className="font-bold text-white text-xl mt-1">{p.price === "0" ? "Бесплатно" : `${p.price}₽/мес`}</div>
                    <ul className="mt-2 space-y-1">
                      {p.features.slice(0, 3).map((f, i) => (
                        <li key={i} className="text-[11px] text-white/45 flex items-center gap-1.5">
                          <Icon name="Check" size={10} style={{ color: p.color }} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Кнопки */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} className="px-5 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-semibold hover:bg-white/5 transition-colors">
                Назад
              </button>
            )}
            {step < 3 ? (
              <button onClick={() => setStep(s => s + 1)} className="flex-1 py-3 bg-green-500 text-black font-bold rounded-xl hover:bg-green-400 neon-glow transition-all text-sm">
                Далее →
              </button>
            ) : (
              <button className="flex-1 py-3 bg-green-500 text-black font-bold rounded-xl hover:bg-green-400 neon-glow transition-all text-sm">
                Разместить сервер
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Страница: Тарифы/Продвижение ─────────────────────────────────────────────

function PricingPage({ setPage }: { setPage: (p: string) => void }) {
  return (
    <div className="min-h-screen pt-28 pb-16 px-5">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <div className="text-green-400 text-xs font-mono uppercase tracking-widest mb-3">// Монетизация</div>
          <h2 className="font-display text-5xl font-bold text-white uppercase tracking-wide mb-3">
            Продвижение сервера
          </h2>
          <p className="text-white/40 max-w-xl mx-auto text-sm leading-relaxed">
            Больше игроков — больше голосов — выше в рейтинге. Выбери пакет и прокачай свой сервер.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {PLANS.map(plan => (
            <div key={plan.key} className={`relative rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 flex flex-col ${
              plan.highlight
                ? "gold-border bg-amber-500/4 shadow-[0_0_30px_rgba(245,158,11,0.1)]"
                : "glass-card border border-white/8"
            }`}>
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-amber-500 text-black text-[11px] font-bold rounded-full uppercase tracking-wide whitespace-nowrap">
                  Выбор владельцев
                </div>
              )}
              <div className="mb-5">
                <div className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: plan.color }}>{plan.name}</div>
                <div className="font-display text-3xl font-bold text-white">
                  {plan.price === "0" ? "0₽" : `${plan.price}₽`}
                </div>
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
                onClick={() => setPage("add")}
                className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                  plan.highlight
                    ? "bg-amber-500 text-black hover:bg-amber-400 gold-glow"
                    : plan.price === "0"
                    ? "bg-white/8 text-white border border-white/12 hover:bg-white/12"
                    : "text-black font-bold hover:opacity-90"
                }`}
                style={!plan.highlight && plan.price !== "0" ? { background: plan.color } : {}}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Сравнение */}
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
                    <th key={p.key} className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider" style={{ color: p.color }}>
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {[
                  ["Размещение в каталоге", true, true, true, true],
                  ["Баннер сервера", false, true, true, true],
                  ["Приоритет в поиске", false, true, true, true],
                  ["Позиция в топе", "Случайная", "Топ-20", "Топ-3", "#1"],
                  ["Бонус голосов", "×1", "×1", "×2", "×3"],
                  ["Рекламный баннер", false, false, false, true],
                  ["Персональный менеджер", false, false, false, true],
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-white/2 transition-colors">
                    <td className="px-6 py-3 text-white/50 text-xs">{row[0]}</td>
                    {[1, 2, 3, 4].map(j => (
                      <td key={j} className="px-4 py-3 text-center">
                        {typeof row[j] === "boolean" ? (
                          row[j]
                            ? <Icon name="Check" size={14} className="mx-auto text-green-400" />
                            : <Icon name="Minus" size={14} className="mx-auto text-white/15" />
                        ) : (
                          <span className="text-xs text-white/55">{row[j]}</span>
                        )}
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
            { q: "Можно платить помесячно?", a: "Да, все платные планы оплачиваются ежемесячно. Отменить можно в любой момент." },
            { q: "Как считаются голоса?", a: "Каждый игрок может голосовать раз в 24 часа. VIP и Premium дают бонусный множитель." },
            { q: "Когда сервер появится в каталоге?", a: "Бесплатные серверы проходят модерацию до 24 часов. Платные — в течение 1 часа." },
            { q: "Есть ли реферальная программа?", a: "Да! Приведи владельца сервера и получи 20% от его первой оплаты." },
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

// ─── Footer ────────────────────────────────────────────────────────────────────

function Footer({ setPage }: { setPage: (p: string) => void }) {
  return (
    <footer className="border-t border-white/5 py-8 px-5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <button onClick={() => setPage("home")} className="flex items-center gap-2">
          <span>⛏️</span>
          <span className="font-display font-bold text-white/60 tracking-wider">Mine<span className="text-green-400">Top</span></span>
        </button>
        <div className="flex gap-6 text-xs text-white/25">
          <button onClick={() => setPage("home")} className="hover:text-white/50 transition-colors">Каталог</button>
          <button onClick={() => setPage("add")} className="hover:text-white/50 transition-colors">Добавить сервер</button>
          <button onClick={() => setPage("pricing")} className="hover:text-white/50 transition-colors">Тарифы</button>
          <span>Правила</span>
          <span>Поддержка</span>
        </div>
        <div className="text-xs text-white/18">© 2024 MineTop.ru</div>
      </div>
    </footer>
  );
}

// ─── Главный компонент ─────────────────────────────────────────────────────────

export default function Index() {
  const [page, setPage] = useState("home");

  return (
    <div className="min-h-screen bg-background">
      <Navbar page={page} setPage={setPage} />
      {page === "home" && <HomePage setPage={setPage} />}
      {page === "add" && <AddServerPage setPage={setPage} />}
      {page === "pricing" && <PricingPage setPage={setPage} />}
      <Footer setPage={setPage} />
    </div>
  );
}

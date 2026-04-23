"""
API каталога Minecraft-серверов + авторизация + оплата тарифов через ЮКассу.

GET  /              — список серверов
POST /              — добавить сервер
PUT  /{id}          — редактировать сервер (только владелец)
POST /vote          — голосовать за сервер
POST /auth/send     — отправить код на email
POST /auth/verify   — проверить код, получить токен
GET  /auth/me       — профиль + мои серверы
POST /auth/logout   — выйти
POST /pay/init      — создать платёж ЮКасса
POST /pay/notify    — вебхук ЮКасса
GET  /pay/status    — статус заказа
"""
import base64
import json
import os
import random
import secrets
import smtplib
import urllib.request
import psycopg2
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}

YOOKASSA_API = "https://api.yookassa.ru/v3"

PLAN_PRICES = {
    "standard": "499.00",
    "vip":      "1299.00",
    "premium":  "2999.00",
}

PLAN_NAMES = {
    "standard": "Тариф Стандарт — продвижение сервера MineTop",
    "vip":      "Тариф VIP — продвижение сервера MineTop",
    "premium":  "Тариф Premium — продвижение сервера MineTop",
}

BANNER_COLORS = [
    "linear-gradient(135deg,#064e3b,#065f46,#047857)",
    "linear-gradient(135deg,#1e3a5f,#1d4ed8,#3b82f6)",
    "linear-gradient(135deg,#3b0764,#6d28d9,#8b5cf6)",
    "linear-gradient(135deg,#7f1d1d,#991b1b,#b91c1c)",
    "linear-gradient(135deg,#134e4a,#0f766e,#14b8a6)",
    "linear-gradient(135deg,#451a03,#92400e,#d97706)",
    "linear-gradient(135deg,#312e81,#4338ca,#6366f1)",
    "linear-gradient(135deg,#1c1917,#292524,#44403c)",
]


# ─── DB ───────────────────────────────────────────────────────────────────────

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def send_code_email(to_email: str, code: str):
    host     = os.environ["SMTP_HOST"]
    port     = int(os.environ.get("SMTP_PORT", "465"))
    user     = os.environ["SMTP_USER"]
    password = os.environ["SMTP_PASSWORD"]
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Твой код входа в MineED: {code}"
    msg["From"]    = f"MineED <{user}>"
    msg["To"]      = to_email
    html = f"""<div style="font-family:sans-serif;background:#0d1117;padding:40px;border-radius:12px;max-width:480px;margin:0 auto">
      <div style="font-size:22px;font-weight:900;color:#fff;letter-spacing:2px;margin-bottom:8px">Mine<span style="color:#22c55e">ED</span></div>
      <div style="color:#9ca3af;font-size:13px;margin-bottom:32px">Каталог Minecraft серверов</div>
      <div style="color:#fff;font-size:15px;margin-bottom:24px">Твой код для входа:</div>
      <div style="background:#1f2937;border:1px solid #374151;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
        <span style="font-size:40px;font-weight:900;color:#22c55e;letter-spacing:12px">{code}</span>
      </div>
      <div style="color:#6b7280;font-size:12px">Код действует 10 минут. Если не запрашивал — проигнорируй.</div>
    </div>"""
    msg.attach(MIMEText(html, "html"))
    if port == 465:
        with smtplib.SMTP_SSL(host, port) as s:
            s.login(user, password); s.sendmail(user, to_email, msg.as_string())
    else:
        with smtplib.SMTP(host, port) as s:
            s.starttls(); s.login(user, password); s.sendmail(user, to_email, msg.as_string())


def get_user_by_token(cur, token: str):
    cur.execute("""
        SELECT u.id, u.email, u.created_at FROM sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.token = %s AND s.expires_at > NOW()
    """, (token,))
    row = cur.fetchone()
    if not row:
        return None
    return {"id": row[0], "email": row[1], "created_at": row[2].isoformat()}


def ensure_tables(cur):
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id         SERIAL PRIMARY KEY,
            email      VARCHAR(200) UNIQUE NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS auth_codes (
            id         SERIAL PRIMARY KEY,
            email      VARCHAR(200) NOT NULL,
            code       VARCHAR(6)   NOT NULL,
            used       BOOLEAN      NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id         SERIAL PRIMARY KEY,
            user_id    INTEGER NOT NULL REFERENCES users(id),
            token      VARCHAR(64) UNIQUE NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS servers (
            id           SERIAL PRIMARY KEY,
            name         VARCHAR(100) NOT NULL,
            ip           VARCHAR(100) NOT NULL,
            version      VARCHAR(20)  NOT NULL DEFAULT '1.20.4',
            type         VARCHAR(50)  NOT NULL DEFAULT 'Выживание',
            description  TEXT         NOT NULL DEFAULT '',
            discord      VARCHAR(200) DEFAULT '',
            site         VARCHAR(200) DEFAULT '',
            plan         VARCHAR(20)  NOT NULL DEFAULT 'free',
            votes        INTEGER      NOT NULL DEFAULT 0,
            online       INTEGER      NOT NULL DEFAULT 0,
            max_players  INTEGER      NOT NULL DEFAULT 100,
            uptime       NUMERIC(4,1) NOT NULL DEFAULT 100.0,
            banner_color VARCHAR(200) DEFAULT 'linear-gradient(135deg,#064e3b,#065f46)',
            created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
            user_id      INTEGER
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS server_votes (
            id        SERIAL PRIMARY KEY,
            server_id INTEGER NOT NULL REFERENCES servers(id),
            voter_ip  VARCHAR(60) NOT NULL,
            voted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    cur.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS server_votes_unique_daily
        ON server_votes (server_id, voter_ip, DATE(voted_at))
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id          SERIAL PRIMARY KEY,
            order_id    VARCHAR(64) UNIQUE NOT NULL,
            server_id   INTEGER,
            plan        VARCHAR(20) NOT NULL,
            amount      VARCHAR(10) NOT NULL,
            status      VARCHAR(20) NOT NULL DEFAULT 'pending',
            payment_id  VARCHAR(64),
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            paid_at     TIMESTAMPTZ
        )
    """)


def seed_demo(cur):
    cur.execute("SELECT COUNT(*) FROM servers")
    if cur.fetchone()[0] > 0:
        return
    demo = [
        ("CraftRealm",        "play.craftrealm.ru",     "1.20.4", "Выживание", "Крупнейший выживальный сервер СНГ с уникальной экономикой, кланами и регулярными ивентами.", "premium", 4821, 847, 1500, 99.8, BANNER_COLORS[0]),
        ("PvPWorld",          "pvpworld.su",             "1.20.1", "PvP",       "Хардкорный PvP сервер с фракциями, рейдами и крутым лутом. Выживи или умри!",                "vip",     3102, 312,  800, 98.5, BANNER_COLORS[3]),
        ("SkyBlock Paradise", "skyblock.paradise-mc.ru", "1.19.4", "SkyBlock",  "Лучший SkyBlock с уникальными островами, аукционом и глобальным рейтингом игроков.",         "vip",     2890, 523, 1000, 99.2, BANNER_COLORS[1]),
        ("RPG Kingdom",       "rpgkingdom.ru",           "1.19.4", "Ролевой",   "Полноценная RPG: классы, квесты, данжи, боссы и уникальная история мира.",                   "vip",     1890, 156,  400, 98.9, BANNER_COLORS[2]),
        ("MineCity",          "minecity.pro",            "1.20.2", "Выживание", "Городской сервер с развитой экономикой, шахтами, рынком и своим государством.",               "standard",1204, 189,  500, 97.1, BANNER_COLORS[4]),
        ("HungerGames RU",    "hg.mineplay.ru",          "1.20.4", "Мини-игры", "Классические голодные игры на 24 игрока. Быстрые раунды, рейтинг, скины победителей.",        "standard", 876,  98,  300, 96.3, BANNER_COLORS[5]),
        ("AnarchyZone",       "anarchyzone.ru",          "1.20.1", "Анархия",   "Чистая анархия без правил и модераторов. Только ты, мир и другие игроки.",                   "free",      543,  67,  200, 94.0, BANNER_COLORS[7]),
        ("BuildCraft Pro",    "buildcraft.games",        "1.20.4", "Творчество","Творческий сервер с WorldEdit, плотами и конкурсами построек каждую неделю.",                 "free",      321,  44,  200, 95.5, BANNER_COLORS[6]),
    ]
    for row in demo:
        cur.execute(
            "INSERT INTO servers (name,ip,version,type,description,plan,votes,online,max_players,uptime,banner_color) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
            row,
        )


# ─── ЮКасса ──────────────────────────────────────────────────────────────────

def yookassa_request(endpoint: str, payload: dict, idempotence_key: str) -> dict:
    shop_id    = os.environ["YOOKASSA_SHOP_ID"]
    secret_key = os.environ["YOOKASSA_SECRET_KEY"]
    creds      = base64.b64encode(f"{shop_id}:{secret_key}".encode()).decode()

    data = json.dumps(payload).encode()
    req  = urllib.request.Request(
        f"{YOOKASSA_API}/{endpoint}",
        data=data,
        headers={
            "Content-Type":    "application/json",
            "Authorization":   f"Basic {creds}",
            "Idempotence-Key": idempotence_key,
        },
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read())


# ─── Handler ──────────────────────────────────────────────────────────────────

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method  = event.get("httpMethod", "GET")
    path    = event.get("path", "/").rstrip("/")
    ip      = (event.get("requestContext") or {}).get("identity", {}).get("sourceIp", "0.0.0.0")
    headers = event.get("headers") or {}
    token   = headers.get("X-Auth-Token") or headers.get("x-auth-token", "")

    conn = get_conn()
    try:
        with conn:
            with conn.cursor() as cur:
                ensure_tables(cur)
                seed_demo(cur)

                # ── POST /auth/send — отправить код на email ─────────────
                if method == "POST" and path.endswith("/auth/send"):
                    body  = json.loads(event.get("body") or "{}")
                    email = (body.get("email") or "").strip().lower()
                    if not email or "@" not in email:
                        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Некорректный email"})}
                    cur.execute("SELECT COUNT(*) FROM auth_codes WHERE email=%s AND created_at > NOW() - INTERVAL '1 minute'", (email,))
                    if cur.fetchone()[0] > 0:
                        return {"statusCode": 429, "headers": CORS, "body": json.dumps({"error": "Подожди минуту"})}
                    code = str(random.randint(100000, 999999))
                    cur.execute("INSERT INTO auth_codes (email, code) VALUES (%s, %s)", (email, code))
                    conn.commit()
                    send_code_email(email, code)
                    return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

                # ── POST /auth/verify — проверить код ─────────────────────
                if method == "POST" and path.endswith("/auth/verify"):
                    body  = json.loads(event.get("body") or "{}")
                    email = (body.get("email") or "").strip().lower()
                    code  = (body.get("code") or "").strip()
                    cur.execute("""
                        SELECT id FROM auth_codes
                        WHERE email=%s AND code=%s AND used=FALSE AND created_at > NOW() - INTERVAL '10 minutes'
                        ORDER BY created_at DESC LIMIT 1
                    """, (email, code))
                    row = cur.fetchone()
                    if not row:
                        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Неверный или просроченный код"})}
                    cur.execute("UPDATE auth_codes SET used=TRUE WHERE id=%s", (row[0],))
                    cur.execute("INSERT INTO users (email) VALUES (%s) ON CONFLICT (email) DO UPDATE SET email=EXCLUDED.email RETURNING id", (email,))
                    user_id = cur.fetchone()[0]
                    session_token = secrets.token_hex(32)
                    cur.execute("INSERT INTO sessions (user_id, token) VALUES (%s, %s)", (user_id, session_token))
                    return {"statusCode": 200, "headers": CORS, "body": json.dumps({"token": session_token, "email": email})}

                # ── GET /auth/me — профиль + серверы пользователя ────────
                if method == "GET" and path.endswith("/auth/me"):
                    if not token:
                        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Не авторизован"})}
                    user = get_user_by_token(cur, token)
                    if not user:
                        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Сессия истекла"})}
                    cur.execute("""
                        SELECT id,name,ip,version,type,plan,votes,online,max_players,banner_color,created_at,description,discord,site
                        FROM servers WHERE user_id=%s ORDER BY created_at DESC
                    """, (user["id"],))
                    cols = ["id","name","ip","version","type","plan","votes","online","max_players","banner_color","created_at","description","discord","site"]
                    servers = [dict(zip(cols, r)) for r in cur.fetchall()]
                    for s in servers:
                        s["created_at"] = s["created_at"].isoformat()
                    return {"statusCode": 200, "headers": CORS, "body": json.dumps({"user": user, "servers": servers})}

                # ── POST /auth/logout — выйти ─────────────────────────────
                if method == "POST" and path.endswith("/auth/logout"):
                    if token:
                        cur.execute("UPDATE sessions SET expires_at=NOW() WHERE token=%s", (token,))
                    return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

                # ── GET /widget — данные для виджета ─────────────────────
                if method == "GET" and path.endswith("/widget"):
                    server_id = (event.get("queryStringParameters") or {}).get("id")
                    if not server_id:
                        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "id обязателен"})}
                    cur.execute(
                        "SELECT id,name,ip,plan,votes,online,max_players,uptime,banner_color FROM servers WHERE id = %s",
                        (int(server_id),)
                    )
                    row = cur.fetchone()
                    if not row:
                        return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Сервер не найден"})}
                    cols = ["id","name","ip","plan","votes","online","max_players","uptime","banner_color"]
                    s = dict(zip(cols, row))
                    s["uptime"] = float(s["uptime"])
                    s["online_status"] = "online" if s["online"] > 0 else "offline"
                    return {"statusCode": 200, "headers": CORS, "body": json.dumps({"server": s})}

                # ── GET / — список серверов ───────────────────────────────
                if method == "GET" and path in ("", "/"):
                    type_filter = (event.get("queryStringParameters") or {}).get("type", "")
                    sort_by     = (event.get("queryStringParameters") or {}).get("sort", "votes")
                    search      = (event.get("queryStringParameters") or {}).get("q", "")

                    order = {
                        "votes":  "CASE plan WHEN 'premium' THEN 0 WHEN 'vip' THEN 1 WHEN 'standard' THEN 2 ELSE 3 END, votes DESC",
                        "online": "CASE plan WHEN 'premium' THEN 0 WHEN 'vip' THEN 1 WHEN 'standard' THEN 2 ELSE 3 END, online DESC",
                        "new":    "CASE plan WHEN 'premium' THEN 0 WHEN 'vip' THEN 1 WHEN 'standard' THEN 2 ELSE 3 END, created_at DESC",
                    }.get(sort_by, "votes DESC")

                    where_clauses, params = [], []
                    if type_filter and type_filter != "Все":
                        where_clauses.append("type = %s")
                        params.append(type_filter)
                    if search:
                        where_clauses.append("(name ILIKE %s OR ip ILIKE %s)")
                        params += [f"%{search}%", f"%{search}%"]

                    where_sql = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""
                    cur.execute(
                        f"SELECT id,name,ip,version,type,description,discord,site,plan,votes,online,max_players,uptime,banner_color,created_at FROM servers {where_sql} ORDER BY {order}",
                        params,
                    )
                    cols = ["id","name","ip","version","type","description","discord","site","plan","votes","online","max_players","uptime","banner_color","created_at"]
                    servers = []
                    for r in cur.fetchall():
                        s = dict(zip(cols, r))
                        s["uptime"]     = float(s["uptime"])
                        s["created_at"] = s["created_at"].isoformat()
                        servers.append(s)
                    return {"statusCode": 200, "headers": CORS, "body": json.dumps({"servers": servers, "total": len(servers)})}

                # ── POST / — добавить сервер ──────────────────────────────
                if method == "POST" and path in ("", "/"):
                    body    = json.loads(event.get("body") or "{}")
                    name    = (body.get("name") or "").strip()[:100]
                    ip_addr = (body.get("ip") or "").strip()[:100]
                    version = (body.get("version") or "1.20.4").strip()[:20]
                    stype   = (body.get("type") or "Выживание").strip()[:50]
                    desc    = (body.get("description") or "").strip()[:2000]
                    discord = (body.get("discord") or "").strip()[:200]
                    site    = (body.get("site") or "").strip()[:200]

                    if not name or not ip_addr:
                        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "name и ip обязательны"})}

                    # Привязываем сервер к пользователю если токен передан
                    user_id = None
                    if token:
                        cur.execute("""
                            SELECT u.id FROM sessions s JOIN users u ON u.id = s.user_id
                            WHERE s.token = %s AND s.expires_at > NOW()
                        """, (token,))
                        row = cur.fetchone()
                        if row:
                            user_id = row[0]

                    banner = random.choice(BANNER_COLORS)
                    cur.execute(
                        "INSERT INTO servers (name,ip,version,type,description,discord,site,plan,banner_color,user_id) VALUES (%s,%s,%s,%s,%s,%s,%s,'free',%s,%s) RETURNING id",
                        (name, ip_addr, version, stype, desc, discord, site, banner, user_id),
                    )
                    new_id = cur.fetchone()[0]
                    return {"statusCode": 201, "headers": CORS, "body": json.dumps({"id": new_id, "message": "Сервер добавлен"})}

                # ── PUT /{id} — редактировать сервер (только владелец) ───
                if method == "PUT" and path not in ("", "/"):
                    try:
                        server_id = int(path.split("/")[-1])
                    except ValueError:
                        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Неверный ID"})}

                    if not token:
                        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Нужна авторизация"})}

                    cur.execute("""
                        SELECT u.id FROM sessions s JOIN users u ON u.id = s.user_id
                        WHERE s.token = %s AND s.expires_at > NOW()
                    """, (token,))
                    row = cur.fetchone()
                    if not row:
                        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Сессия истекла"})}
                    user_id = row[0]

                    cur.execute("SELECT user_id FROM servers WHERE id = %s", (server_id,))
                    srv = cur.fetchone()
                    if not srv:
                        return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Сервер не найден"})}
                    if srv[0] != user_id:
                        return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Нет доступа"})}

                    body    = json.loads(event.get("body") or "{}")
                    name    = (body.get("name") or "").strip()[:100]
                    ip_addr = (body.get("ip") or "").strip()[:100]
                    version = (body.get("version") or "1.20.4").strip()[:20]
                    stype   = (body.get("type") or "Выживание").strip()[:50]
                    desc    = (body.get("description") or "").strip()[:2000]
                    discord = (body.get("discord") or "").strip()[:200]
                    site    = (body.get("site") or "").strip()[:200]

                    if not name or not ip_addr:
                        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "name и ip обязательны"})}

                    cur.execute("""
                        UPDATE servers SET name=%s, ip=%s, version=%s, type=%s, description=%s, discord=%s, site=%s
                        WHERE id=%s
                    """, (name, ip_addr, version, stype, desc, discord, site, server_id))
                    return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

                # ── POST /vote — голосовать ───────────────────────────────
                if method == "POST" and path.endswith("/vote"):
                    body      = json.loads(event.get("body") or "{}")
                    server_id = int(body.get("server_id", 0))
                    if not server_id:
                        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "server_id обязателен"})}
                    try:
                        cur.execute("INSERT INTO server_votes (server_id, voter_ip) VALUES (%s, %s)", (server_id, ip))
                        cur.execute("UPDATE servers SET votes = votes + 1 WHERE id = %s RETURNING votes", (server_id,))
                        new_votes = cur.fetchone()[0]
                        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"votes": new_votes, "voted": True})}
                    except psycopg2.errors.UniqueViolation:
                        conn.rollback()
                        cur.execute("SELECT votes FROM servers WHERE id = %s", (server_id,))
                        row = cur.fetchone()
                        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"votes": row[0] if row else 0, "voted": False, "message": "Уже голосовали сегодня"})}

                # ── POST /pay/init — создать платёж ──────────────────────
                if method == "POST" and path.endswith("/pay/init"):
                    body      = json.loads(event.get("body") or "{}")
                    plan      = body.get("plan", "")
                    server_id = body.get("server_id")
                    email     = (body.get("email") or "").strip()
                    return_url = body.get("return_url", "https://minetop.ru")

                    if plan not in PLAN_PRICES:
                        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Неизвестный тариф"})}

                    amount   = PLAN_PRICES[plan]
                    # Берём order_id от фронта (уже вставлен в return_url), иначе генерируем
                    order_id = str(body.get("temp_order_id") or f"mt_{plan}_{server_id or 0}_{os.urandom(5).hex()}")[:64]

                    cur.execute(
                        "INSERT INTO orders (order_id, server_id, plan, amount) VALUES (%s, %s, %s, %s)",
                        (order_id, server_id, plan, amount),
                    )

                    payload = {
                        "amount":      {"value": amount, "currency": "RUB"},
                        "capture":     True,
                        "confirmation": {"type": "redirect", "return_url": return_url},
                        "description": PLAN_NAMES[plan],
                        "metadata":    {"order_id": order_id},
                    }
                    if email:
                        payload["receipt"] = {
                            "customer": {"email": email},
                            "items": [{
                                "description": PLAN_NAMES[plan],
                                "quantity":    "1",
                                "amount":      {"value": amount, "currency": "RUB"},
                                "vat_code":    1,
                            }],
                        }

                    result = yookassa_request("payments", payload, order_id)

                    payment_id  = result.get("id", "")
                    payment_url = result.get("confirmation", {}).get("confirmation_url", "")

                    cur.execute(
                        "UPDATE orders SET payment_id=%s WHERE order_id=%s",
                        (payment_id, order_id),
                    )

                    return {"statusCode": 200, "headers": CORS, "body": json.dumps({
                        "payment_url": payment_url,
                        "order_id":    order_id,
                        "payment_id":  payment_id,
                    })}

                # ── POST /pay/notify — вебхук ЮКасса ─────────────────────
                if method == "POST" and path.endswith("/pay/notify"):
                    body   = json.loads(event.get("body") or "{}")
                    event_type = body.get("event", "")
                    obj        = body.get("object", {})
                    order_id   = (obj.get("metadata") or {}).get("order_id", "")

                    if event_type == "payment.succeeded" and order_id:
                        cur.execute(
                            "UPDATE orders SET status='paid', paid_at=NOW() WHERE order_id=%s RETURNING server_id, plan",
                            (order_id,),
                        )
                        row = cur.fetchone()
                        if row and row[0]:
                            cur.execute("UPDATE servers SET plan=%s WHERE id=%s", (row[1], row[0]))

                    elif event_type in ("payment.canceled",) and order_id:
                        cur.execute("UPDATE orders SET status='failed' WHERE order_id=%s", (order_id,))

                    return {"statusCode": 200, "headers": CORS, "body": "OK"}

                # ── GET /pay/status?order_id=xxx ──────────────────────────
                if method == "GET" and path.endswith("/pay/status"):
                    order_id = (event.get("queryStringParameters") or {}).get("order_id", "")
                    if not order_id:
                        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "order_id обязателен"})}

                    cur.execute(
                        "SELECT status, plan, amount, paid_at FROM orders WHERE order_id=%s",
                        (order_id,),
                    )
                    row = cur.fetchone()
                    if not row:
                        return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Заказ не найден"})}

                    return {"statusCode": 200, "headers": CORS, "body": json.dumps({
                        "status":  row[0],
                        "plan":    row[1],
                        "amount":  row[2],
                        "paid_at": row[3].isoformat() if row[3] else None,
                    })}

    finally:
        conn.close()

    return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}
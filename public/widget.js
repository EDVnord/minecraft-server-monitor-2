(function () {
  "use strict";

  var API_URL = "https://functions.poehali.dev/09b533d2-c1db-4000-80a6-6d371d4a4df4";
  var REFRESH_INTERVAL = 60000;

  var THEMES = {
    dark: {
      bg: "#0f1117",
      border: "rgba(255,255,255,0.08)",
      text: "#ffffff",
      subtext: "rgba(255,255,255,0.4)",
      accent: "#22c55e",
      btnText: "#000000",
      shadow: "0 4px 24px rgba(0,0,0,0.4)",
    },
    glass: {
      bg: "rgba(255,255,255,0.05)",
      border: "rgba(255,255,255,0.15)",
      text: "#ffffff",
      subtext: "rgba(255,255,255,0.45)",
      accent: "#06b6d4",
      btnText: "#000000",
      shadow: "0 4px 24px rgba(0,0,0,0.25)",
    },
    green: {
      bg: "#052e16",
      border: "rgba(34,197,94,0.25)",
      text: "#ffffff",
      subtext: "rgba(255,255,255,0.45)",
      accent: "#22c55e",
      btnText: "#000000",
      shadow: "0 4px 24px rgba(34,197,94,0.15)",
    },
    purple: {
      bg: "#1e0a2e",
      border: "rgba(168,85,247,0.25)",
      text: "#ffffff",
      subtext: "rgba(255,255,255,0.45)",
      accent: "#a855f7",
      btnText: "#000000",
      shadow: "0 4px 24px rgba(168,85,247,0.15)",
    },
    minimal: {
      bg: "#18181b",
      border: "#3f3f46",
      text: "#a1a1aa",
      subtext: "#71717a",
      accent: "#ffffff",
      btnText: "#18181b",
      shadow: "0 2px 12px rgba(0,0,0,0.3)",
    },
  };

  function injectStyles() {
    if (document.getElementById("mineed-widget-css")) return;
    var style = document.createElement("style");
    style.id = "mineed-widget-css";
    style.textContent = [
      "@keyframes mineed-pulse{0%,100%{opacity:1}50%{opacity:.4}}",
      "@keyframes mineed-spin{to{transform:rotate(360deg)}}",
      ".mineed-dot{animation:mineed-pulse 2s ease-in-out infinite}",
      ".mineed-bar{transition:width 0.8s ease}",
    ].join("");
    document.head.appendChild(style);
  }

  function createElement(tag, styles, attrs) {
    var el = document.createElement(tag);
    if (styles) Object.assign(el.style, styles);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "textContent") el.textContent = attrs[k];
        else el.setAttribute(k, attrs[k]);
      });
    }
    return el;
  }

  function renderWidget(container, data, theme, compact) {
    var t = THEMES[theme] || THEMES.dark;
    var s = data.server;
    var pct = s.max_players > 0 ? Math.round((s.online / s.max_players) * 100) : 0;
    var isOnline = s.online_status === "online" || s.online > 0;
    var barColor = pct > 80 ? "#ef4444" : pct > 50 ? "#f59e0b" : t.accent;

    container.innerHTML = "";
    container.style.cssText = [
      "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      "border-radius:12px",
      "overflow:hidden",
      "background:" + t.bg,
      "border:1px solid " + t.border,
      "box-shadow:" + t.shadow,
      "max-width:320px",
      "width:100%",
    ].join(";");

    if (compact) {
      // ── Компактная строка ──────────────────────────────────────────────
      container.style.borderRadius = "8px";
      var row = createElement("div", {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 14px",
      });

      var dot = createElement("span", {
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        flexShrink: "0",
        background: isOnline ? "#22c55e" : "#ef4444",
        boxShadow: isOnline ? "0 0 6px #22c55e" : "none",
      });
      dot.className = isOnline ? "mineed-dot" : "";

      var name = createElement("span", {
        flex: "1",
        fontSize: "13px",
        fontWeight: "600",
        color: t.text,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }, { textContent: s.name });

      var count = createElement("span", {
        fontSize: "12px",
        fontWeight: "700",
        fontFamily: "monospace",
        color: t.accent,
        flexShrink: "0",
      }, { textContent: s.online + " онлайн" });

      var btn = createElement("a", {
        padding: "5px 12px",
        borderRadius: "6px",
        fontSize: "11px",
        fontWeight: "700",
        background: t.accent,
        color: t.btnText,
        textDecoration: "none",
        flexShrink: "0",
        cursor: "pointer",
      }, {
        href: "minecraft://" + s.ip,
        textContent: "Войти",
      });

      row.appendChild(dot);
      row.appendChild(name);
      row.appendChild(count);
      row.appendChild(btn);
      container.appendChild(row);

    } else {
      // ── Полная карточка ────────────────────────────────────────────────

      // Шапка
      var header = createElement("div", {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        borderBottom: "1px solid " + t.border,
      });

      var logoWrap = createElement("div", {
        display: "flex",
        alignItems: "center",
        gap: "6px",
      });
      var logoLink = createElement("a", {
        fontSize: "12px",
        fontWeight: "700",
        color: t.subtext,
        textDecoration: "none",
        letterSpacing: "0.5px",
      }, {
        href: "https://mineed.ru",
        target: "_blank",
        textContent: "Mine",
      });
      var logoAccent = createElement("span", {
        color: "#22c55e",
      }, { textContent: "ED" });
      logoLink.appendChild(logoAccent);
      logoWrap.appendChild(logoLink);

      var statusBadge = createElement("span", {
        fontSize: "10px",
        fontWeight: "700",
        padding: "3px 8px",
        borderRadius: "20px",
        color: isOnline ? t.accent : "#ef4444",
        background: isOnline ? t.accent + "18" : "rgba(239,68,68,0.1)",
        border: "1px solid " + (isOnline ? t.accent + "30" : "rgba(239,68,68,0.3)"),
        letterSpacing: "0.5px",
      }, { textContent: isOnline ? "ONLINE" : "OFFLINE" });

      header.appendChild(logoWrap);
      header.appendChild(statusBadge);

      // Тело
      var body = createElement("div", { padding: "16px" });

      var label = createElement("div", {
        fontSize: "10px",
        textTransform: "uppercase",
        letterSpacing: "1px",
        color: t.subtext,
        marginBottom: "4px",
      }, { textContent: "Minecraft сервер" });

      var serverName = createElement("div", {
        fontSize: "16px",
        fontWeight: "700",
        color: t.text,
        marginBottom: "14px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }, { textContent: s.name });

      // Прогресс онлайна
      var onlineRow = createElement("div", {
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "5px",
      });
      var onlineLabel = createElement("span", {
        fontSize: "11px",
        color: t.subtext,
      }, { textContent: "Онлайн игроков" });
      var onlineVal = createElement("span", {
        fontSize: "11px",
        fontWeight: "700",
        fontFamily: "monospace",
        color: t.accent,
      }, { textContent: s.online + " / " + s.max_players });
      onlineRow.appendChild(onlineLabel);
      onlineRow.appendChild(onlineVal);

      var barTrack = createElement("div", {
        width: "100%",
        height: "4px",
        borderRadius: "2px",
        background: t.accent + "20",
        marginBottom: "12px",
        overflow: "hidden",
      });
      var barFill = createElement("div", {
        height: "100%",
        borderRadius: "2px",
        background: barColor,
        width: "0%",
      });
      barFill.className = "mineed-bar";
      barTrack.appendChild(barFill);
      setTimeout(function () { barFill.style.width = pct + "%"; }, 50);

      // IP + uptime
      var meta = createElement("div", {
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "14px",
      });
      var ipEl = createElement("span", {
        fontSize: "11px",
        color: t.subtext,
        fontFamily: "monospace",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        maxWidth: "55%",
      }, { textContent: s.ip });
      var uptimeEl = createElement("span", {
        fontSize: "11px",
        color: t.subtext,
      }, { textContent: "uptime " + s.uptime.toFixed(1) + "%" });
      meta.appendChild(ipEl);
      meta.appendChild(uptimeEl);

      // Кнопка
      var connectBtn = createElement("a", {
        display: "block",
        width: "100%",
        padding: "10px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: "700",
        background: isOnline ? t.accent : "rgba(255,255,255,0.08)",
        color: isOnline ? t.btnText : t.subtext,
        textDecoration: "none",
        textAlign: "center",
        cursor: isOnline ? "pointer" : "default",
        boxSizing: "border-box",
        transition: "opacity 0.2s",
      }, {
        href: isOnline ? "minecraft://" + s.ip : "#",
        textContent: isOnline ? "Подключиться" : "Сервер недоступен",
      });
      if (isOnline) {
        connectBtn.onmouseover = function () { this.style.opacity = "0.85"; };
        connectBtn.onmouseout  = function () { this.style.opacity = "1"; };
      }

      body.appendChild(label);
      body.appendChild(serverName);
      body.appendChild(onlineRow);
      body.appendChild(barTrack);
      body.appendChild(meta);
      body.appendChild(connectBtn);
      container.appendChild(header);
      container.appendChild(body);
    }
  }

  function renderError(container, msg) {
    container.innerHTML = "";
    Object.assign(container.style, {
      fontFamily: "sans-serif",
      padding: "16px",
      borderRadius: "12px",
      background: "#0f1117",
      border: "1px solid rgba(239,68,68,0.25)",
      color: "rgba(239,68,68,0.7)",
      fontSize: "12px",
      maxWidth: "320px",
    });
    container.textContent = "MineED: " + msg;
  }

  function renderLoading(container, theme) {
    var t = THEMES[theme] || THEMES.dark;
    container.innerHTML = "";
    Object.assign(container.style, {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      borderRadius: "12px",
      background: t.bg,
      border: "1px solid " + t.border,
      maxWidth: "320px",
    });
    var spinner = createElement("div", {
      width: "20px",
      height: "20px",
      borderRadius: "50%",
      border: "2px solid " + t.accent + "30",
      borderTopColor: t.accent,
      animation: "mineed-spin 0.8s linear infinite",
    });
    container.appendChild(spinner);
  }

  function loadWidget(container) {
    var serverId = container.getAttribute("data-server");
    var theme    = container.getAttribute("data-theme") || "dark";
    var compact  = container.getAttribute("data-compact") === "true";

    if (!serverId) {
      renderError(container, "укажи data-server с ID сервера");
      return;
    }

    injectStyles();
    renderLoading(container, theme);

    function fetchData() {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", API_URL + "/widget?id=" + encodeURIComponent(serverId), true);
      xhr.onload = function () {
        if (xhr.status === 200) {
          try {
            var data = JSON.parse(xhr.responseText);
            renderWidget(container, data, theme, compact);
          } catch (e) {
            renderError(container, "ошибка парсинга данных");
          }
        } else {
          renderError(container, "сервер #" + serverId + " не найден");
        }
      };
      xhr.onerror = function () {
        renderError(container, "нет связи с MineED");
      };
      xhr.send();
    }

    fetchData();
    setInterval(fetchData, REFRESH_INTERVAL);
  }

  function init() {
    var containers = document.querySelectorAll("script[data-server]");
    containers.forEach(function (script) {
      var div = createElement("div");
      div.setAttribute("data-server", script.getAttribute("data-server"));
      div.setAttribute("data-theme",  script.getAttribute("data-theme") || "dark");
      div.setAttribute("data-compact", script.getAttribute("data-compact") || "false");
      script.parentNode.insertBefore(div, script.nextSibling);
      loadWidget(div);
    });

    // Поддержка явных div-контейнеров: <div data-mineed-widget data-server="123">
    var divContainers = document.querySelectorAll("[data-mineed-widget]");
    divContainers.forEach(function (el) {
      loadWidget(el);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

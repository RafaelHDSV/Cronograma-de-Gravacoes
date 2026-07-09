// src/collectClientContext.ts
var CACHE_KEY = "vieira_client_ctx";
function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function writeCache(ctx) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(ctx));
  } catch {
  }
}
function isDesktopOs(os) {
  return os === "Windows" || os === "macOS" || os === "Linux" || os === "Chrome OS";
}
function detectDeviceType(screenW) {
  if (screenW <= 0) return "desktop";
  if (screenW < 768) return "mobile";
  if (screenW < 1024) return "tablet";
  return "desktop";
}
function detectBrowser(nav) {
  if ("brave" in nav) return "Brave";
  const brands = nav.userAgentData?.brands;
  if (brands) {
    for (const { brand } of brands) {
      if (/not\.a\.brand/i.test(brand)) continue;
      if (/brave/i.test(brand)) return "Brave";
      if (/microsoft edge/i.test(brand)) return "Edge";
      if (/google chrome/i.test(brand)) return "Chrome";
      if (/firefox/i.test(brand)) return "Firefox";
      if (/safari/i.test(brand)) return "Safari";
    }
  }
  const ua = navigator.userAgent;
  if (/Edg\//i.test(ua)) return "Edge";
  if (/Firefox\//i.test(ua)) return "Firefox";
  if (/Chrome\//i.test(ua)) return "Chrome";
  if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) return "Safari";
  return null;
}
function detectOs(screenW, nav) {
  const uaData = nav.userAgentData;
  const ua = navigator.userAgent;
  const isDesktopScreen = screenW >= 1024;
  if (uaData?.mobile === false && uaData.platform) {
    const platform = uaData.platform;
    if (isDesktopScreen && platform === "Android") {
    } else {
      return platform;
    }
  }
  if (isDesktopScreen) {
    if (/Windows/i.test(ua)) return "Windows";
    if (/Mac OS X/i.test(ua)) return "macOS";
    if (/CrOS/i.test(ua)) return "Chrome OS";
    if (/Linux/i.test(ua) && !/Android/i.test(ua)) return "Linux";
    const platform = navigator.platform;
    if (platform === "Win32") return "Windows";
    if (platform === "MacIntel") return "macOS";
    if (platform?.startsWith("Linux")) return "Linux";
    return null;
  }
  if (uaData?.platform) return uaData.platform;
  if (/Android/i.test(ua)) return "Android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Mac OS X/i.test(ua)) return "macOS";
  if (/Linux/i.test(ua)) return "Linux";
  return null;
}
function collectClientContext() {
  const screenW = window.screen?.width ?? 0;
  const nav = navigator;
  const deviceType = detectDeviceType(screenW);
  const browser = detectBrowser(nav);
  if (deviceType !== "desktop") {
    return { deviceType, browser, os: detectOs(screenW, nav) };
  }
  const cached = readCache();
  const os = detectOs(screenW, nav);
  if (cached?.os && isDesktopOs(cached.os)) {
    return { deviceType: "desktop", browser, os: cached.os };
  }
  if (os && isDesktopOs(os)) {
    writeCache({ deviceType: "desktop", browser, os });
    return { deviceType: "desktop", browser, os };
  }
  return {
    deviceType: "desktop",
    browser,
    os: cached?.os ?? os
  };
}

// src/session.ts
var COOKIE_NAME = "_va_sid";
var TTL_MIN = 30;
function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : r & 3 | 8;
    return v.toString(16);
  });
}
function getSessionId() {
  if (typeof document === "undefined") return uuid();
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + COOKIE_NAME + "=([^;]+)")
  );
  if (match) {
    refreshCookie(match[1]);
    return decodeURIComponent(match[1]);
  }
  const id = uuid();
  refreshCookie(id);
  return id;
}
function refreshCookie(value) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + TTL_MIN * 60 * 1e3).toUTCString();
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(
    value
  )}; expires=${expires}; path=/; SameSite=Lax`;
}

// src/collectContext.ts
function buildPageviewPayload(config) {
  const url = new URL(window.location.href);
  let timezone = "";
  try {
    const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (resolved && resolved !== "Etc/Unknown") {
      timezone = resolved;
    }
  } catch {
  }
  return {
    projectKey: config.projectKey,
    type: "pageview",
    path: url.pathname + url.search,
    referrer: document.referrer || "",
    language: navigator.language || "",
    screen: `${window.screen.width}x${window.screen.height}`,
    timezone,
    client: collectClientContext(),
    utm: extractUtm(url),
    sessionId: getSessionId(),
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function extractUtm(url) {
  const source = url.searchParams.get("utm_source") ?? void 0;
  const medium = url.searchParams.get("utm_medium") ?? void 0;
  const campaign = url.searchParams.get("utm_campaign") ?? void 0;
  if (!source && !medium && !campaign) return void 0;
  return { source, medium, campaign };
}

// src/isLocalhost.ts
function isLocalhost() {
  if (typeof window === "undefined") return false;
  const hostname = window.location.hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

// src/constants.ts
var ANALYTICS_API_BASE = "https://vieira-analytics.vercel.app/v1";

// src/transport.ts
function isCrossOrigin(url) {
  if (typeof window === "undefined") return false;
  try {
    return new URL(url).origin !== window.location.origin;
  } catch {
    return false;
  }
}
function send(config, payload) {
  const url = `${ANALYTICS_API_BASE.replace(/\/$/, "")}/collect`;
  const body = JSON.stringify(payload);
  const postWithFetch = () => {
    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
      credentials: "omit",
      mode: "cors"
    }).catch(() => {
    });
  };
  try {
    if (!isCrossOrigin(url) && typeof navigator?.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      const ok = navigator.sendBeacon(url, blob);
      if (ok) return;
    }
    postWithFetch();
  } catch {
  }
}

// src/track.ts
function trackPageview(config) {
  if (typeof window === "undefined") return;
  if (isLocalhost()) return;
  if (config.respectDnt !== false && typeof navigator !== "undefined" && navigator.doNotTrack === "1") {
    return;
  }
  if (!config.projectKey) return;
  const payload = buildPageviewPayload(config);
  send(config, payload);
}

export {
  trackPageview
};

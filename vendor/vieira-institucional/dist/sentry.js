import {
  ErrorPage
} from "./chunk-KSNJRWDB.js";

// src/sentry.tsx
import * as Sentry from "@sentry/react";
import { jsx } from "react/jsx-runtime";
var EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
var JWT_RE = /eyJ[\w-]+\.[\w-]+\.[\w-]+/g;
var BEARER_RE = /Bearer\s+[\w.~+/-]+=*/gi;
function scrubText(value) {
  return value.replace(JWT_RE, "[token]").replace(BEARER_RE, "Bearer [token]").replace(EMAIL_RE, "[email]");
}
function stripQuery(url) {
  const cut = url.search(/[?#]/);
  return scrubText(cut === -1 ? url : url.slice(0, cut));
}
function scrubDeep(value, depth = 0) {
  if (depth > 6) return value;
  if (typeof value === "string") return scrubText(value);
  if (Array.isArray(value)) return value.map((v) => scrubDeep(v, depth + 1));
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = /url|href|from|to/i.test(k) && typeof v === "string" ? stripQuery(v) : scrubDeep(v, depth + 1);
    }
    return out;
  }
  return value;
}
function scrubEvent(event) {
  delete event.user;
  if (event.request) {
    delete event.request.cookies;
    delete event.request.headers;
    delete event.request.query_string;
    if (event.request.url) event.request.url = stripQuery(event.request.url);
  }
  if (event.message) event.message = scrubText(event.message);
  if (event.exception?.values) {
    event.exception.values = event.exception.values.map((ex) => ({
      ...ex,
      value: ex.value ? scrubText(ex.value) : ex.value
    }));
  }
  if (event.breadcrumbs) event.breadcrumbs = scrubDeep(event.breadcrumbs);
  if (event.extra) event.extra = scrubDeep(event.extra);
  return event;
}
function initSentry({ dsn, release, environment = "production", allowUrls, enabled = true }) {
  if (!enabled || !dsn) return false;
  Sentry.init({
    dsn,
    release: release || void 0,
    environment,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    allowUrls,
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      /^Non-Error promise rejection captured/,
      /chrome-extension:\/\//,
      /moz-extension:\/\//,
      /safari-(web-)?extension:\/\//
    ],
    denyUrls: [/extensions\//i, /^chrome:\/\//i, /^chrome-extension:\/\//i, /^moz-extension:\/\//i],
    beforeSend: (event) => scrubEvent(event),
    beforeBreadcrumb: (crumb) => scrubDeep(crumb)
  });
  return true;
}
function AppErrorBoundary({ children }) {
  return /* @__PURE__ */ jsx(
    Sentry.ErrorBoundary,
    {
      fallback: ({ eventId }) => /* @__PURE__ */ jsx(ErrorPage, { eventId: Sentry.getClient() && eventId ? eventId : null }),
      children
    }
  );
}
export {
  AppErrorBoundary,
  initSentry
};

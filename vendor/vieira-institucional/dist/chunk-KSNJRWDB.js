// src/config.ts
var SUPPORT_EMAIL = "rafaelvieira1720@gmail.com";
var SUPPORT_SLA = "at\xE9 5 dias \xFAteis";
var DATA_SUBJECT_SLA = "at\xE9 15 dias";
var CONTROLLER_NAME = "Rafael Vieira";
var DEFAULT_ROUTES = {
  home: "/",
  privacy: "/privacidade",
  terms: "/termos"
};
function defineInstitucionalConfig(config) {
  return config;
}
function hasLegalPages(config) {
  return config.legalPages ?? config.hasAccount;
}
function resolveRoutes(config) {
  return { ...DEFAULT_ROUTES, ...config.routes };
}
function formatLegalDate(version) {
  const [year, month, day] = version.split("-");
  if (!year || !month || !day) return version;
  return `${day}/${month}/${year}`;
}
function deletedAccountMessage(appName) {
  return `Seus dados do ${appName} foram exclu\xEDdos.`;
}
function supportMailto(appName, subject = "Suporte") {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`[${appName}] ${subject}`)}`;
}

// src/context.tsx
import { createContext, useContext } from "react";
import { jsx } from "react/jsx-runtime";
function AnchorLink({ to, className, children }) {
  return /* @__PURE__ */ jsx("a", { href: to, className, children });
}
var InstitucionalContext = createContext(null);
function InstitucionalProvider({ config, linkComponent, children }) {
  return /* @__PURE__ */ jsx(InstitucionalContext.Provider, { value: { config, Link: linkComponent ?? AnchorLink }, children });
}
function useInstitucional() {
  const ctx = useContext(InstitucionalContext);
  if (!ctx) {
    throw new Error("useInstitucional fora do InstitucionalProvider");
  }
  return ctx;
}

// src/icons.tsx
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
var stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true
};
function IconArrowLeft({ size = 16 }) {
  return /* @__PURE__ */ jsxs("svg", { width: size, height: size, viewBox: "0 0 24 24", ...stroke, children: [
    /* @__PURE__ */ jsx2("path", { d: "M19 12H5" }),
    /* @__PURE__ */ jsx2("path", { d: "M12 19l-7-7 7-7" })
  ] });
}
function IconHome({ size = 16 }) {
  return /* @__PURE__ */ jsxs("svg", { width: size, height: size, viewBox: "0 0 24 24", ...stroke, children: [
    /* @__PURE__ */ jsx2("path", { d: "M3 9.5 12 3l9 6.5V20a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 20Z" }),
    /* @__PURE__ */ jsx2("path", { d: "M9 21.5V12h6v9.5" })
  ] });
}

// src/components/ErrorPage.tsx
import { jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
function ErrorPage({ eventId, onReload }) {
  const { config } = useInstitucional();
  const routes = resolveRoutes(config);
  const subject = eventId ? `Erro ${eventId}` : "Erro";
  return /* @__PURE__ */ jsxs2("main", { className: "vi-page vi-status-page", role: "alert", children: [
    /* @__PURE__ */ jsx3("h1", { className: "vi-status-page__title", children: "Algo deu errado" }),
    /* @__PURE__ */ jsxs2("p", { className: "vi-status-page__text", children: [
      "O ",
      config.appName,
      " encontrou um erro inesperado. Recarregar costuma resolver."
    ] }),
    /* @__PURE__ */ jsxs2("div", { className: "vi-status-page__actions", children: [
      /* @__PURE__ */ jsx3(
        "button",
        {
          type: "button",
          className: "vi-button vi-button--primary",
          onClick: onReload ?? (() => window.location.reload()),
          children: "Recarregar"
        }
      ),
      /* @__PURE__ */ jsxs2("a", { href: routes.home, className: "vi-button", children: [
        /* @__PURE__ */ jsx3(IconHome, {}),
        "In\xEDcio"
      ] })
    ] }),
    /* @__PURE__ */ jsxs2("p", { className: "vi-status-page__help", children: [
      "Se o problema continuar, escreva para",
      " ",
      /* @__PURE__ */ jsx3("a", { href: supportMailto(config.appName, subject), className: "vi-link", children: SUPPORT_EMAIL }),
      "."
    ] }),
    eventId && /* @__PURE__ */ jsxs2("p", { className: "vi-status-page__event", children: [
      "C\xF3digo do erro: ",
      /* @__PURE__ */ jsx3("code", { children: eventId })
    ] })
  ] });
}

export {
  SUPPORT_EMAIL,
  SUPPORT_SLA,
  DATA_SUBJECT_SLA,
  CONTROLLER_NAME,
  DEFAULT_ROUTES,
  defineInstitucionalConfig,
  hasLegalPages,
  resolveRoutes,
  formatLegalDate,
  deletedAccountMessage,
  supportMailto,
  InstitucionalProvider,
  useInstitucional,
  IconArrowLeft,
  IconHome,
  ErrorPage
};

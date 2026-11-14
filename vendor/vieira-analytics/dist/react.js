import {
  fetchPublicSummary,
  formatVisitCountLabel,
  isLocalDevHost,
  resolveVisitCountLabel,
  shouldShowVisitCount,
  trackPageview
} from "./chunk-7RC3YH4P.js";

// src/react.ts
import { useEffect as useEffect2, useRef } from "react";

// src/VisitCountFooter.tsx
import { useEffect, useState } from "react";
import { jsx } from "react/jsx-runtime";
var style = {
  margin: 0,
  fontSize: "0.75rem",
  lineHeight: 1.4,
  opacity: 0.7,
  textAlign: "center"
};
function VisitCountFooter({
  projectKey,
  apiHost,
  className
}) {
  const local = isLocalDevHost();
  const [label, setLabel] = useState(
    () => resolveVisitCountLabel(null, { local })
  );
  useEffect(() => {
    let cancelled = false;
    const isLocal = isLocalDevHost();
    void (async () => {
      const summary = await fetchPublicSummary(projectKey, { apiHost });
      if (cancelled) return;
      setLabel(resolveVisitCountLabel(summary, { local: isLocal }));
    })();
    return () => {
      cancelled = true;
    };
  }, [projectKey, apiHost]);
  if (!label) return null;
  return /* @__PURE__ */ jsx("p", { className, style, "data-vieira-visit-count": true, children: label });
}

// src/react.ts
var DEBOUNCE_MS = 300;
function VieiraAnalytics(props) {
  const lastPathRef = useRef(null);
  const timerRef = useRef(null);
  useEffect2(() => {
    if (typeof window === "undefined") return;
    const config = {
      projectKey: props.projectKey,
      respectDnt: props.respectDnt
    };
    if (!config.projectKey) return;
    const dispatch = () => {
      const current = window.location.pathname + window.location.search;
      if (current === lastPathRef.current) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        lastPathRef.current = current;
        trackPageview(config);
      }, DEBOUNCE_MS);
    };
    dispatch();
    const originalPush = window.history.pushState;
    const originalReplace = window.history.replaceState;
    window.history.pushState = function patchedPush(...args) {
      const ret = originalPush.apply(this, args);
      window.dispatchEvent(new Event("vieira:locationchange"));
      return ret;
    };
    window.history.replaceState = function patchedReplace(...args) {
      const ret = originalReplace.apply(this, args);
      window.dispatchEvent(new Event("vieira:locationchange"));
      return ret;
    };
    window.addEventListener("popstate", dispatch);
    window.addEventListener("vieira:locationchange", dispatch);
    return () => {
      window.removeEventListener("popstate", dispatch);
      window.removeEventListener("vieira:locationchange", dispatch);
      window.history.pushState = originalPush;
      window.history.replaceState = originalReplace;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [props.projectKey, props.respectDnt]);
  return null;
}
export {
  VieiraAnalytics,
  VisitCountFooter,
  fetchPublicSummary,
  formatVisitCountLabel,
  isLocalDevHost,
  resolveVisitCountLabel,
  shouldShowVisitCount
};

import {
  fetchPublicSummary,
  formatVisitCountLabel,
  shouldShowVisitCount,
  trackPageview
} from "./chunk-F4VXVQNP.js";

// src/react.ts
import { useEffect as useEffect2, useRef } from "react";

// src/VisitCountFooter.tsx
import { useEffect, useState } from "react";
import { jsx } from "react/jsx-runtime";
function VisitCountFooter({
  projectKey,
  apiHost,
  className
}) {
  const [label, setLabel] = useState(null);
  useEffect(() => {
    if (!projectKey) return;
    let cancelled = false;
    const controller = new AbortController();
    void fetchPublicSummary(projectKey, { apiHost, signal: controller.signal }).then(
      (summary) => {
        if (cancelled) return;
        if (!shouldShowVisitCount(summary) || !summary) {
          setLabel(null);
          return;
        }
        setLabel(formatVisitCountLabel(summary.pageviews));
      }
    );
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [projectKey, apiHost]);
  if (!label) return null;
  return /* @__PURE__ */ jsx(
    "p",
    {
      className: ["va-visit-count", className].filter(Boolean).join(" "),
      "aria-live": "polite",
      children: label
    }
  );
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
  shouldShowVisitCount
};

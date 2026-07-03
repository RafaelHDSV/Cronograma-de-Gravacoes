import {
  trackPageview
} from "./chunk-Z4GIK4DN.js";

// src/react.ts
import { useEffect, useRef } from "react";
var DEBOUNCE_MS = 300;
function VieiraAnalytics(props) {
  const lastPathRef = useRef(null);
  const timerRef = useRef(null);
  useEffect(() => {
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
  VieiraAnalytics
};

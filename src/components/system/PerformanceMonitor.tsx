import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export const PerformanceMonitor = () => {
  const location = useLocation();
  const navStartRef = useRef<number>(performance.now());
  const lastPathRef = useRef<string>(location.pathname);

  useEffect(() => {
    // Resource error listener (scripts, styles, images)
    const onResourceError = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const descriptor = (() => {
        if (target instanceof HTMLScriptElement) return { type: "script", url: target.src };
        if (target instanceof HTMLLinkElement) return { type: "style", url: target.href };
        if (target instanceof HTMLImageElement) return { type: "image", url: target.src };
        return { type: target.tagName?.toLowerCase?.() || "unknown", url: undefined };
      })();

      // Chunk load errors typically come from script tags
      const isChunk = descriptor.type === "script" && /\/assets\/.+\.js/.test(descriptor.url || "");
      console.error(
        isChunk ? "[ChunkError] Failed to load JS chunk" : "[ResourceError] Failed to load resource",
        descriptor
      );
    };

    window.addEventListener("error", onResourceError, { capture: true });

    // Basic PerformanceObserver for navigation and paint
    let observers: PerformanceObserver[] = [];
    if ("PerformanceObserver" in window) {
      try {
        const navObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === "navigation") {
              console.info("[Perf] Navigation timing", {
                duration: Math.round(entry.duration),
                domContentLoaded: Math.round((entry as PerformanceNavigationTiming).domContentLoadedEventEnd - (entry as PerformanceNavigationTiming).startTime),
                loadEvent: Math.round((entry as PerformanceNavigationTiming).loadEventEnd - (entry as PerformanceNavigationTiming).startTime),
              });
            }
          }
        });
        navObserver.observe({ type: "navigation", buffered: true } as any);
        observers.push(navObserver);
      } catch {}

      try {
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === "first-contentful-paint") {
              console.info("[Perf] FCP", Math.round(entry.startTime));
            }
          }
        });
        paintObserver.observe({ type: "paint", buffered: true } as any);
        observers.push(paintObserver);
      } catch {}
    }

    return () => {
      window.removeEventListener("error", onResourceError, { capture: true } as any);
      observers.forEach((o) => o.disconnect());
    };
  }, []);

  // Route change timing
  useEffect(() => {
    const now = performance.now();
    const prevPath = lastPathRef.current;
    const duration = Math.round(now - navStartRef.current);
    if (prevPath !== location.pathname) {
      console.info("[Route] navigated", { from: prevPath, to: location.pathname, durationMs: duration });
    }
    lastPathRef.current = location.pathname;
    navStartRef.current = now;
  }, [location.pathname]);

  return null;
};

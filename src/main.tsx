import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

// Prevent stale PWA caches/service workers from breaking the preview (common cause of "Invalid hook call")
async function cleanupServiceWorkerCaches() {
  try {
    if (typeof window === "undefined") return;

    const isLovablePreview = window.location.hostname.includes("lovableproject.com");

    if (isLovablePreview && "serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }

    if (isLovablePreview && "caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    // ignore
  }
}

const root = createRoot(rootElement);

cleanupServiceWorkerCaches().finally(() => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});

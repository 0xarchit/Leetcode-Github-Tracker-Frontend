import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "@/components/theme-provider";
import { registerSW } from 'virtual:pwa-register';

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="system" storageKey="student-tracker-theme">
    <App />
  </ThemeProvider>
);

// Register service worker via VitePWA
try {
  registerSW({ immediate: true, onRegisteredSW() {}, onOfflineReady() {} });
} catch {}

// Capture the PWA install prompt globally so any component can trigger it later
window.addEventListener('beforeinstallprompt', (e: any) => {
  try {
    e.preventDefault();
  } catch {}
  (window as any).__deferredPWAInstallPrompt = e;
  // Notify listeners that the prompt is available
  try { window.dispatchEvent(new CustomEvent('pwa:beforeinstallprompt')); } catch {}
});

window.addEventListener('appinstalled', () => {
  (window as any).__deferredPWAInstallPrompt = null;
  (window as any).__PWA_IS_INSTALLED = true;
  try { localStorage.setItem('pwa_installed', '1'); } catch {}
  try { window.dispatchEvent(new CustomEvent('pwa:installed-state-changed', { detail: { installed: true } })); } catch {}
});

// Maintain a global installed-state flag for components to read without duplicating logic
(() => {
  let relatedInstalled = false;
  let hbTimer: number | null = null;
  const computeStandaloneOnly = () => {
    try {
      const iosStandalone = (navigator as any).standalone === true;
      const modes = ['standalone', 'fullscreen', 'minimal-ui', 'window-controls-overlay'];
      const mediaMatch = modes.some((m) => window.matchMedia && window.matchMedia(`(display-mode: ${m})`).matches);
      return iosStandalone || mediaMatch;
    } catch { return false; }
  };
  const computeInstalled = () => {
    try {
      const mediaMatch = computeStandaloneOnly();
      const persisted = (() => { try { return localStorage.getItem('pwa_installed') === '1'; } catch { return false; } })();
      return mediaMatch || relatedInstalled || persisted;
    } catch {
      return false;
    }
  };

  const setFlag = () => {
    const installed = computeInstalled();
    (window as any).__PWA_IS_INSTALLED = installed;
    try { window.dispatchEvent(new CustomEvent('pwa:installed-state-changed', { detail: { installed } })); } catch {}
  };

  // Best-effort verification using getInstalledRelatedApps when available
  const verifyRelatedApps = async () => {
    const navAny = navigator as any;
    if (!navAny.getInstalledRelatedApps) {
      // On platforms without the API, prefer enabling install if not in display-mode
      relatedInstalled = false;
      setFlag();
      return;
    }
    try {
      const apps = await navAny.getInstalledRelatedApps();
      relatedInstalled = Array.isArray(apps) && apps.length > 0;
      if (relatedInstalled) {
        try { localStorage.setItem('pwa_installed', '1'); } catch {}
      } else {
        try { localStorage.removeItem('pwa_installed'); } catch {}
      }
      setFlag();
    } catch {
      // On error, don't force installed state
      relatedInstalled = false;
      setFlag();
    }
  };

  const startHeartbeatIfStandalone = () => {
    if (!computeStandaloneOnly()) return;
    // Mark installed and start heartbeating so other tabs get a storage event immediately
    try { localStorage.setItem('pwa_installed', '1'); } catch {}
    const beat = () => {
      try { localStorage.setItem('pwa_heartbeat', String(Date.now())); } catch {}
    };
    beat();
    if (hbTimer) return; // already running
    hbTimer = window.setInterval(beat, 30000);
  };
  const stopHeartbeat = () => {
    if (hbTimer) { clearInterval(hbTimer); hbTimer = null; }
  };

  // Initial compute as early as possible, then verify
  setFlag();
  verifyRelatedApps();
  startHeartbeatIfStandalone();

  // React to display-mode changes
  try {
    const mqStandalone = window.matchMedia('(display-mode: standalone)');
    const mqFullscreen = window.matchMedia('(display-mode: fullscreen)');
    const mqMinimal = window.matchMedia('(display-mode: minimal-ui)');
    const mqWco = window.matchMedia('(display-mode: window-controls-overlay)');
    mqStandalone?.addEventListener?.('change', setFlag);
    mqFullscreen?.addEventListener?.('change', setFlag);
    mqMinimal?.addEventListener?.('change', setFlag);
    mqWco?.addEventListener?.('change', setFlag);
  } catch {}

  window.addEventListener('visibilitychange', () => { setFlag(); verifyRelatedApps(); });
  window.addEventListener('pageshow', () => { setFlag(); verifyRelatedApps(); });
  window.addEventListener('resize', () => { setFlag(); });
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') startHeartbeatIfStandalone();
    else stopHeartbeat();
  });
  window.addEventListener('storage', (e: StorageEvent) => {
    if (!e.key) return;
    if (e.key === 'pwa_installed' || e.key === 'pwa_heartbeat') {
      setFlag();
    }
  });
})();

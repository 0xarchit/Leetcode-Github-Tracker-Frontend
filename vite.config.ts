import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins: PluginOption[] = [];
  plugins.push(react() as unknown as PluginOption);
  plugins.push(
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: null, // we manually call registerSW in main.tsx
      includeAssets: ["icons/icon-192.svg", "icons/icon-512.svg", "robots.txt"],
      workbox: {
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,css,html,svg,png,ico,webmanifest}"],
      },
      manifest: false, // use existing public/manifest.webmanifest
    }) as unknown as PluginOption
  );
  return {
    server: {
      host: "::",
      port: 3000,
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});

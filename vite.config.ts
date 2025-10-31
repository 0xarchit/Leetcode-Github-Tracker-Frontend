import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig(({ mode }) => {
  const plugins: PluginOption[] = [];
  plugins.push(react() as unknown as PluginOption);
  plugins.push(
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: null,
      includeAssets: [
        "icons/logo192.png",
        "icons/logo512.png",
        "icons/favicon-16x16.png",
        "icons/favicon-32x32.png",
        "icons/favicon.ico",
        "icons/apple-touch-icon.png",
        "robots.txt",
      ],
      workbox: {
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,css,html,svg,png,ico,webmanifest}"],
      },
      manifest: false,
    }) as unknown as PluginOption
  );
  return {
    server: {
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

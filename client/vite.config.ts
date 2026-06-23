import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "path";
import { crx } from "@crxjs/vite-plugin";       // 1. Import CRX plugin
import manifest from "./manifest.json";         // 2. Import your manifest

export default defineConfig({
  plugins: [
    react(), 
    svgr(),
    crx({ manifest })                           // 3. Add CRX to plugins
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    proxy: {
      '/api': {
        // Forward it to your backend server
        target: 'http://localhost:5000',
        changeOrigin: true,
        // Rewrite the path to match your backend's structure
        rewrite: (path) => path.replace(/^\/api/, '/websears'),
      }
    }
  }
});
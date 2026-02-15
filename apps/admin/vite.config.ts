import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  root: "ui",
  publicDir: "ui/public",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    base: "/",
  },
  resolve: {
    alias: { "@": resolve(__dirname, "ui") },
  },
  server: {
    proxy: {
      "/api": { target: "http://localhost:8787", changeOrigin: true },
      "/public": { target: "http://localhost:8787", changeOrigin: true },
    },
  },
});

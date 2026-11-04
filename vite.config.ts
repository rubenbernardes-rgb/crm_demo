import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { createApiMiddleware } from "./server/api";

const apiPlugin = {
  name: "personal-crm-api",
  configureServer(server: import("vite").ViteDevServer) {
    server.middlewares.use(createApiMiddleware());
  },
  configurePreviewServer(server: import("vite").PreviewServer) {
    server.middlewares.use(createApiMiddleware());
  },
};

export default defineConfig({
  plugins: [react(), apiPlugin],
  server: {
    host: true,
    port: 5174,
    strictPort: false,
  },
  preview: {
    host: true,
    port: 5174,
    strictPort: false,
  },
});

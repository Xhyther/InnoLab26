import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import { handleApi } from "./server/lea-api.ts";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const options = {
    apiKey: env.GEMINI_API_KEY || "",
    model: env.GEMINI_MODEL || "gemini-3.8-flash",
  };
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "paleasta-local-api",
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (!req.url?.startsWith("/api/")) return next();
            void handleApi(req, res, options);
          });
        },
        configurePreviewServer(server) {
          server.middlewares.use((req, res, next) => {
            if (!req.url?.startsWith("/api/")) return next();
            void handleApi(req, res, options);
          });
        },
      },
    ],
  };
});

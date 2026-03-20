import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { APP_CONFIG } from "./src/config.js";
import { buildGuideResponse } from "./src/guide/xmltv.js";

function guideApiPlugin() {
  const handler = async (_req, res) => {
    try {
      const payload = await buildGuideResponse(APP_CONFIG, new Date());
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(payload));
    } catch (error) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    }
  };

  return {
    name: "guide-api-plugin",
    configureServer(server) {
      server.middlewares.use(APP_CONFIG.proxyPath, handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(APP_CONFIG.proxyPath, handler);
    },
  };
}

export default defineConfig({
  plugins: [react(), guideApiPlugin()],
});

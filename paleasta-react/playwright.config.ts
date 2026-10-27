import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true, workers: 2,
  use: {
    baseURL: "http://127.0.0.1:5240",
    viewport: { width: 1440, height: 1000 },
    browserName: "chromium",
    channel: "chrome",
    headless: true,
  },
  webServer: {
    command: "node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 5240 --strictPort",
    url: "http://127.0.0.1:5240",
    reuseExistingServer: true,
  },
});









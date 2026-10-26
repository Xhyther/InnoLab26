import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { handleApi } from "./lea-api.ts";
const root = resolve("dist");
const types: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};
const port = Number(process.env.PORT || 3001);
const server = createServer(async (req, res) => {
  if (req.url?.startsWith("/api/")) {
    await handleApi(req, res, {
      apiKey: process.env.GEMINI_API_KEY || "",
      model: process.env.GEMINI_MODEL,
    });
    return;
  }
  try {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405);
      res.end();
      return;
    }
    const pathname = decodeURIComponent(
      new URL(req.url || "/", "http://localhost").pathname,
    );
    const file = resolve(
      root,
      "." + (pathname === "/" ? "/index.html" : pathname),
    );
    if (!file.startsWith(root + sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    const content = await readFile(file);
    res.writeHead(200, {
      "Content-Type": types[extname(file)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(req.method === "HEAD" ? undefined : content);
  } catch {
    res.writeHead(404);
    res.end("File not found. Run npm run build first.");
  }
});
server.listen(port, "127.0.0.1", () =>
  console.log("PaLEAsta! local app: http://127.0.0.1:" + port),
);

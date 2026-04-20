import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Proxy endpoint for CK Ultra Hack API
  app.post("/api/proxy-ck", async (req, res) => {
    try {
      const bodyData = req.body || {};
      const timestamp = Math.floor(Date.now() / 1000);

      const body = {
        ...bodyData,
        timestamp: bodyData.timestamp || timestamp
      };

      const domain = req.headers['x-upstream-domain'] || "ckygjf6r.com";
      const baseUrl = `https://${domain}`;
      
      const response = await fetch(`${baseUrl}/api/webapi/GetNoaverageEmerdList`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          "Accept": "application/json, text/plain, */*",
          "Authorization": req.headers.authorization || "",
          "Ar-Origin": baseUrl,
          "Origin": baseUrl,
          "Referer": `${baseUrl}/`,
          "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
          "X-Requested-With": "XMLHttpRequest",
          "Accept-Language": "en-US,en;q=0.9",
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "cross-site",
          "Priority": "u=1, i"
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000)
      } as any);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Upstream error (${response.status}):`, errorText);
        return res.status(response.status).json({ error: "Upstream API error", details: errorText });
      }

      const data = await response.json();
      return res.json(data);
    } catch (err: any) {
      console.error("Proxy error:", err.message);
      return res.status(500).json({ error: "Failed to fetch from CK API", message: err.message });
    }
  });

  // Proxy endpoint for TRX API
  app.post("/api/proxy-trx", async (req, res) => {
    try {
      const bodyData = req.body || {};
      const timestamp = Math.floor(Date.now() / 1000);

      const body = {
        ...bodyData,
        timestamp: bodyData.timestamp || timestamp
      };

      const domain = req.headers['x-upstream-domain'] || "ckygjf6r.com";
      const baseUrl = `https://${domain}`;

      const response = await fetch(`${baseUrl}/api/webapi/GetTRXNoaverageEmerdList`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          "Accept": "application/json, text/plain, */*",
          "Authorization": req.headers.authorization || "",
          "Ar-Origin": baseUrl,
          "Origin": baseUrl,
          "Referer": `${baseUrl}/`,
          "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
          "X-Requested-With": "XMLHttpRequest",
          "Accept-Language": "en-US,en;q=0.9",
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "cross-site"
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000)
      } as any);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Upstream error (${response.status}):`, errorText);
        return res.status(response.status).json({ error: "Upstream API error", details: errorText });
      }

      const data = await response.json();
      return res.json(data);
    } catch (err: any) {
      console.error("Proxy error:", err.message);
      return res.status(500).json({ error: "Failed to fetch from TRX API", message: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

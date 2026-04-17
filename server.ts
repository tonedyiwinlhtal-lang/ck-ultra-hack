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
      const { typeId = 1 } = req.body;
      const timestamp = Math.floor(Date.now() / 1000);
      
      // Mode-specific signatures
      const config = typeId === 30 ? {
        random: "5fb4c1ab71314e2a949693aad756e8eb",
        signature: "945BAE7252F35D7060AEBAA63E0C9C2E"
      } : {
        random: "d94b2f0328ad4ed79835b0ab6f2face2",
        signature: "07A0AFC40AF08DF42F50DFB8EBF21251"
      };

      const body = {
        pageSize: 10,
        pageNo: 1,
        typeId: typeId,
        language: 0,
        random: config.random,
        signature: config.signature,
        timestamp: timestamp
      };

      const response = await fetch("https://ckygjf6r.com/api/webapi/GetNoaverageEmerdList", {
        method: "POST",
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          "Accept": "application/json, text/plain, */*",
          "Authorization": req.headers.authorization || "",
          "Ar-Origin": "https://www.cklottery.online",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Upstream error (${response.status}):`, errorText);
        return res.status(response.status).json({ error: "Upstream API error", details: errorText });
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Proxy error:", error.message);
      res.status(500).json({ error: "Failed to fetch from CK API", message: error.message });
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

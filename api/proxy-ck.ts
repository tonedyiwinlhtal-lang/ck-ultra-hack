import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const bodyData = req.body || {};
    const timestamp = Math.floor(Date.now() / 1000);
    
    const body = {
      ...bodyData,
      timestamp: bodyData.timestamp || timestamp
    };

    const domain = (req.headers['x-upstream-domain'] as string) || "ckygjf6r.com";
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
      // @ts-ignore - AbortSignal.timeout is available in Node 18+
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: "Upstream API error", details: errorText });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to fetch from CK API", message: error.message });
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      typeId = 1, 
      signature: clientSignature, 
      random: clientRandom 
    } = req.body;
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Mode-specific signatures
    const config = typeId === 30 ? {
      random: clientRandom || "aa618332d21c4f9284608bc44ea56f99",
      signature: clientSignature || "E93CB5E32C267A49A1090589E4E5CB29"
    } : {
      random: clientRandom || "f668d82e6eb14697b0dac9fa1a180658",
      signature: clientSignature || "4EF4BD40988824BEFD7B012D1E5C2F84"
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
        "Ar-Origin": "https://www.cklottery.top",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      body: JSON.stringify(body)
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

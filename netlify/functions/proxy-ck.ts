import { Handler } from '@netlify/functions';

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const bodyData = JSON.parse(event.body || '{}');
    const timestamp = Math.floor(Date.now() / 1000);
    
    // For 30s mode (typeId 30), we must not add pageSize if it wasn't in the signature
    // For 60s mode (typeId 1), we include it.
    // The most robust way is to just pass through what the frontend sends.
    const upstreamBody = {
      language: 0,
      ...bodyData,
      timestamp: bodyData.timestamp || timestamp
    };

    const authHeader = event.headers.authorization || event.headers.Authorization || "";

    const response = await fetch("https://ckygjf6r.com/api/webapi/GetNoaverageEmerdList", {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        "Accept": "application/json, text/plain, */*",
        "Authorization": authHeader,
        "Ar-Origin": "https://www.cklottery.top",
        "Referer": "https://www.cklottery.top/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      body: JSON.stringify(upstreamBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: "Upstream API error", details: errorText })
      };
    }

    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch from CK API", message: error.message })
    };
  }
};

export { handler };

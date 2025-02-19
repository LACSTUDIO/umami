// api/umami-proxy.js
export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 如果是 OPTIONS 请求，直接返回
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { query: { websiteId }, method } = req;

    if (method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const token = process.env.UMAMI_TOKEN; // 从环境变量中获取 token
    const umiId = websiteId || 'a4e8c20f-d2e8-4b10-bdf5-2d52c389fd45';
    const umiTime = Date.now();

    const umiUrl = `https://umami.xn--5brr03o.top/api/websites/${umiId}/stats?startAt=0&endAt=${umiTime}`;

    const response = await fetch(umiUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: `API Error: ${error.message}` });
  }
}

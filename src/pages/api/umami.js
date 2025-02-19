// api/umami.js
export default async function handler(req, res) {
  try {
    const { query: { websiteId }, method } = req;

    if (method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const token = process.env.API_TOKEN; // 确保环境变量名称正确
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

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: `API Error: ${error.message}` });
  }
}

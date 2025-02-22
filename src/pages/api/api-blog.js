addEventListener('fetch', event => {
  event.respondWith(handleRequest(event));
});

const API_BASE_URL = 'https://umami.xn--5brr03o.top';
const token = process.env.API_TOKEN;
const WEBSITE_ID = '291d8c16-1fd0-4c8c-9b6b-a902b90f31fe';
const CACHE_KEY = 'umami_cache';
const CACHE_TIME = 600; // Cache time in seconds

async function fetchUmamiData(startAt, endAt) {
  const url = `${API_BASE_URL}/api/websites/${WEBSITE_ID}/stats?startAt=${startAt}&endAt=${endAt}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    console.error(`Error fetching data: ${response.statusText}`);
    return null;
  }

  return response.json();
}

async function handleRequest(event) {
  const cache = await caches.open(CACHE_KEY);
  const cachedResponse = await cache.match(event.request);

  if (cachedResponse) {
    return cachedResponse;
  }

  const now = Date.now();
  const todayStart = new Date(now).setHours(0, 0, 0, 0);
  const yesterdayStart = new Date(now - 86400000).setHours(0, 0, 0, 0);
  const lastMonthStart = new Date(now).setMonth(new Date(now).getMonth() - 1);
  const lastYearStart = new Date(now).setFullYear(new Date(now).getFullYear() - 1);

  const [todayData, yesterdayData, lastMonthData, lastYearData] = await Promise.all([
    fetchUmamiData(todayStart, now),
    fetchUmamiData(yesterdayStart, todayStart),
    fetchUmamiData(lastMonthStart, now),
    fetchUmamiData(lastYearStart, now)
  ]);

  const responseData = {
    today_uv: todayData?.visitors?.value ?? null,
    today_pv: todayData?.pageviews?.value ?? null,
    yesterday_uv: yesterdayData?.visitors?.value ?? null,
    yesterday_pv: yesterdayData?.pageviews?.value ?? null,
    last_month_pv: lastMonthData?.pageviews?.value ?? null,
    last_year_pv: lastYearData?.pageviews?.value ?? null
  };

  const jsonResponse = new Response(JSON.stringify(responseData), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });

  event.waitUntil(cache.put(event.request, jsonResponse.clone()));

  return jsonResponse;
}

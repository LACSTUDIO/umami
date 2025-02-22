addEventListener('fetch', event => {
  event.respondWith(handleRequest(event));
});

const API_BASE_URL = '<url id="cussu7tf8r31oc88b460" type="url" status="parsed" title="Login | Umami" wc="25">https://umami.xn--5brr03o.top</url>';
const TOKEN = process.env.API_TOKEN;
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

  try {
    const data = await response.json();
    return {
      visitors: data?.visitors?.value ?? null,
      pageviews: data?.pageviews?.value ?? null
    };
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return null;
  }
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

  const todayData = await fetchUmamiData(todayStart, now);
  const yesterdayData = await fetchUmamiData(yesterdayStart, todayStart);
  const lastMonthData = await fetchUmamiData(lastMonthStart, now);
  const lastYearData = await fetchUmamiData(lastYearStart, now);

  const responseData = {
    today_uv: todayData?.visitors ?? null,
    today_pv: todayData?.pageviews ?? null,
    yesterday_uv: yesterdayData?.visitors ?? null,
    yesterday_pv: yesterdayData?.pageviews ?? null,
    last_month_pv: lastMonthData?.pageviews ?? null,
    last_year_pv: lastYearData?.pageviews ?? null
  };

  const jsonResponse = new Response(JSON.stringify(responseData), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });

  event.waitUntil(cache.put(event.request, jsonResponse.clone()));

  return jsonResponse;
}

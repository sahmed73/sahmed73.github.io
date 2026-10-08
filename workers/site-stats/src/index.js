// Password-protected visit data for sahmed73.github.io, served by a Cloudflare Worker.
// The dashboard itself is https://sahmed73.github.io/stats/, which calls /api/summary here.
// Secrets (set with `wrangler secret put`): CF_ACCOUNT_ID, CF_API_TOKEN, DASH_PASSWORD.

const API = "https://api.cloudflare.com/client/v4/graphql";
const MAX_DAYS = 180;
// Cloudflare samples multi-day queries heavily, so ask for one day at a time,
// a week of days per request.
const DAYS_PER_REQUEST = 7;
const CACHE_MS = 60 * 1000;
const DIMENSIONS = {
  daily: "date",
  pages: "requestPath",
  referrers: "refererHost",
  countries: "countryName",
  devices: "deviceType",
};
const SECURITY_HEADERS = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};
const cache = new Map();

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/") return Response.redirect(env.DASHBOARD_URL, 302);
    if (url.pathname !== "/api/summary") {
      return new Response("Not found.", { status: 404, headers: SECURITY_HEADERS });
    }
    const cors = corsHeaders(request, env);
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: { ...cors, "Access-Control-Allow-Methods": "GET", "Access-Control-Allow-Headers": "Authorization", "Access-Control-Max-Age": "86400" },
      });
    }
    if (!(await authorized(request, env))) return json({ error: "Wrong password." }, 401, cors);
    const days = Math.min(Math.max(parseInt(url.searchParams.get("days"), 10) || 30, 1), MAX_DAYS);
    try {
      return json(await cachedSummary(env, days), 200, cors);
    } catch (error) {
      return json({ error: error.message }, 502, cors);
    }
  },
};

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((o) => o.trim());
  return origin && allowed.includes(origin) ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : { Vary: "Origin" };
}

async function authorized(request, env) {
  const header = request.headers.get("Authorization") || "";
  if (!env.DASH_PASSWORD || !header.startsWith("Basic ")) return false;
  let decoded;
  try {
    decoded = atob(header.slice(6));
  } catch {
    return false;
  }
  const password = decoded.slice(decoded.indexOf(":") + 1);
  const encoder = new TextEncoder();
  const given = encoder.encode(password);
  const expected = encoder.encode(env.DASH_PASSWORD);
  if (given.byteLength !== expected.byteLength) {
    crypto.subtle.timingSafeEqual(expected, expected);
    return false;
  }
  return crypto.subtle.timingSafeEqual(given, expected);
}

function json(body, status, extraHeaders) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...SECURITY_HEADERS, ...extraHeaders, "Content-Type": "application/json" },
  });
}

async function cachedSummary(env, days) {
  const hit = cache.get(days);
  if (hit && Date.now() - hit.time < CACHE_MS) return hit.value;
  const value = await summary(env, days);
  cache.set(days, { time: Date.now(), value });
  return value;
}

async function summary(env, days) {
  const host = env.SITE_HOST;
  const today = new Date();
  const dates = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
    dates.push(d.toISOString().slice(0, 10));
  }
  const batches = [];
  for (let i = 0; i < dates.length; i += DAYS_PER_REQUEST) batches.push(dates.slice(i, i + DAYS_PER_REQUEST));
  const results = await Promise.all(batches.map((batch) => query(env, host, batch)));

  const groups = Object.fromEntries(Object.keys(DIMENSIONS).map((name) => [name, new Map()]));
  const sampled = new Set();
  results.forEach((data, b) => {
    for (const day of batches[b]) {
      for (const [name, dim] of Object.entries(DIMENSIONS)) {
        for (const group of data[`${name}_${day.replaceAll("-", "")}`]) {
          const key = group.dimensions[dim] || "";
          const row = groups[name].get(key) || { key, visits: 0, views: 0 };
          row.visits += group.sum.visits;
          row.views += group.count;
          groups[name].set(key, row);
          if (group.avg.sampleInterval > 1) sampled.add(day);
        }
      }
    }
  });

  const ranked = (name) => [...groups[name].values()].sort((a, b) => b.visits - a.visits || b.views - a.views);
  const daily = dates.map((date) => {
    const row = groups.daily.get(date) || { visits: 0, views: 0 };
    return { date, visits: row.visits, views: row.views, sampled: sampled.has(date) };
  });
  return {
    host,
    days,
    start: dates[0],
    end: dates[dates.length - 1],
    generated: new Date().toISOString(),
    totals: {
      visits: daily.reduce((n, d) => n + d.visits, 0),
      views: daily.reduce((n, d) => n + d.views, 0),
    },
    sampledDays: sampled.size,
    daily,
    pages: ranked("pages"),
    referrers: ranked("referrers"),
    countries: ranked("countries"),
    devices: ranked("devices"),
  };
}

async function query(env, host, days) {
  const groups = days.flatMap((day) =>
    Object.entries(DIMENSIONS).map(
      ([name, dim]) =>
        `${name}_${day.replaceAll("-", "")}: rumPageloadEventsAdaptiveGroups(limit: 1000, ` +
        `filter: {date: "${day}", requestHost: $host}) ` +
        `{ count sum { visits } avg { sampleInterval } dimensions { ${dim} } }`
    )
  );
  const response = await fetch(API, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.CF_API_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `query ($account: String!, $host: String!) { viewer { accounts(filter: {accountTag: $account}) { ${groups.join("\n")} } } }`,
      variables: { account: env.CF_ACCOUNT_ID, host },
    }),
  });
  if (!response.ok) throw new Error(`Cloudflare API returned HTTP ${response.status}`);
  const result = await response.json();
  if (result.errors && result.errors.length) throw new Error(result.errors.map((e) => e.message).join("; "));
  const accounts = result.data.viewer.accounts;
  if (!accounts.length) throw new Error("No analytics data for this account.");
  return accounts[0];
}

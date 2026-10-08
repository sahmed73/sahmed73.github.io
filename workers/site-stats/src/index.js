// Private visit dashboard for sahmed73.github.io, served by a Cloudflare Worker.
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
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
};
const cache = new Map();

export default {
  async fetch(request, env) {
    if (!(await authorized(request, env))) {
      return new Response("Password required.", {
        status: 401,
        headers: { ...SECURITY_HEADERS, "WWW-Authenticate": 'Basic realm="Site stats", charset="UTF-8"' },
      });
    }
    const url = new URL(request.url);
    if (url.pathname === "/") {
      return new Response(PAGE, {
        headers: {
          ...SECURITY_HEADERS,
          "Content-Type": "text/html; charset=utf-8",
          "Content-Security-Policy": "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self'",
        },
      });
    }
    if (url.pathname === "/api/summary") {
      const days = Math.min(Math.max(parseInt(url.searchParams.get("days"), 10) || 30, 1), MAX_DAYS);
      try {
        return json(await cachedSummary(env, days));
      } catch (error) {
        return json({ error: error.message }, 502);
      }
    }
    return new Response("Not found.", { status: 404, headers: SECURITY_HEADERS });
  },
};

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

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...SECURITY_HEADERS, "Content-Type": "application/json" },
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

const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Site stats</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap">
<style>
:root {
  color-scheme: light;
  --surface: #ffffff;
  --text: #1f1f1f;
  --muted: #5e5e5e;
  --rule: #e3e3e3;
  --grid: #ececea;
  --link: #1d4f91;
  --series-1: #2a78d6;
  --tooltip-bg: #ffffff;
}
@media (prefers-color-scheme: dark) {
  :root:where(:not([data-theme="light"])) {
    color-scheme: dark;
    --surface: #1a1a19;
    --text: #f2f2f0;
    --muted: #b4b3ab;
    --rule: #34342f;
    --grid: #2a2a27;
    --link: #8db4ec;
    --series-1: #3987e5;
    --tooltip-bg: #252523;
  }
}
:root[data-theme="dark"] {
  color-scheme: dark;
  --surface: #1a1a19;
  --text: #f2f2f0;
  --muted: #b4b3ab;
  --rule: #34342f;
  --grid: #2a2a27;
  --link: #8db4ec;
  --series-1: #3987e5;
  --tooltip-bg: #252523;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--surface); color: var(--text); font-family: "Source Serif 4", Georgia, serif; font-size: 17px; line-height: 1.5; }
main { max-width: 960px; margin: 0 auto; padding: 28px 16px 48px; }
h1 { font-size: 1.6rem; font-weight: 600; margin: 0 0 4px; }
h2 { font-size: 1.1rem; font-weight: 600; margin: 0 0 10px; }
a { color: var(--link); }
.sub, .note, .updated { color: var(--muted); }
.sub { margin: 0 0 20px; }
.controls { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 24px; }
.controls button { font: inherit; font-size: .9rem; padding: 4px 12px; border: 1px solid var(--rule); background: transparent; color: var(--text); border-radius: 4px; cursor: pointer; }
.controls button[aria-pressed="true"] { border-color: var(--text); font-weight: 600; }
.controls .updated { margin-left: auto; font-size: .85rem; }
.tiles { display: flex; flex-wrap: wrap; gap: 16px 48px; margin-bottom: 8px; }
.tile .value { font-size: 2.2rem; font-weight: 600; line-height: 1.1; font-variant-numeric: tabular-nums; }
.tile .label { color: var(--muted); font-size: .9rem; }
.note { font-size: .85rem; margin: 8px 0 28px; }
.chart-wrap { position: relative; margin-bottom: 8px; }
.chart-wrap svg { display: block; width: 100%; height: 240px; overflow: visible; }
.chart-wrap svg:focus-visible { outline: 2px solid var(--link); outline-offset: 4px; }
.axis-label { fill: var(--muted); font-size: 12px; font-family: inherit; }
.bar { fill: var(--series-1); }
.bar.active { filter: brightness(1.18); }
.tooltip { position: absolute; pointer-events: none; background: var(--tooltip-bg); border: 1px solid var(--rule); border-radius: 4px; padding: 6px 10px; font-size: .85rem; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,.12); display: none; }
.tooltip strong { font-size: 1rem; }
.tooltip .key { display: inline-block; width: 12px; height: 2px; background: var(--series-1); vertical-align: middle; margin-right: 6px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px 40px; margin-top: 28px; }
table { width: 100%; border-collapse: collapse; font-size: .92rem; }
th, td { text-align: left; padding: 5px 0; border-bottom: 1px solid var(--rule); }
th { color: var(--muted); font-weight: 400; }
td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; padding-left: 12px; width: 4.5em; }
td.key { overflow-wrap: anywhere; }
details { margin-top: 28px; }
summary { cursor: pointer; font-weight: 600; }
.error { color: #b3261e; }
@media (max-width: 700px) { .grid { grid-template-columns: 1fr; } .controls .updated { margin-left: 0; width: 100%; } }
</style>
</head>
<body>
<main>
  <h1>Site stats</h1>
  <p class="sub" id="host">Loading…</p>
  <div class="controls" role="group" aria-label="Time range">
    <button type="button" data-days="7">7 days</button>
    <button type="button" data-days="30">30 days</button>
    <button type="button" data-days="90">90 days</button>
    <button type="button" data-days="180">180 days</button>
    <button type="button" id="refresh">Refresh</button>
    <span class="updated" id="updated"></span>
  </div>
  <div class="tiles">
    <div class="tile"><div class="value" id="visits">–</div><div class="label">Visits</div></div>
    <div class="tile"><div class="value" id="views">–</div><div class="label">Page views</div></div>
    <div class="tile"><div class="value" id="today">–</div><div class="label">Page views today (UTC)</div></div>
  </div>
  <p class="note" id="note"></p>
  <h2>Page views per day</h2>
  <div class="chart-wrap" id="chart-wrap"><svg id="chart" tabindex="0" role="img"></svg><div class="tooltip" id="tooltip"></div></div>
  <div class="grid">
    <section><h2>Top pages</h2><table id="pages"></table></section>
    <section><h2>Referrers</h2><table id="referrers"></table></section>
    <section><h2>Countries</h2><table id="countries"></table></section>
    <section><h2>Devices</h2><table id="devices"></table></section>
  </div>
  <details><summary>Daily numbers</summary><table id="daily"></table></details>
  <p class="note">A visit is a page view arriving from outside the site; page views also count clicks within it. Data from Cloudflare Web Analytics, refreshed on every load (cached up to 1 minute).</p>
</main>
<script>
(function () {
  var NS = "http://www.w3.org/2000/svg";
  var state = { days: 30, data: null, active: -1 };
  var fmt = new Intl.NumberFormat("en-US");
  var monthDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  var fullDate = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  try { state.days = parseInt(localStorage.getItem("stats-days"), 10) || 30; } catch (e) {}

  function $(id) { return document.getElementById(id); }
  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    for (var k in attrs || {}) node.setAttribute(k, attrs[k]);
    if (text != null) node.textContent = text;
    return node;
  }
  function svg(tag, attrs) {
    var node = document.createElementNS(NS, tag);
    for (var k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }
  function day(iso) { return new Date(iso + "T00:00:00Z"); }

  function load() {
    document.querySelectorAll("[data-days]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(parseInt(b.dataset.days, 10) === state.days));
    });
    $("updated").textContent = "Loading…";
    fetch(location.origin + "/api/summary?days=" + state.days, { credentials: "same-origin" })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.error) throw new Error(data.error);
        state.data = data;
        render();
      })
      .catch(function (err) {
        $("updated").textContent = "";
        $("note").className = "note error";
        $("note").textContent = "Could not load data: " + err.message;
      });
  }

  function render() {
    var d = state.data;
    $("host").textContent = d.host + " · " + monthDay.format(day(d.start)) + " to " + monthDay.format(day(d.end)) + " (UTC dates)";
    $("visits").textContent = fmt.format(d.totals.visits);
    $("views").textContent = fmt.format(d.totals.views);
    $("today").textContent = fmt.format(d.daily[d.daily.length - 1].views);
    $("updated").textContent = "Updated " + new Date(d.generated).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    $("note").className = "note";
    $("note").textContent = d.sampledDays
      ? "≈ Cloudflare sampled " + d.sampledDays + " of these days (mostly older ones), so their counts are estimates."
      : "";
    drawChart();
    table("pages", d.pages, "Page", function (k) { return k || "(unknown)"; });
    table("referrers", d.referrers, "Source", function (k) {
      return !k ? "Direct or unknown" : k === d.host ? "Your own pages (internal clicks)" : k;
    });
    table("countries", d.countries, "Country", function (k) { return k || "(unknown)"; });
    table("devices", d.devices, "Device", function (k) { return k || "(unknown)"; });
    dailyTable();
  }

  function table(id, rows, label, name) {
    var t = $(id);
    t.replaceChildren();
    var head = el("tr");
    head.append(el("th", {}, label), el("th", { class: "num" }, "Visits"), el("th", { class: "num" }, "Views"));
    t.append(head);
    if (!rows.length) { var empty = el("tr"); empty.append(el("td", { colspan: "3" }, "No data")); t.append(empty); return; }
    rows.slice(0, 12).forEach(function (r) {
      var tr = el("tr");
      tr.append(el("td", { class: "key" }, name(r.key)), el("td", { class: "num" }, fmt.format(r.visits)), el("td", { class: "num" }, fmt.format(r.views)));
      t.append(tr);
    });
  }

  function dailyTable() {
    var t = $("daily");
    t.replaceChildren();
    var head = el("tr");
    head.append(el("th", {}, "Date (UTC)"), el("th", { class: "num" }, "Visits"), el("th", { class: "num" }, "Views"));
    t.append(head);
    state.data.daily.slice().reverse().forEach(function (r) {
      var tr = el("tr");
      tr.append(el("td", {}, fullDate.format(day(r.date)) + (r.sampled ? " ≈" : "")), el("td", { class: "num" }, fmt.format(r.visits)), el("td", { class: "num" }, fmt.format(r.views)));
      t.append(tr);
    });
  }

  function niceMax(v) {
    if (v <= 4) return 4;
    var p = Math.pow(10, Math.floor(Math.log10(v)));
    var steps = [1, 2, 2.5, 5, 10];
    for (var i = 0; i < steps.length; i++) if (steps[i] * p >= v) return steps[i] * p;
    return 10 * p;
  }

  function topRounded(x, y, w, h, r) {
    r = Math.min(r, w / 2, h);
    return "M" + x + "," + (y + h) + "V" + (y + r) + "Q" + x + "," + y + " " + (x + r) + "," + y +
      "H" + (x + w - r) + "Q" + (x + w) + "," + y + " " + (x + w) + "," + (y + r) + "V" + (y + h) + "Z";
  }

  function drawChart() {
    var chart = $("chart"), data = state.data.daily;
    var width = chart.clientWidth || 600, height = 240;
    var left = 36, right = 8, top = 8, bottom = 26;
    var plotW = width - left - right, plotH = height - top - bottom;
    var max = niceMax(Math.max.apply(null, data.map(function (d) { return d.views; })));
    var step = plotW / data.length, gap = step > 6 ? 2 : step > 3 ? 1 : 0;
    var barW = Math.max(step - gap, 1);
    chart.replaceChildren();
    chart.setAttribute("viewBox", "0 0 " + width + " " + height);
    chart.setAttribute("aria-label", "Bar chart of page views per day, " + state.data.days + " days. Use the left and right arrow keys to read each day.");

    for (var i = 0; i <= 4; i++) {
      var value = max * i / 4, y = top + plotH - plotH * i / 4;
      if (i > 0) chart.append(svg("line", { x1: left, x2: width - right, y1: y, y2: y, stroke: "var(--grid)", "stroke-width": 1 }));
      var label = svg("text", { x: left - 6, y: y + 4, "text-anchor": "end", class: "axis-label" });
      label.textContent = fmt.format(Math.round(value * 10) / 10);
      chart.append(label);
    }
    chart.append(svg("line", { x1: left, x2: width - right, y1: top + plotH, y2: top + plotH, stroke: "var(--rule)", "stroke-width": 1 }));

    var ticks = Math.min(data.length, Math.max(2, Math.floor(plotW / 90)));
    for (var t = 0; t < ticks; t++) {
      var idx = Math.round(t * (data.length - 1) / (ticks - 1));
      var tx = left + step * idx + step / 2;
      var anchor = t === 0 ? "start" : t === ticks - 1 ? "end" : "middle";
      var tl = svg("text", { x: t === 0 ? left : t === ticks - 1 ? width - right : tx, y: height - 6, "text-anchor": anchor, class: "axis-label" });
      tl.textContent = monthDay.format(day(data[idx].date));
      chart.append(tl);
    }

    data.forEach(function (d, i) {
      var x = left + step * i + gap / 2;
      if (d.views > 0) {
        var h = Math.max(plotH * d.views / max, 1);
        chart.append(svg("path", { d: topRounded(x, top + plotH - h, barW, h, 4), class: "bar", "data-i": i }));
      }
      var hit = svg("rect", { x: left + step * i, y: top, width: step, height: plotH, fill: "transparent", "data-i": i });
      chart.append(hit);
    });
    state.active = -1;
    $("tooltip").style.display = "none";
  }

  function show(i) {
    var data = state.data.daily, d = data[i], chart = $("chart"), tip = $("tooltip");
    state.active = i;
    chart.querySelectorAll(".bar").forEach(function (b) { b.classList.toggle("active", parseInt(b.dataset.i, 10) === i); });
    tip.replaceChildren();
    var line1 = el("div");
    line1.append(el("span", { class: "key" }), el("strong", {}, fmt.format(d.views)), document.createTextNode(" page views" + (d.sampled ? " (estimate)" : "")));
    tip.append(line1, el("div", {}, fmt.format(d.visits) + " visits"), el("div", { class: "updated" }, fullDate.format(day(d.date))));
    tip.style.display = "block";
    var width = chart.clientWidth, step = (width - 44) / data.length;
    var x = 36 + step * i + step / 2;
    var tipW = tip.offsetWidth;
    tip.style.left = Math.min(Math.max(x - tipW / 2, 0), width - tipW) + "px";
    tip.style.top = "0px";
  }

  function hide() {
    state.active = -1;
    $("tooltip").style.display = "none";
    $("chart").querySelectorAll(".bar.active").forEach(function (b) { b.classList.remove("active"); });
  }

  $("chart").addEventListener("pointermove", function (e) {
    var i = e.target.getAttribute("data-i");
    if (i !== null && parseInt(i, 10) !== state.active) show(parseInt(i, 10));
  });
  $("chart").addEventListener("pointerleave", hide);
  $("chart").addEventListener("focus", function () { if (state.data) show(state.data.daily.length - 1); });
  $("chart").addEventListener("blur", hide);
  $("chart").addEventListener("keydown", function (e) {
    if (!state.data) return;
    var n = state.data.daily.length;
    if (e.key === "ArrowLeft") { show(Math.max((state.active < 0 ? n : state.active) - 1, 0)); e.preventDefault(); }
    if (e.key === "ArrowRight") { show(Math.min(state.active + 1, n - 1)); e.preventDefault(); }
    if (e.key === "Escape") hide();
  });
  document.querySelectorAll("[data-days]").forEach(function (b) {
    b.addEventListener("click", function () {
      state.days = parseInt(b.dataset.days, 10);
      try { localStorage.setItem("stats-days", String(state.days)); } catch (e) {}
      load();
    });
  });
  $("refresh").addEventListener("click", load);
  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { if (state.data) drawChart(); }, 150);
  });
  load();
})();
</script>
</body>
</html>
`;

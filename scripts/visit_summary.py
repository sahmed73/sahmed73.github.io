"""Summarize site visits from Cloudflare Web Analytics.

Usage: python3 scripts/visit_summary.py [--days 30]

Reads CF_ACCOUNT_ID and CF_API_TOKEN from the environment or from
~/.config/cloudflare/analytics.env (KEY=value lines). The token needs only
the "Account Analytics: Read" permission.
"""
from collections import Counter
from datetime import date, timedelta
from pathlib import Path
import argparse
import json
import os
import sys
import urllib.error
import urllib.request

HOST = "sahmed73.github.io"
ENV_FILE = Path.home() / ".config/cloudflare/analytics.env"
API = "https://api.cloudflare.com/client/v4/graphql"
# Cloudflare samples multi-day queries heavily, so ask for one day at a time,
# a week of days per request.
DAYS_PER_REQUEST = 7
DIMENSIONS = {
    "daily": "date",
    "pages": "requestPath",
    "referrers": "refererHost",
    "countries": "countryName",
    "devices": "deviceType",
}


def build_query(days):
    groups = "\n".join(
        f'      {name}_{day:%Y%m%d}: rumPageloadEventsAdaptiveGroups(limit: 1000, '
        f'filter: {{date: "{day}", requestHost: $host}}) '
        f"{{ count sum {{ visits }} avg {{ sampleInterval }} dimensions {{ {dim} }} }}"
        for day in days for name, dim in DIMENSIONS.items()
    )
    return ("query ($account: String!, $host: String!) {\n  viewer {\n"
            "    accounts(filter: {accountTag: $account}) {\n" + groups + "\n    }\n  }\n}")


def credentials():
    values = {}
    if ENV_FILE.is_file():
        for line in ENV_FILE.read_text().splitlines():
            key, sep, value = line.strip().partition("=")
            if sep and not key.startswith("#"):
                values[key.strip()] = value.strip().strip("'\"")
    values.update({k: v for k, v in os.environ.items() if k.startswith("CF_")})
    missing = [k for k in ("CF_ACCOUNT_ID", "CF_API_TOKEN") if not values.get(k)]
    if missing:
        sys.exit(f"Missing {', '.join(missing)}. Set them in the environment or in {ENV_FILE}.")
    return values["CF_ACCOUNT_ID"], values["CF_API_TOKEN"]


def query(account, token, days):
    body = json.dumps({"query": build_query(days),
                       "variables": {"account": account, "host": HOST}}).encode()
    request = urllib.request.Request(API, data=body, headers={
        "Authorization": f"Bearer {token}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            result = json.load(response)
    except urllib.error.HTTPError as error:
        sys.exit(f"Cloudflare API returned HTTP {error.code}: {error.read().decode()[:300]}")
    if result.get("errors"):
        sys.exit("Cloudflare API error: " + "; ".join(e["message"] for e in result["errors"]))
    accounts = result["data"]["viewer"]["accounts"]
    if not accounts:
        sys.exit("No data for this account ID. Check CF_ACCOUNT_ID and the token's account access.")
    return accounts[0]


def collect(account, token, days):
    # Cloudflare dates are UTC; tomorrow's UTC date may already have data.
    end = date.today() + timedelta(days=1)
    first = end - timedelta(days=days)
    all_days = [first + timedelta(days=i) for i in range(days + 1)]
    totals = {name: {"views": Counter(), "visits": Counter()} for name in DIMENSIONS}
    sampled = set()
    for i in range(0, len(all_days), DAYS_PER_REQUEST):
        batch = all_days[i:i + DAYS_PER_REQUEST]
        data = query(account, token, batch)
        for day in batch:
            for name, dim in DIMENSIONS.items():
                for group in data[f"{name}_{day:%Y%m%d}"]:
                    key = group["dimensions"][dim] or "(none)"
                    totals[name]["views"][key] += group["count"]
                    totals[name]["visits"][key] += group["sum"]["visits"]
                    if group["avg"]["sampleInterval"] > 1:
                        sampled.add(day)
    return first, end, totals, sampled


def table(title, rows, limit=10):
    print(f"\n{title}")
    if not rows:
        print("  (no data)")
        return
    width = max(len(str(key)) for key, _, _ in rows[:limit])
    print(f"  {'':{width}}  {'visits':>7}  {'views':>7}")
    for key, visits, views in rows[:limit]:
        print(f"  {str(key):{width}}  {visits:>7}  {views:>7}")


def ranked(group):
    return sorted(((k, group["visits"][k], group["views"][k]) for k in group["views"]),
                  key=lambda row: (-row[1], -row[2], str(row[0])))


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--days", type=int, default=30, help="days to include, ending today (max 180)")
    days = min(max(parser.parse_args().days, 1), 180)
    first, end, totals, sampled = collect(*credentials(), days)

    daily = totals["daily"]
    print(f"{HOST}: {first:%b %-d, %Y} to {end:%b %-d, %Y} (UTC dates)")
    print(f"Visits: {sum(daily['visits'].values())}   Page views: {sum(daily['views'].values())}")
    print("A visit is a page view arriving from outside the site; page views include clicks within it.")
    if sampled:
        print(f"Estimated: Cloudflare sampled {len(sampled)} of these days "
              f"(mostly older ones), so their counts are approximate.")

    weekly = {"views": Counter(), "visits": Counter()}
    for day, views in daily["views"].items():
        week = date.fromisoformat(day) - timedelta(days=date.fromisoformat(day).weekday())
        weekly["views"][week] += views
        weekly["visits"][week] += daily["visits"][day]
    week = end - timedelta(days=end.weekday())
    rows = []
    while week + timedelta(days=6) >= first:
        rows.append((f"{week:%b %d}", weekly["visits"][week], weekly["views"][week]))
        week -= timedelta(days=7)
    table("By week (starting Monday)", rows, limit=26)
    table("Top pages", ranked(totals["pages"]))
    table("Referrers", ranked(totals["referrers"]))
    table("Countries", ranked(totals["countries"]))
    table("Devices", ranked(totals["devices"]))


if __name__ == "__main__":
    main()

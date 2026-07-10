/**
 * Materials Cloud — Plausible statistics exporter.
 *
 * JS port of scripts/stats.py. Instead of rendering matplotlib PNGs, this
 * fetches the same Plausible data and writes the underlying tabulated data as
 * CSV files (plotting can be layered on later).
 *
 * Requirements: Node 18+ (uses the built-in global `fetch` and
 * `Intl.DisplayNames`, so there are no extra npm dependencies).
 *
 * Usage:
 *   PLAUSIBLE_API_TOKEN=xxxx npm run stats
 *
 * Optional env vars:
 *   STATS_PERIOD       Plausible period (default "12mo")
 *   STATS_OUTPUT_DIR   Output directory (default public/data/plausible/<YYYY_MM_DD>)
 *
 * Get the token from https://plausible.io/settings (API keys section).
 */

import fs from "node:fs";
import path from "node:path";

// --- Country groupings (kept in sync with stats.py) ---------------------------

// EU member states.
const EU = [
  "DE", "IT", "FR", "ES", "BE", "NL", "AT", "SE", "DK", "PL",
  "PT", "FI", "IE", "GR", "CZ", "HR", "LU", "LV", "SI", "HU",
  "RO", "SK", "BG", "LT", "EE", "CY",
];

// Horizon Europe associated countries. List taken from:
// https://ec.europa.eu/info/funding-tenders/opportunities/docs/2021-2027/common/guidance/list-3rd-country-participation_horizon-euratom_en.pdf
const HE_ASSOCIATED = [
  "AL", "AM", "BA", "EG", "FO", "GE", "IS", "XK", "MD", "ME",
  "MK", "NO", "RS", "TR", "UA", "GB", "IL", "TN", "NZ", "MA",
  "KR", "CA", "CH",
];

const EU_HE = new Set([...EU, ...HE_ASSOCIATED]);

// --- Sites --------------------------------------------------------------------

const SITES = [
  {
    name: "mc_all",
    hostname: "plausible-rollup.materialscloud.org",
    title: "Materials Cloud (all)",
  },
  {
    name: "mc_archive",
    hostname: "archive.materialscloud.org",
    title: "Materials Cloud Archive",
  },
];

// --- Helpers ------------------------------------------------------------------

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

/** Resolve an ISO alpha-2 code to a country name, falling back to the code. */
function getCountryName(code) {
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code; // e.g. non-standard codes like "XK"
  }
}

/** Serialize an array of row objects to a CSV string (RFC-4180 quoting). */
function toCsv(headers, rows) {
  const escape = (value) => {
    const s = String(value ?? "");
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return lines.join("\n") + "\n";
}

async function plausibleGet(url, token) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Plausible request failed (${response.status} ${response.statusText}) for ${url}\n${body}`,
    );
  }
  return response.json();
}

// --- Data transforms ----------------------------------------------------------

/** Timeseries results -> [{ month: "YYYY-MM", visitors }]. */
function visitorsByMonth(results) {
  const byMonth = new Map();
  for (const { date, visitors } of results) {
    const month = date.slice(0, 7); // YYYY-MM
    byMonth.set(month, (byMonth.get(month) ?? 0) + visitors);
  }
  return [...byMonth.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, visitors]) => ({ month, visitors }));
}

/** Country breakdown -> [{ country_code, country_name, visitors }] desc. */
function visitorsByCountry(results) {
  return results
    .map((d) => ({
      country_code: d.country,
      country_name: getCountryName(d.country),
      visitors: d.visitors,
    }))
    .sort((a, b) => b.visitors - a.visitors);
}

/**
 * Country breakdown -> region rollup. EU + Horizon-Europe-associated countries
 * are merged into a single "Europe and associated countries" bucket; the top 6
 * regions are kept and the remainder collapse into "others".
 */
function visitorsByRegion(results) {
  const EUROPE = "Europe and associated countries";
  const summary = new Map([[EUROPE, 0]]);

  for (const { country, visitors } of results) {
    if (EU_HE.has(country)) {
      summary.set(EUROPE, summary.get(EUROPE) + visitors);
    } else {
      summary.set(country, (summary.get(country) ?? 0) + visitors);
    }
  }

  const sorted = [...summary.entries()].sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, 6);
  const othersTotal = sorted.slice(6).reduce((sum, [, v]) => sum + v, 0);

  const rows = top.map(([region, visitors]) => ({
    region: region.length === 2 ? getCountryName(region) : region,
    visitors,
  }));
  if (othersTotal > 0) rows.push({ region: "others", visitors: othersTotal });
  return rows;
}

// --- Main ---------------------------------------------------------------------

async function main() {
  const token = process.env.PLAUSIBLE_API_TOKEN;
  if (!token) {
    console.error(
      "Error: PLAUSIBLE_API_TOKEN is not set.\n" +
        "Get a token from https://plausible.io/settings and run:\n" +
        "  PLAUSIBLE_API_TOKEN=xxxx npm run stats",
    );
    process.exit(1);
  }

  const period = process.env.STATS_PERIOD || "12mo";
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "_");
  const outDir =
    process.env.STATS_OUTPUT_DIR ||
    path.join("public", "data", "plausible", stamp);

  fs.mkdirSync(outDir, { recursive: true });

  for (const site of SITES) {
    console.log(`\n${site.title} (${site.hostname})`);

    const base = "https://plausible.io/api/v1/stats";
    const tsUrl = `${base}/timeseries?site_id=${site.hostname}&period=${period}`;
    // limit=1000 so the full country tail is included (default is 100), which
    // keeps the region rollup and "others" totals accurate.
    const countryUrl = `${base}/breakdown?site_id=${site.hostname}&period=${period}&property=visit:country&limit=1000`;

    const [ts, country] = await Promise.all([
      plausibleGet(tsUrl, token),
      plausibleGet(countryUrl, token),
    ]);

    const monthRows = visitorsByMonth(ts.results);
    const countryRows = visitorsByCountry(country.results);
    const regionRows = visitorsByRegion(country.results);

    const outputs = [
      {
        file: `${site.name}_visitors_by_month.csv`,
        csv: toCsv(["month", "visitors"], monthRows),
        summary: `${monthRows.length} months`,
      },
      {
        file: `${site.name}_visitors_by_country.csv`,
        csv: toCsv(["country_code", "country_name", "visitors"], countryRows),
        summary: `${countryRows.length} countries`,
      },
      {
        file: `${site.name}_visitors_by_region.csv`,
        csv: toCsv(["region", "visitors"], regionRows),
        summary: `${regionRows.length} regions`,
      },
    ];

    for (const { file, csv, summary } of outputs) {
      fs.writeFileSync(path.join(outDir, file), csv);
      console.log(`  wrote ${file} (${summary})`);
    }
  }

  console.log(`\nDone. CSVs written to ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

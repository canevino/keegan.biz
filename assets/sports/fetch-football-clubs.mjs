import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(here, "sports-data.json");

const BASES = [
  "https://www.fotmob.com/api/data",
  "https://www.fotmob.com/api"
];

const CLUBS = [
  { key: "liverpool", name: "Liverpool", teamId: 8650, leagueId: 47, leagueName: "Premier League" },
  { key: "hearts", name: "Hearts", teamId: 9860, leagueId: 64, leagueName: "Premiership" },
  { key: "preston", name: "Preston", teamId: 8411, leagueId: 48, leagueName: "Championship" },
  { key: "fiorentina", name: "Fiorentina", teamId: 8535, leagueId: 55, leagueName: "Serie A" },
  { key: "shakhtar", name: "Shakhtar", teamId: 9728, leagueId: 441, leagueName: "Premier League" }
];

async function getJson(pathname, params = {}) {
  const query = new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)])
  ).toString();

  let lastError;

  for (const base of BASES) {
    const url = `${base}/${pathname}${query ? `?${query}` : ""}`;

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "keegan.biz sports updater"
        }
      });

      if (!response.ok) {
        lastError = new Error(`${response.status} ${response.statusText}: ${url}`);
        continue;
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("json")) {
        lastError = new Error(`FotMob returned non-JSON content: ${url}`);
        continue;
      }

      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error(`FotMob request failed: ${pathname}`);
}

function teamFixtures(teamData) {
  const candidates = [
    teamData?.fixtures?.allFixtures?.fixtures,
    teamData?.fixtures?.fixtures,
    teamData?.overview?.fixtures,
    teamData?.matches
  ];

  for (const value of candidates) {
    if (Array.isArray(value)) return value;
  }

  return [];
}

function teamObject(match, side) {
  if (match?.[side]) return match[side];
  if (side === "home") return match?.homeTeam || match?.teams?.[0] || {};
  return match?.awayTeam || match?.teams?.[1] || {};
}

function matchTime(match) {
  const raw =
    match?.status?.utcTime ||
    match?.utcTime ||
    match?.time?.utcTime ||
    match?.date?.utcTime ||
    match?.matchTimeUTCDate;

  if (raw) {
    const value = Date.parse(raw);
    if (Number.isFinite(value)) return value;
  }

  const ts = Number(match?.timeTS);
  if (Number.isFinite(ts) && ts > 0) {
    return ts < 10_000_000_000 ? ts * 1000 : ts;
  }

  return NaN;
}

function isFinished(match) {
  return Boolean(match?.status?.finished ?? match?.finished ?? false);
}

function isCancelled(match) {
  return Boolean(match?.status?.cancelled ?? match?.cancelled ?? false);
}

function isStarted(match) {
  return Boolean(match?.status?.started ?? match?.started ?? false);
}

function competitionName(match) {
  return (
    match?.league?.name ||
    match?.tournament?.name ||
    match?.tournamentName ||
    match?.leagueName ||
    match?.parentLeagueName ||
    ""
  );
}

function startOfTodayEastern() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(now);

  const lookup = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return Date.parse(`${lookup.year}-${lookup.month}-${lookup.day}T00:00:00-04:00`);
}

function formatEastern(ms) {
  const date = new Date(ms);
  const now = new Date();

  const dayFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  const dayKey = dayFormatter.format(date);
  const todayKey = dayFormatter.format(now);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowKey = dayFormatter.format(tomorrow);

  const dateText = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(date);

  const timeText = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);

  if (dayKey === todayKey) return `today · ${dateText} · ${timeText} ET`;
  if (dayKey === tomorrowKey) return `tomorrow · ${dateText} · ${timeText} ET`;
  return `${dateText} · ${timeText} ET`;
}

function normalizeUpcoming(matches, teamId) {
  const lowerBound = startOfTodayEastern() - 3 * 60 * 60 * 1000;
  const upperBound = Date.now() + 370 * 24 * 60 * 60 * 1000;

  return matches
    .filter(match => {
      const home = teamObject(match, "home");
      const away = teamObject(match, "away");
      const time = matchTime(match);
      const involvesTeam = Number(home.id) === teamId || Number(away.id) === teamId;

      return (
        involvesTeam &&
        Number.isFinite(time) &&
        !isCancelled(match) &&
        (isStarted(match) || (!isFinished(match) && time >= lowerBound)) &&
        time <= upperBound
      );
    })
    .sort((a, b) => matchTime(a) - matchTime(b))
    .slice(0, 5)
    .map(match => {
      const home = teamObject(match, "home");
      const away = teamObject(match, "away");
      const time = matchTime(match);
      const live = isStarted(match) && !isFinished(match);

      return {
        id: String(match.id ?? match.matchId ?? ""),
        date: new Date(time).toISOString(),
        when: live ? "live" : formatEastern(time),
        status: live ? "live" : "scheduled",
        home: home.name || home.longName || "",
        away: away.name || away.longName || "",
        competition: competitionName(match)
      };
    });
}

function tableRows(tablePayload, teamId) {
  const tables = Array.isArray(tablePayload) ? tablePayload : [tablePayload].filter(Boolean);

  for (const item of tables) {
    const rows = item?.data?.table?.all || item?.table?.all || item?.data?.table || item?.all;
    if (!Array.isArray(rows) || rows.length < 2) continue;

    return rows.map((row, index) => ({
      rank: Number(row.idx ?? row.rank ?? index + 1),
      team: row.shortName || row.name || row.team?.name || "",
      points: row.pts ?? row.points ?? "",
      played: row.played ?? "",
      highlight: Number(row.id ?? row.team?.id ?? 0) === teamId
    }));
  }

  return [];
}

async function fetchClub(club) {
  const [teamData, tablePayload] = await Promise.all([
    getJson("teams", { id: club.teamId, ccode3: "USA" }),
    getJson("tltable", { leagueId: club.leagueId })
  ]);

  const upcoming = normalizeUpcoming(teamFixtures(teamData), club.teamId);
  const rows = tableRows(tablePayload, club.teamId);

  return {
    active: true,
    team: club.name,
    shortName: club.name,
    upcoming,
    standings: {
      title: club.leagueName,
      rows
    }
  };
}

const existing = JSON.parse(await fs.readFile(dataPath, "utf8"));
existing.updatedAt = new Date().toISOString();
existing.football ??= {};

for (const club of CLUBS) {
  try {
    existing.football[club.key] = await fetchClub(club);
    console.log(`${club.name}: updated`);
  } catch (error) {
    console.error(`${club.name}: ${error.message}`);
    existing.football[club.key] ??= {
      active: true,
      team: club.name,
      shortName: club.name,
      upcoming: [],
      standings: { title: club.leagueName, rows: [] }
    };
  }
}

await fs.writeFile(dataPath, `${JSON.stringify(existing, null, 2)}\n`, "utf8");

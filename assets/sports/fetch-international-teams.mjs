import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(here, "sports-data.json");

const BASES = [
  "https://www.fotmob.com/api/data",
  "https://www.fotmob.com/api"
];

const TEAMS = [
  { key: "lithuania", name: "Lithuania", teamId: 8254 },
  { key: "ukraine", name: "Ukraine", teamId: 6718 },
  { key: "england", name: "England", teamId: 8491 },
  { key: "ireland", name: "Ireland", teamId: 5791 }
];

const ACTIVE_WINDOW_DAYS = 14;
const SCAN_DAYS = 21;
const LIVE_GRACE_HOURS = 8;

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

function flattenDailyMatches(payload) {
  const leagues = Array.isArray(payload?.leagues) ? payload.leagues : [];

  return leagues.flatMap(league =>
    (Array.isArray(league?.matches) ? league.matches : []).map(match => ({
      ...match,
      league: {
        ...(match?.league || {}),
        id: match?.league?.id ?? match?.leagueId ?? league?.id,
        primaryId: match?.league?.primaryId ?? league?.primaryId ?? league?.id,
        name: match?.league?.name ?? league?.name ?? ""
      }
    }))
  );
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

function competitionId(match) {
  return Number(
    match?.league?.primaryId ??
    match?.league?.id ??
    match?.primaryId ??
    match?.leagueId ??
    match?.parentLeagueId ??
    0
  );
}

function easternDayKey(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function dateParamFromOffset(offsetDays) {
  const date = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${map.year}${map.month}${map.day}`;
}

function formatEastern(ms) {
  const date = new Date(ms);
  const now = new Date();
  const dayKey = easternDayKey(date);
  const todayKey = easternDayKey(now);
  const tomorrowKey = easternDayKey(new Date(now.getTime() + 24 * 60 * 60 * 1000));

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

function isLiveNow(match, time) {
  const now = Date.now();
  return (
    isStarted(match) &&
    !isFinished(match) &&
    !isCancelled(match) &&
    Number.isFinite(time) &&
    time >= now - LIVE_GRACE_HOURS * 60 * 60 * 1000 &&
    time <= now + LIVE_GRACE_HOURS * 60 * 60 * 1000
  );
}

function normalizeUpcoming(matches, teamId) {
  const now = Date.now();
  const upperBound = now + SCAN_DAYS * 24 * 60 * 60 * 1000;

  return matches
    .filter(match => {
      const home = teamObject(match, "home");
      const away = teamObject(match, "away");
      const time = matchTime(match);
      const involvesTeam = Number(home.id) === teamId || Number(away.id) === teamId;
      const live = isLiveNow(match, time);
      const scheduledFuture =
        !isStarted(match) &&
        !isFinished(match) &&
        Number.isFinite(time) &&
        time >= now - 10 * 60 * 1000;

      return (
        involvesTeam &&
        !isCancelled(match) &&
        (live || scheduledFuture) &&
        time <= upperBound
      );
    })
    .sort((a, b) => matchTime(a) - matchTime(b))
    .slice(0, 5)
    .map(match => {
      const home = teamObject(match, "home");
      const away = teamObject(match, "away");
      const time = matchTime(match);
      const live = isLiveNow(match, time);

      return {
        id: String(match.id ?? match.matchId ?? ""),
        date: new Date(time).toISOString(),
        when: live ? "live" : formatEastern(time),
        status: live ? "live" : "scheduled",
        home: home.name || home.longName || "",
        away: away.name || away.longName || "",
        competition: competitionName(match),
        competitionId: competitionId(match)
      };
    });
}

function tableRows(tablePayload, teamId) {
  const tables = Array.isArray(tablePayload) ? tablePayload : [tablePayload].filter(Boolean);

  for (const item of tables) {
    const rows = item?.data?.table?.all || item?.table?.all || item?.data?.table || item?.all;
    if (!Array.isArray(rows) || rows.length < 2) continue;

    const containsTeam = rows.some(row => Number(row.id ?? row.team?.id ?? 0) === teamId);
    if (!containsTeam) continue;

    return {
      title: item?.data?.leagueName || item?.leagueName || "",
      rows: rows.map((row, index) => ({
        rank: Number(row.idx ?? row.rank ?? index + 1),
        team: row.shortName || row.name || row.team?.name || "",
        points: row.pts ?? row.points ?? "",
        played: row.played ?? "",
        highlight: Number(row.id ?? row.team?.id ?? 0) === teamId
      }))
    };
  }

  return { title: "", rows: [] };
}

async function fetchCompetitionTable(upcoming, teamId) {
  const competitionIds = [...new Set(
    upcoming
      .map(fixture => Number(fixture.competitionId || 0))
      .filter(Boolean)
  )];

  for (const leagueId of competitionIds) {
    try {
      const payload = await getJson("tltable", { leagueId });
      const table = tableRows(payload, teamId);
      if (table.rows.length) return table;
    } catch (error) {
      console.warn(`table ${leagueId}: ${error.message}`);
    }
  }

  return { title: upcoming[0]?.competition || "", rows: [] };
}

function activeWindow(upcoming) {
  if (!upcoming.length) return false;

  const now = Date.now();
  const limit = now + ACTIVE_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  return upcoming.some(fixture => {
    if (fixture.status === "live") return true;
    const time = Date.parse(fixture.date);
    return Number.isFinite(time) && time >= now && time <= limit;
  });
}

async function scanUpcomingMatches(days = SCAN_DAYS) {
  const all = [];

  for (let offset = 0; offset < days; offset += 1) {
    const date = dateParamFromOffset(offset);

    try {
      const payload = await getJson("matches", { date, ccode3: "USA" });
      all.push(...flattenDailyMatches(payload));
    } catch (error) {
      console.warn(`matches ${date}: ${error.message}`);
    }
  }

  return all;
}

const existing = JSON.parse(await fs.readFile(dataPath, "utf8"));
existing.updatedAt = new Date().toISOString();
existing.football ??= {};

const scannedMatches = await scanUpcomingMatches(SCAN_DAYS);

for (const team of TEAMS) {
  try {
    const upcomingWithIds = normalizeUpcoming(scannedMatches, team.teamId);
    const standings = await fetchCompetitionTable(upcomingWithIds, team.teamId);

    existing.football[team.key] = {
      active: activeWindow(upcomingWithIds),
      team: team.name,
      shortName: team.name,
      upcoming: upcomingWithIds.map(({ competitionId, ...fixture }) => fixture),
      standings
    };

    console.log(`${team.name}: ${upcomingWithIds.length} upcoming, active=${existing.football[team.key].active}`);
  } catch (error) {
    console.error(`${team.name}: ${error.message}`);
    existing.football[team.key] = {
      active: false,
      team: team.name,
      shortName: team.name,
      upcoming: [],
      standings: { title: "", rows: [] }
    };
  }
}

await fs.writeFile(dataPath, `${JSON.stringify(existing, null, 2)}\n`, "utf8");

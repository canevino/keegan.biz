import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(here, "sports-data.json");

const LIVERPOOL_ID = 8650;
const PREMIER_LEAGUE_ID = 47;

const BASES = [
  "https://www.fotmob.com/api/data",
  "https://www.fotmob.com/api"
];

async function getJson(pathname, params = {}) {
  const query =
    new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => [key, String(value)])
    ).toString();

  let lastError;

  for (const base of BASES) {
    const url =
      `${base}/${pathname}${query ? `?${query}` : ""}`;

    try {
      const response =
        await fetch(url, {
          headers: {
            "Accept": "application/json",
            "User-Agent": "keegan.biz sports updater"
          }
        });

      if (!response.ok) {
        lastError =
          new Error(`${response.status} ${response.statusText}: ${url}`);
        continue;
      }

      const contentType =
        response.headers.get("content-type") || "";

      if (!contentType.includes("json")) {
        lastError =
          new Error(`FotMob returned non-JSON content: ${url}`);
        continue;
      }

      return await response.json();
    }

    catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error(`FotMob request failed: ${pathname}`);
}

function arrayAt(value, paths) {
  for (const pathParts of paths) {
    let current = value;

    for (const key of pathParts) {
      current = current?.[key];
    }

    if (Array.isArray(current)) {
      return current;
    }
  }

  return [];
}

function recursiveMatchCandidates(value, output = []) {
  if (!value || typeof value !== "object") {
    return output;
  }

  if (
    value.home
    && value.away
    && (
      value.status
      || value.utcTime
      || value.timeTS
      || value.date
    )
  ) {
    output.push(value);
  }

  for (const child of Object.values(value)) {
    if (child && typeof child === "object") {
      recursiveMatchCandidates(child, output);
    }
  }

  return output;
}

function fixtureList(teamData) {
  const direct =
    arrayAt(teamData, [
      ["fixtures", "allFixtures", "fixtures"],
      ["fixtures", "fixtures"],
      ["overview", "fixtures"],
      ["matches"]
    ]);

  if (direct.length) {
    return direct;
  }

  const seen = new Set();

  return recursiveMatchCandidates(teamData)
    .filter(match => {
      const id = String(match.id ?? match.matchId ?? "");
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
}

function matchTime(match) {
  const candidate =
    match.status?.utcTime
    || match.utcTime
    || match.time?.utcTime
    || match.date?.utcTime
    || match.matchTimeUTCDate;

  if (candidate) {
    const ms = Date.parse(candidate);
    if (Number.isFinite(ms)) return ms;
  }

  if (match.timeTS) {
    return Number(match.timeTS);
  }

  return NaN;
}

function involvesLiverpool(match) {
  const homeId =
    Number(match.home?.id ?? match.homeTeam?.id ?? match.teams?.[0]?.id);

  const awayId =
    Number(match.away?.id ?? match.awayTeam?.id ?? match.teams?.[1]?.id);

  return homeId === LIVERPOOL_ID || awayId === LIVERPOOL_ID;
}

function isFinished(match) {
  return Boolean(
    match.status?.finished
    ?? match.finished
    ?? false
  );
}

function isStarted(match) {
  return Boolean(
    match.status?.started
    ?? match.started
    ?? false
  );
}

function chooseLiverpoolMatch(matches) {
  const now = Date.now();

  const usable =
    matches
      .filter(involvesLiverpool)
      .map(match => ({
        match,
        time: matchTime(match)
      }))
      .filter(item => Number.isFinite(item.time));

  const live =
    usable.find(
      ({ match }) =>
        isStarted(match)
        && !isFinished(match)
    );

  if (live) {
    return live.match;
  }

  const upcoming =
    usable
      .filter(({ match, time }) => !isFinished(match) && time >= now)
      .sort((a, b) => a.time - b.time)[0];

  if (upcoming) {
    return upcoming.match;
  }

  return usable
    .filter(({ time }) => time < now)
    .sort((a, b) => b.time - a.time)[0]
    ?.match
    || null;
}

function competitionName(match) {
  return (
    match.league?.name
    || match.tournament?.name
    || match.tournamentName
    || match.leagueName
    || match.parentLeagueName
    || ""
  );
}

function teamObject(match, side) {
  if (match[side]) return match[side];

  if (side === "home") {
    return match.homeTeam || match.teams?.[0] || {};
  }

  return match.awayTeam || match.teams?.[1] || {};
}

function scoreOf(team) {
  return (
    team.score
    ?? team.goals
    ?? ""
  );
}

function statusLabel(match) {
  const status = match.status || {};

  if (status.finished === true) {
    return "full time";
  }

  if (status.started === true) {
    return (
      status.reason?.short
      || status.reason?.long
      || status.liveTime?.short
      || status.liveTime?.long
      || "live"
    ).toString().toLowerCase();
  }

  return "scheduled";
}

function formatUpcoming(match) {
  const ms = matchTime(match);

  if (!Number.isFinite(ms)) return "";

  const date = new Date(ms);

  const formatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone: "America/New_York",
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }
    );

  return formatter.format(date);
}

function normalizeMatch(match) {
  if (!match) return null;

  const home = teamObject(match, "home");
  const away = teamObject(match, "away");
  const competition = competitionName(match);

  return {
    id:
      String(match.id ?? match.matchId ?? ""),

    status:
      statusLabel(match),

    competition,

    home:
      home.name || home.longName || "",

    homeScore:
      scoreOf(home),

    away:
      away.name || away.longName || "",

    awayScore:
      scoreOf(away),

    detail:
      isStarted(match)
        ? statusLabel(match)
        : formatUpcoming(match),

    date:
      Number.isFinite(matchTime(match))
        ? new Date(matchTime(match)).toISOString()
        : "",

    leagueId:
      Number(
        match.leagueId
        ?? match.league?.id
        ?? match.primaryId
        ?? match.parentLeagueId
        ?? 0
      )
  };
}

function tableRows(leagueData) {
  const tables =
    Array.isArray(leagueData?.table)
      ? leagueData.table
      : [leagueData?.table].filter(Boolean);

  for (const table of tables) {
    const rows =
      table?.data?.table?.all
      || table?.table?.all
      || table?.all;

    if (Array.isArray(rows) && rows.length) {
      return rows.map((row, index) => ({
        rank:
          Number(row.idx ?? row.rank ?? index + 1),

        team:
          row.shortName || row.name || "",

        points:
          row.pts ?? row.points ?? "",

        played:
          row.played ?? "",

        highlight:
          Number(row.id) === LIVERPOOL_ID
      }));
    }
  }

  return [];
}

const [teamData, premierLeague] =
  await Promise.all([
    getJson("teams", {
      id: LIVERPOOL_ID,
      ccode3: "USA"
    }),

    getJson("leagues", {
      id: PREMIER_LEAGUE_ID,
      ccode3: "USA"
    })
  ]);

const fixtures =
  fixtureList(teamData);

const selectedMatch =
  chooseLiverpoolMatch(fixtures);

const match =
  normalizeMatch(selectedMatch);

const premierLeagueRows =
  tableRows(premierLeague);

const existing =
  JSON.parse(
    await fs.readFile(
      dataPath,
      "utf8"
    )
  );

existing.updatedAt =
  new Date().toISOString();

existing.football ??= {};

existing.football.liverpool = {
  active:
    Boolean(
      match
      || premierLeagueRows.length
    ),

  team:
    "Liverpool",

  shortName:
    "Liverpool",

  game:
    match,

  standings: {
    title:
      "Premier League",

    rows:
      premierLeagueRows
  }
};

await fs.writeFile(
  dataPath,
  `${JSON.stringify(existing, null, 2)}\n`,
  "utf8"
);

console.log(
  match
    ? `Liverpool updated: ${match.competition || "match"} · ${match.home} ${match.homeScore}–${match.awayScore} ${match.away}`
    : "Liverpool updated: no current match found"
);

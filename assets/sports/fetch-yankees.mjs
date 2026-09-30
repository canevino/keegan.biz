import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(here, "sports-data.json");

const YANKEES_ID = 147;
const AL_ID = 103;
const AL_EAST_ID = 201;

const now = new Date();
const season = now.getUTCFullYear();

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function offsetDays(date, amount) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + amount);
  return copy;
}

async function getJson(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "keegan.biz sports updater"
    }
  });

  if (!response.ok) {
    throw new Error(
      `${response.status} ${response.statusText}: ${url}`
    );
  }

  return response.json();
}

function teamCode(team) {
  const codes = {
    147: "NYY",
    111: "BOS",
    141: "TOR",
    139: "TB",
    110: "BAL"
  };

  return (
    codes[team?.id]
    || team?.abbreviation
    || team?.teamCode?.toUpperCase()
    || team?.name
    || ""
  );
}

function statusText(game) {
  const linescore = game?.linescore || {};
  const abstractState = game?.status?.abstractGameState || "";
  const detailed = game?.status?.detailedState || "";

  if (abstractState === "Live") {
    const half =
      linescore.inningState
      || linescore.halfInning
      || "";

    const inning =
      linescore.currentInningOrdinal
      || (
        linescore.currentInning
          ? String(linescore.currentInning)
          : ""
      );

    return [half, inning]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  if (abstractState === "Final") {
    return "final";
  }

  return detailed.toLowerCase();
}

function normalizeGame(game) {
  if (!game) return null;

  const away = game.teams?.away || {};
  const home = game.teams?.home || {};
  const linescore = game.linescore || {};

  const innings = (linescore.innings || []).map(inning => ({
    away: inning.away?.runs ?? "",
    home: inning.home?.runs ?? ""
  }));

  return {
    gamePk: game.gamePk,
    status: (game.status?.abstractGameState || "").toLowerCase(),
    detail: statusText(game),
    date: game.gameDate || "",
    away: teamCode(away.team),
    awayFull: away.team?.name || "",
    awayScore: away.score ?? linescore.teams?.away?.runs ?? 0,
    awayHits: linescore.teams?.away?.hits ?? "",
    awayErrors: linescore.teams?.away?.errors ?? "",
    home: teamCode(home.team),
    homeFull: home.team?.name || "",
    homeScore: home.score ?? linescore.teams?.home?.runs ?? 0,
    homeHits: linescore.teams?.home?.hits ?? "",
    homeErrors: linescore.teams?.home?.errors ?? "",
    innings
  };
}

function chooseGame(schedule) {
  const games =
    (schedule.dates || [])
      .flatMap(day => day.games || []);

  if (!games.length) return null;

  const live =
    games.find(
      game =>
        game.status?.abstractGameState === "Live"
    );

  if (live) return live;

  const today = isoDate(now);

  const todayGame =
    games.find(
      game =>
        game.officialDate === today
    );

  if (todayGame) return todayGame;

  const upcoming =
    games
      .filter(
        game =>
          new Date(game.gameDate) > now
      )
      .sort(
        (a, b) =>
          new Date(a.gameDate)
          - new Date(b.gameDate)
      )[0];

  if (upcoming) return upcoming;

  return (
    games
      .filter(
        game =>
          new Date(game.gameDate) <= now
      )
      .sort(
        (a, b) =>
          new Date(b.gameDate)
          - new Date(a.gameDate)
      )[0]
    || null
  );
}

function divisionRows(standings) {
  const record =
    (standings.records || []).find(
      item =>
        item.division?.id === AL_EAST_ID
        || item.division?.name === "American League East"
    );

  if (!record) return [];

  return (record.teamRecords || []).map(
    (team, index) => ({
      rank:
        Number(team.divisionRank)
        || index + 1,

      team:
        (team.team?.name || "")
          .replace(
            "New York Yankees",
            "Yankees"
          )
          .replace(
            "Toronto Blue Jays",
            "Blue Jays"
          )
          .replace(
            "Boston Red Sox",
            "Red Sox"
          )
          .replace(
            "Tampa Bay Rays",
            "Rays"
          )
          .replace(
            "Baltimore Orioles",
            "Orioles"
          ),

      record:
        `${team.wins ?? 0}–${team.losses ?? 0}`,

      highlight:
        team.team?.id === YANKEES_ID
    })
  );
}

const startDate =
  isoDate(
    offsetDays(
      now,
      -2
    )
  );

const endDate =
  isoDate(
    offsetDays(
      now,
      7
    )
  );

const scheduleUrl =
  "https://statsapi.mlb.com/api/v1/schedule"
  + `?sportId=1`
  + `&teamId=${YANKEES_ID}`
  + `&startDate=${startDate}`
  + `&endDate=${endDate}`
  + `&hydrate=team,linescore`;

const standingsUrl =
  "https://statsapi.mlb.com/api/v1/standings"
  + `?leagueId=${AL_ID}`
  + `&season=${season}`
  + `&standingsTypes=regularSeason`
  + `&hydrate=team`;

const [schedule, standings] =
  await Promise.all([
    getJson(scheduleUrl),
    getJson(standingsUrl)
  ]);

const selectedGame =
  chooseGame(schedule);

const game =
  normalizeGame(selectedGame);

const rows =
  divisionRows(standings);

const existing =
  JSON.parse(
    await fs.readFile(
      dataPath,
      "utf8"
    )
  );

existing.updatedAt =
  new Date().toISOString();

existing.baseball ??= {};

existing.baseball.yankees = {
  active:
    Boolean(
      game
      || rows.length
    ),

  team:
    "New York Yankees",

  shortName:
    "Yankees",

  game,

  standings: {
    title:
      "AL East",

    rows
  }
};

await fs.writeFile(
  dataPath,
  `${JSON.stringify(
    existing,
    null,
    2
  )}\n`,
  "utf8"
);

console.log(
  `Yankees updated: ${
    game
      ? `${game.away} ${game.awayScore} – ${game.homeScore} ${game.home}`
      : "no game found"
  }`
);

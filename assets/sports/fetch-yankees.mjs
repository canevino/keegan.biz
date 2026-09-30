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

function postseasonLabel(game) {
  if (game?.seriesDescription) {
    return game.seriesDescription;
  }

  const labels = {
    F: "Wild Card Series",
    D: "Division Series",
    L: "League Championship Series",
    W: "World Series"
  };

  return labels[game?.gameType] || "";
}

function isPostseason(game) {
  return ["F", "D", "L", "W"].includes(
    game?.gameType
  );
}

function seriesText(game) {
  const status = game?.seriesStatus;

  if (!status) {
    const gameNumber = game?.gameNumber;
    return gameNumber
      ? `Game ${gameNumber}`
      : "";
  }

  if (status.result) {
    return status.result;
  }

  if (status.shortName) {
    return status.shortName;
  }

  if (status.seriesStatus) {
    return status.seriesStatus;
  }

  const gameNumber =
    status.gameNumber
    || game?.gameNumber;

  const total =
    status.totalNumberOfGames;

  if (gameNumber && total) {
    return `Game ${gameNumber} of ${total}`;
  }

  if (gameNumber) {
    return `Game ${gameNumber}`;
  }

  return "";
}

function formatEasternGameTime(gameDate) {
  if (!gameDate) return "";

  const date = new Date(gameDate);

  const day = new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone: "America/New_York",
      weekday: "short",
      month: "short",
      day: "numeric"
    }
  ).format(date);

  const time = new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone: "America/New_York",
      hour: "numeric",
      minute: "2-digit"
    }
  ).format(date);

  return `next game · ${day} · ${time} ET`;
}

function opponentId(game) {
  const awayId = game?.teams?.away?.team?.id;
  const homeId = game?.teams?.home?.team?.id;

  return awayId === YANKEES_ID
    ? homeId
    : awayId;
}

function seriesRecordText(selectedGame, allGames) {
  if (
    !selectedGame
    || !isPostseason(selectedGame)
  ) {
    return "";
  }

  const opponent = opponentId(selectedGame);
  const type = selectedGame.gameType;

  const seriesGames = allGames.filter(game =>
    game.gameType === type
    && opponentId(game) === opponent
    && game.status?.abstractGameState === "Final"
  );

  let yankeesWins = 0;
  let opponentWins = 0;

  for (const game of seriesGames) {
    const awayId = game.teams?.away?.team?.id;
    const homeId = game.teams?.home?.team?.id;
    const awayScore = game.teams?.away?.score ?? 0;
    const homeScore = game.teams?.home?.score ?? 0;

    const yankeesWon =
      (
        awayId === YANKEES_ID
        && awayScore > homeScore
      )
      ||
      (
        homeId === YANKEES_ID
        && homeScore > awayScore
      );

    if (yankeesWon) {
      yankeesWins += 1;
    } else {
      opponentWins += 1;
    }
  }

  const opponentName =
    selectedGame.teams?.away?.team?.id === YANKEES_ID
      ? selectedGame.teams?.home?.team?.name
      : selectedGame.teams?.away?.team?.name;

  if (!opponentName) {
    return `series · Yankees ${yankeesWins}–${opponentWins}`;
  }

  const shortOpponent =
    opponentName
      .replace("Boston Red Sox", "Red Sox")
      .replace("Toronto Blue Jays", "Blue Jays")
      .replace("Tampa Bay Rays", "Rays")
      .replace("Baltimore Orioles", "Orioles");

  return `series · Yankees ${yankeesWins}–${opponentWins} ${shortOpponent}`;
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
    innings,
    postseason: isPostseason(game),
    competition: postseasonLabel(game),
    series: seriesText(game),
    seriesRecord: "",
    upcomingTime:
      game.status?.abstractGameState === "Preview"
        ? formatEasternGameTime(game.gameDate)
        : "",
    gameType: game.gameType || ""
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

  const postseasonUpcoming =
    games
      .filter(
        game =>
          isPostseason(game)
          && new Date(game.gameDate) > now
      )
      .sort(
        (a, b) =>
          new Date(a.gameDate)
          - new Date(b.gameDate)
      )[0];

  if (postseasonUpcoming) {
    return postseasonUpcoming;
  }

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
          .replace("New York Yankees", "Yankees")
          .replace("Toronto Blue Jays", "Blue Jays")
          .replace("Boston Red Sox", "Red Sox")
          .replace("Tampa Bay Rays", "Rays")
          .replace("Baltimore Orioles", "Orioles"),

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
      -10
    )
  );

const endDate =
  isoDate(
    offsetDays(
      now,
      10
    )
  );

const scheduleUrl =
  "https://statsapi.mlb.com/api/v1/schedule"
  + `?sportId=1`
  + `&teamId=${YANKEES_ID}`
  + `&startDate=${startDate}`
  + `&endDate=${endDate}`
  + `&hydrate=team,linescore,seriesStatus`;

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

const allScheduleGames =
  (schedule.dates || [])
    .flatMap(
      day => day.games || []
    );

const selectedGame =
  chooseGame(schedule);

const game =
  normalizeGame(selectedGame);

if (
  game
  && game.postseason
) {
  game.seriesRecord =
    seriesRecordText(
      selectedGame,
      allScheduleGames
    );
}

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
      ? `${game.competition || "Regular Season"} · ${game.away} ${game.awayScore} – ${game.homeScore} ${game.home}`
      : "no game found"
  }`
);

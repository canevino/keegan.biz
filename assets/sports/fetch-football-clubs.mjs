import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here =
  path.dirname(
    fileURLToPath(
      import.meta.url
    )
  );

const dataPath =
  path.join(
    here,
    "sports-data.json"
  );

const BASES = [
  "https://www.fotmob.com/api/data",
  "https://www.fotmob.com/api"
];

const CLUBS = [
  {
    key: "liverpool",
    name: "Liverpool",
    teamId: 8650,
    leagueId: 47,
    leagueName: "Premier League"
  },
  {
    key: "hearts",
    name: "Hearts",
    teamId: 9860,
    leagueId: 64,
    leagueName: "Premiership"
  },
  {
    key: "preston",
    name: "Preston",
    teamId: 8411,
    leagueId: 48,
    leagueName: "Championship"
  },
  {
    key: "fiorentina",
    name: "Fiorentina",
    teamId: 8535,
    leagueId: 55,
    leagueName: "Serie A"
  },
  {
    key: "shakhtar",
    name: "Shakhtar",
    teamId: 9728,
    leagueId: 441,
    leagueName: "Premier League"
  }
];

async function getJson(
  pathname,
  params = {}
) {

  const query =
    new URLSearchParams(
      Object.entries(
        params
      )
        .filter(
          (
            [
              ,
              value
            ]
          ) =>
            value !==
            undefined
            &&
            value !==
            null
        )
        .map(
          (
            [
              key,
              value
            ]
          ) => [
            key,
            String(
              value
            )
          ]
        )
    ).toString();


  let lastError;


  for (
    const base
    of
    BASES
  ) {

    const url =
      `${base}/${pathname}${query ? `?${query}` : ""}`;


    try {

      const response =
        await fetch(
          url,
          {
            headers: {
              "Accept":
                "application/json",

              "User-Agent":
                "keegan.biz sports updater"
            }
          }
        );


      if (
        !response.ok
      ) {

        lastError =
          new Error(
            `${response.status} ${response.statusText}: ${url}`
          );

        continue;

      }


      const contentType =
        response.headers.get(
          "content-type"
        )
        ||
        "";


      if (
        !contentType.includes(
          "json"
        )
      ) {

        lastError =
          new Error(
            `FotMob returned non-JSON content: ${url}`
          );

        continue;

      }


      return await response.json();

    }

    catch (
      error
    ) {

      lastError =
        error;

    }

  }


  throw (
    lastError
    ||
    new Error(
      `FotMob request failed: ${pathname}`
    )
  );

}


function arrayAt(
  value,
  paths
) {

  for (
    const pathParts
    of
    paths
  ) {

    let current =
      value;


    for (
      const key
      of
      pathParts
    ) {

      current =
        current?.[
          key
        ];

    }


    if (
      Array.isArray(
        current
      )
    ) {
      return current;
    }

  }


  return [];

}


function recursiveMatchCandidates(
  value,
  output = []
) {

  if (
    !value
    ||
    typeof value !==
    "object"
  ) {
    return output;
  }


  if (
    value.home
    &&
    value.away
    &&
    (
      value.status
      ||
      value.utcTime
      ||
      value.timeTS
      ||
      value.date
    )
  ) {

    output.push(
      value
    );

  }


  for (
    const child
    of
    Object.values(
      value
    )
  ) {

    if (
      child
      &&
      typeof child ===
      "object"
    ) {

      recursiveMatchCandidates(
        child,
        output
      );

    }

  }


  return output;

}


function fixtureList(
  teamData
) {

  const direct =
    arrayAt(
      teamData,
      [
        [
          "fixtures",
          "allFixtures",
          "fixtures"
        ],
        [
          "fixtures",
          "fixtures"
        ],
        [
          "overview",
          "fixtures"
        ],
        [
          "matches"
        ]
      ]
    );


  if (
    direct.length
  ) {
    return direct;
  }


  const seen =
    new Set();


  return recursiveMatchCandidates(
    teamData
  )
    .filter(
      match => {

        const id =
          String(
            match.id
            ??
            match.matchId
            ??
            ""
          );


        if (
          !id
          ||
          seen.has(
            id
          )
        ) {
          return false;
        }


        seen.add(
          id
        );


        return true;

      }
    );

}


function matchTime(
  match
) {

  const candidate =
    match.status
      ?.utcTime
    ||
    match.utcTime
    ||
    match.time
      ?.utcTime
    ||
    match.date
      ?.utcTime
    ||
    match.matchTimeUTCDate;


  if (
    candidate
  ) {

    const ms =
      Date.parse(
        candidate
      );


    if (
      Number.isFinite(
        ms
      )
    ) {
      return ms;
    }

  }


  if (
    match.timeTS
  ) {
    return Number(
      match.timeTS
    );
  }


  return NaN;

}


function teamObject(
  match,
  side
) {

  if (
    match[
      side
    ]
  ) {
    return match[
      side
    ];
  }


  if (
    side ===
    "home"
  ) {

    return (
      match.homeTeam
      ||
      match.teams?.[
        0
      ]
      ||
      {}
    );

  }


  return (
    match.awayTeam
    ||
    match.teams?.[
      1
    ]
    ||
    {}
  );

}


function competitionName(
  match
) {

  return (
    match.league?.name
    ||
    match.tournament?.name
    ||
    match.tournamentName
    ||
    match.leagueName
    ||
    match.parentLeagueName
    ||
    ""
  );

}


function isFinished(
  match
) {

  return Boolean(
    match.status
      ?.finished
    ??
    match.finished
    ??
    false
  );

}


function isStarted(
  match
) {

  return Boolean(
    match.status
      ?.started
    ??
    match.started
    ??
    false
  );

}


function formatEastern(
  ms
) {

  const date =
    new Date(
      ms
    );


  const now =
    new Date();


  const dayKey =
    date.toLocaleDateString(
      "en-CA",
      {
        timeZone:
          "America/New_York"
      }
    );


  const todayKey =
    now.toLocaleDateString(
      "en-CA",
      {
        timeZone:
          "America/New_York"
      }
    );


  const tomorrow =
    new Date(
      now
    );


  tomorrow.setDate(
    tomorrow.getDate()
    +
    1
  );


  const tomorrowKey =
    tomorrow.toLocaleDateString(
      "en-CA",
      {
        timeZone:
          "America/New_York"
      }
    );


  const fullDate =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          "America/New_York",

        weekday:
          "short",

        month:
          "short",

        day:
          "numeric"
      }
    ).format(
      date
    );


  const time =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          "America/New_York",

        hour:
          "numeric",

        minute:
          "2-digit"
      }
    ).format(
      date
    );


  const prefix =
    dayKey ===
    todayKey
      ? "today"
      : dayKey ===
        tomorrowKey
        ? "tomorrow"
        : fullDate;


  return (
    prefix ===
    fullDate
      ? `${fullDate} · ${time} ET`
      : `${prefix} · ${fullDate} · ${time} ET`
  );

}


function normalizeUpcoming(
  matches,
  teamId
) {

  const now =
    Date.now();


  return matches
    .filter(
      match => {

        const home =
          teamObject(
            match,
            "home"
          );


        const away =
          teamObject(
            match,
            "away"
          );


        const involvesTeam =
          Number(
            home.id
          ) ===
          teamId
          ||
          Number(
            away.id
          ) ===
          teamId;


        const time =
          matchTime(
            match
          );


        return (
          involvesTeam
          &&
          Number.isFinite(
            time
          )
          &&
          (
            isStarted(
              match
            )
            ||
            (
              !isFinished(
                match
              )
              &&
              time >=
              now
            )
          )
        );

      }
    )
    .sort(
      (
        a,
        b
      ) =>
        matchTime(
          a
        )
        -
        matchTime(
          b
        )
    )
    .slice(
      0,
      5
    )
    .map(
      match => {

        const home =
          teamObject(
            match,
            "home"
          );


        const away =
          teamObject(
            match,
            "away"
          );


        const time =
          matchTime(
            match
          );


        return {
          id:
            String(
              match.id
              ??
              match.matchId
              ??
              ""
            ),

          date:
            new Date(
              time
            ).toISOString(),

          when:
            isStarted(
              match
            )
            &&
            !isFinished(
              match
            )
              ? "live"
              : formatEastern(
                  time
                ),

          status:
            isStarted(
              match
            )
            &&
            !isFinished(
              match
            )
              ? "live"
              : "scheduled",

          home:
            home.name
            ||
            home.longName
            ||
            "",

          away:
            away.name
            ||
            away.longName
            ||
            "",

          competition:
            competitionName(
              match
            )
        };

      }
    );

}


function tableRows(
  leagueData,
  teamId
) {

  const tables =
    Array.isArray(
      leagueData?.table
    )
      ? leagueData.table
      : [
          leagueData?.table
        ].filter(
          Boolean
        );


  for (
    const table
    of
    tables
  ) {

    const rows =
      table?.data
        ?.table
        ?.all
      ||
      table?.table
        ?.all
      ||
      table?.all;


    if (
      Array.isArray(
        rows
      )
      &&
      rows.length
    ) {

      return rows.map(
        (
          row,
          index
        ) => ({
          rank:
            Number(
              row.idx
              ??
              row.rank
              ??
              index +
              1
            ),

          team:
            row.shortName
            ||
            row.name
            ||
            "",

          points:
            row.pts
            ??
            row.points
            ??
            "",

          played:
            row.played
            ??
            "",

          highlight:
            Number(
              row.id
            ) ===
            teamId
        })
      );

    }

  }


  return [];

}


async function fetchClub(
  club
) {

  const [
    teamData,
    leagueData
  ] =
    await Promise.all([
      getJson(
        "teams",
        {
          id:
            club.teamId,

          ccode3:
            "USA"
        }
      ),

      getJson(
        "leagues",
        {
          id:
            club.leagueId,

          ccode3:
            "USA"
        }
      )
    ]);


  return {
    active:
      true,

    team:
      club.name,

    shortName:
      club.name,

    upcoming:
      normalizeUpcoming(
        fixtureList(
          teamData
        ),
        club.teamId
      ),

    standings: {
      title:
        club.leagueName,

      rows:
        tableRows(
          leagueData,
          club.teamId
        )
    }
  };

}


const existing =
  JSON.parse(
    await fs.readFile(
      dataPath,
      "utf8"
    )
  );


existing.updatedAt =
  new Date()
    .toISOString();


existing.football ??=
  {};


for (
  const club
  of
  CLUBS
) {

  try {

    existing.football[
      club.key
    ] =
      await fetchClub(
        club
      );


    console.log(
      `${club.name}: updated`
    );

  }

  catch (
    error
  ) {

    console.error(
      `${club.name}: ${error.message}`
    );


    existing.football[
      club.key
    ] ??= {
      active:
        false,

      team:
        club.name,

      shortName:
        club.name,

      upcoming:
        [],

      standings: {
        title:
          club.leagueName,

        rows:
          []
      }
    };

  }

}


await fs.writeFile(
  dataPath,
  `${JSON.stringify(
    existing,
    null,
    2
  )}\n`,
  "utf8"
);

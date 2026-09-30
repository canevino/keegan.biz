import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { famousGames } from "./famous-games.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const output = path.join(here, "famous-games-pgn.js");

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const records = [];

for (let i = 0; i < famousGames.length; i += 1) {
  const game = famousGames[i];

  console.log(`[${i + 1}/${famousGames.length}] ${game.white} vs ${game.black}, ${game.year}`);

  const response = await fetch(game.pgnUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  if (!response.ok) {
    throw new Error(`PGN download failed for ${game.id}: HTTP ${response.status}`);
  }

  const pgn = (await response.text()).trim();

  records.push({
    ...game,
    pgn
  });

  // Be polite to the source and avoid hammering it.
  await sleep(350);
}

const body =
  `export const famousGamesWithPgn = ${JSON.stringify(records, null, 2)};\n`;

await fs.writeFile(output, body, "utf8");

console.log(`Saved ${records.length} games to ${output}`);

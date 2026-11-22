// Ember Court — a turn-based dueling card battler, handed in by this program.
//
// The game itself is plain static files in game/ (game/index.html plus its ES
// modules and stylesheet, no libraries and no network requests), and the four
// screenshots in screenshots/ are real renders of that game in a browser.
// This program copies both folders into /output (or MAKEFUN_OUTPUT_DIR when
// set, for a local run) and writes /output/dossier.json with the vendored
// make.fun library, which is the summary the judge reads.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): text_max_bytes is the only one that
// shapes the dossier's bytes; the rest refuse an entry the scorer would refuse —
// more than 4 screenshots or one over 256 KiB, more than 993 files in game/ or
// 48 MiB of game files in all, or a path under game/ over 1000 bytes. game/ counts
// beside /output's own 1000-entry cap, sharing it with screenshots/ and dossier.json.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

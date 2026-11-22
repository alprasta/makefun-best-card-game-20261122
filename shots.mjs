// Screenshot + playtest driver for Ember Court.
//
//   node shots.mjs            take the 4 screenshots from shots.json into screenshots/
//   node shots.mjs --playtest  drive the real game in Chromium and report PASS/FAIL
//
// Serves game/ on a scratch port, drives the cached Chromium (1255) through
// playwright-core, and screenshots at 1280x720. Every screenshot is a direct
// render of the game's own code — nothing is edited or composited afterwards.
import { createRequire } from 'node:module';
// playwright-core lives in the scratch tools dir (never in the repo, so it can
// never leak into the entry); resolve it by absolute path.
const require = createRequire('/tmp/card-tools/package.json');
const { chromium } = require('playwright-core');
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const PORT = 8931;
const BASE = `http://127.0.0.1:${PORT}`;
const CHROME = `${process.env.HOME}/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome`;
const SHOTS = JSON.parse(readFileSync(join(here, 'shots.json'), 'utf8'));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function serveGame() {
  const server = spawn(process.execPath, ['serve.ts', '--port', String(PORT)], {
    cwd: here, stdio: ['ignore', 'pipe', 'pipe'],
  });
  for (let i = 0; i < 50; i += 1) {
    try {
      const res = await fetch(`${BASE}/index.html`);
      if (res.ok) return server;
    } catch { /* not up yet */ }
    await sleep(100);
  }
  throw new Error('serve.ts did not come up');
}

async function openPage(browser, url) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  const outside = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', (err) => errors.push(String(err)));
  page.on('request', (req) => {
    const u = req.url();
    if (!u.startsWith(BASE) && !u.startsWith('data:')) outside.push(u);
  });
  await page.goto(url, { waitUntil: 'networkidle' });
  await sleep(400);
  return { page, errors, outside };
}

async function takeShots() {
  const server = await serveGame();
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    for (const shot of SHOTS) {
      const { page, errors, outside } = await openPage(browser, `${BASE}/index.html${shot.query}`);
      const path = join(here, 'screenshots', shot.name);
      await page.screenshot({ path, type: 'jpeg', quality: 88 });
      const bytes = (await import('node:fs')).statSync(path).size;
      console.log(`${shot.name}: ${bytes} bytes, console errors: ${errors.length}, outside requests: ${outside.length}`);
      if (errors.length) console.log('  errors:', errors.join(' | '));
      if (outside.length) console.log('  outside:', outside.join(' | '));
      await page.close();
    }
  } finally {
    await browser.close();
    server.kill();
  }
}

// ---------- playtest: drive the real game end to end ----------
function check(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  return ok;
}

async function playtest() {
  const server = await serveGame();
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  let allOk = true;
  try {
    const { page, errors, outside } = await openPage(browser, `${BASE}/index.html`);
    const g = (expr) => page.evaluate(expr);

    // 1. Title screen loads.
    allOk &= check('title screen loads', await g(`!document.getElementById('titleScreen').hidden && document.querySelector('.game-title').textContent === 'EMBER COURT'`));
    allOk &= check('title shows how-to-play', await g(`document.querySelector('.howto').textContent.includes('Synergy')`));

    // 2. Enter starts the match; a hand is dealt.
    await page.keyboard.press('Enter');
    await sleep(300);
    allOk &= check('Enter starts match', await g(`window.__cardgame.state().phase === 'play'`));
    allOk &= check('opening hand dealt (4+ cards)', await g(`window.__cardgame.state().you.hand.length >= 4`), `hand=${await g(`window.__cardgame.state().you.hand.length`)}`);
    allOk &= check('opponent hand visible', await g(`document.querySelectorAll('#foeHand .mini-card').length >= 4`));

    // 3. Playing a card changes state (HP, energy or hand).
    const before = await g(`({ hp: window.__cardgame.state().foe.hp, e: window.__cardgame.state().you.energy, n: window.__cardgame.state().you.hand.length, score: window.__cardgame.state().score })`);
    const played = await g(`(() => { const s = window.__cardgame.state(); const i = s.you.hand.findIndex(c => c.cost <= s.you.energy); if (i < 0) return -1; window.__cardgame.playCard(i); return i; })()`);
    await sleep(300);
    const after = await g(`({ hp: window.__cardgame.state().foe.hp, e: window.__cardgame.state().you.energy, n: window.__cardgame.state().you.hand.length, score: window.__cardgame.state().score })`);
    const changed = played >= 0 && (after.hp !== before.hp || after.e !== before.e || after.n !== before.n);
    allOk &= check('playing a card changes state', changed, `card#${played} hp ${before.hp}->${after.hp}, energy ${before.e}->${after.e}, hand ${before.n}->${after.n}`);

    // 4. End turn lets the AI act, then the round advances.
    const roundBefore = await g(`window.__cardgame.state().round`);
    await page.keyboard.press('Space');
    await sleep(4500);
    const roundAfter = await g(`window.__cardgame.state().round`);
    const aiActed = await g(`window.__cardgame.state().log.some(l => l.includes('Vex'))`);
    allOk &= check('end turn hands over to AI', aiActed, `log mentions Vex`);
    allOk &= check('round advances after AI turn', roundAfter > roundBefore, `round ${roundBefore}->${roundAfter}`);

    // 5. Keyboard select (1-7) works.
    await g(`window.__cardgame.state().selected = -1`);
    await page.keyboard.press('1');
    await sleep(200);
    allOk &= check('key 1 selects first card', await g(`window.__cardgame.state().selected === 0`));

    // 6. Win path reachable: play aggressively until the match ends in a win.
    let won = false;
    for (let turn = 0; turn < 40 && !won; turn += 1) {
      const st = await g(`window.__cardgame.state().phase`);
      if (st === 'over') { won = await g(`window.__cardgame.state().winner === 'you'`); break; }
      await g(`(() => { const s = window.__cardgame.state(); for (let k = 0; k < 12; k++) { const i = s.you.hand.findIndex(c => (c.kind === 'attack' || c.kind === 'hybrid') && c.cost <= s.you.energy); if (i < 0) break; window.__cardgame.playCard(i); if (s.phase === 'over') break; } })()`);
      if (await g(`window.__cardgame.state().phase === 'over'`)) { won = await g(`window.__cardgame.state().winner === 'you'`); break; }
      await page.keyboard.press('Space');
      await sleep(4500);
    }
    allOk &= check('win path reachable (aggressive play)', won, await g(`window.__cardgame.state().phase`) + '/' + await g(`window.__cardgame.state().winner`));
    allOk &= check('win screen shows', await g(`!document.getElementById('endScreen').hidden && document.getElementById('endTitle').textContent === 'VICTORY'`));

    // 7. Restart works, then the loss path: never play, let the AI win.
    await page.keyboard.press('r');
    await sleep(300);
    allOk &= check('R restarts to title', await g(`window.__cardgame.state().phase === 'title'`));
    await page.keyboard.press('Enter');
    await sleep(300);
    let lost = false;
    for (let turn = 0; turn < 60 && !lost; turn += 1) {
      const st = await g(`window.__cardgame.state().phase`);
      if (st === 'over') { lost = await g(`window.__cardgame.state().winner === 'foe'`); break; }
      await page.keyboard.press('Space');
      await sleep(4500);
    }
    allOk &= check('loss path reachable (never playing)', lost, await g(`window.__cardgame.state().phase`) + '/' + await g(`window.__cardgame.state().winner`));
    allOk &= check('loss screen shows', await g(`!document.getElementById('endScreen').hidden && document.getElementById('endTitle').textContent === 'DEFEAT'`));

    // 8. No console errors, no outside requests across the whole session.
    allOk &= check('zero console errors', errors.length === 0, errors.join(' | ').slice(0, 300));
    allOk &= check('zero network requests outside localhost', outside.length === 0, outside.join(' | ').slice(0, 300));

    // 9. Deterministic shots render the right screens.
    for (const shot of SHOTS) {
      const { page: sp } = await openPage(browser, `${BASE}/index.html${shot.query}`);
      const phase = await sp.evaluate(`window.__cardgame.state().phase`);
      const title = await sp.evaluate(`document.getElementById('endTitle').textContent`);
      const want = shot.name.startsWith('1-') ? 'title' : shot.name.startsWith('2-') ? 'play' : 'over';
      const ok = phase === want && (want !== 'over' || (shot.name.startsWith('3-') ? title === 'VICTORY' : title === 'DEFEAT'));
      allOk &= check(`shot ${shot.name} renders ${want}`, ok, `phase=${phase} title=${title}`);
      await sp.close();
    }
  } finally {
    await browser.close();
    server.kill();
  }
  console.log(allOk ? '\nPLAYTEST: ALL PASS' : '\nPLAYTEST: SOME CHECKS FAILED');
  process.exit(allOk ? 0 : 1);
}

if (process.argv.includes('--playtest')) await playtest();
else await takeShots();

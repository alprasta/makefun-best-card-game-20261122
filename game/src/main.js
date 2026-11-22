// Bootstrap for Ember Court: builds the match, wires the controls, runs the AI
// turns with a short pause between its cards, and exposes a debug hook for tests.
import { newMatch, startMatch, playCard, endPlayerTurn, beginPlayerRound, aiStep, checkEnd, PHASE_TITLE, PHASE_PLAY, PHASE_AI, PHASE_OVER } from './state.js';
import { render, showBanner, announce } from './render.js';
import { bindControls } from './input.js';
import { stageShot } from './shots.js';
import { sfxSelect, sfxPlay, sfxHit, sfxGuard, sfxWin, sfxLose } from './audio.js';

const AI_STEP_MS = 650;
const params = new URLSearchParams(window.location.search);
const seedParam = Number(params.get('seed'));
const seed = Number.isFinite(seedParam) && seedParam > 0 ? Math.floor(seedParam) : 20261122;

let state = newMatch(seed);
state.selected = -1;
state.lastPlayed = null;
let aiTimer = null;

/** Fit the fixed 1280x720 table into the browser window. */
function fitTable() {
  const scale = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
  document.getElementById('table').style.transform = `scale(${scale})`;
}
window.addEventListener('resize', fitTable);
fitTable();

function draw() { render(state, { selectCard }); }

/** Click (or key 1-7) on a hand card: first click selects, second plays it. */
function selectCard(index) {
  if (state.phase !== PHASE_PLAY || state.turn !== 'you') return;
  const card = state.you.hand[index];
  if (!card) return;
  if (state.selected === index) {
    playSelected(index);
    return;
  }
  state.selected = index;
  sfxSelect();
  announce(`${card.name}, cost ${card.cost}. Click again to play.`);
  draw();
}

function playSelected(index) {
  const card = state.you.hand[index];
  if (!card || state.you.energy < card.cost) {
    showBanner('Not enough energy for that card.');
    return;
  }
  const line = playCard(state, 'you', index);
  state.selected = -1;
  state.lastPlayed = { card, who: 'you', line };
  if (card.kind === 'attack' || card.kind === 'hybrid') sfxHit();
  else if (card.kind === 'guard' || card.kind === 'heal') sfxGuard();
  else sfxPlay();
  announce(line);
  if (state.phase === PHASE_OVER) { endMatch(); return; }
  draw();
}

function startGame() {
  if (state.phase !== PHASE_TITLE) return;
  clearTimeout(aiTimer);
  startMatch(state);
  sfxPlay();
  showBanner('Round 1 — your turn!');
  announce('The match begins. Your turn.');
  draw();
}

function endTurn() {
  if (state.phase !== PHASE_PLAY || state.turn !== 'you') return;
  state.selected = -1;
  if (!endPlayerTurn(state)) return;
  sfxPlay();
  draw();
  runAi();
}

/** The AI plays one card at a time, then the turn passes back to the player. */
function runAi() {
  clearTimeout(aiTimer);
  const step = () => {
    if (state.phase !== PHASE_AI) return;
    const line = aiStep(state);
    if (line === null) {
      beginPlayerRound(state);
      showBanner(`Round ${state.round} — your turn!`);
      draw();
      return;
    }
    const played = state.foe.discard[state.foe.discard.length - 1];
    state.lastPlayed = { card: played, who: 'foe', line };
    if (played && (played.kind === 'attack' || played.kind === 'hybrid')) sfxHit();
    announce(line);
    if (state.phase === PHASE_OVER) { endMatch(); return; }
    draw();
    aiTimer = setTimeout(step, AI_STEP_MS);
  };
  aiTimer = setTimeout(step, AI_STEP_MS);
}

function endMatch() {
  clearTimeout(aiTimer);
  const win = state.winner === 'you';
  if (win) sfxWin(); else sfxLose();
  showBanner(win ? 'VICTORY — the court is yours!' : 'DEFEAT — Vex keeps the court.', 2600);
  announce(win ? 'You win the match.' : 'You lose the match.');
  draw();
}

function restart() {
  clearTimeout(aiTimer);
  const wins = state.wins;
  const score = state.score;
  state = newMatch(seed);
  state.selected = -1;
  state.lastPlayed = null;
  // A restart keeps the running score across matches in one sitting.
  state.wins = wins;
  state.score = score;
  draw();
  announce('A new match is ready. Press Enter to begin.');
}

bindControls({
  start: startGame,
  restart,
  endTurn,
  selectByKey: selectCard,
});

// A ?shot= URL renders one fixed scene straight away for screenshots.
const shot = params.get('shot');
if (shot) {
  state = stageShot(shot, seed);
  draw();
} else {
  draw();
}

/** Debug hook for playtests: state, and the same actions the buttons drive. */
window.__cardgame = {
  state: () => state,
  start: startGame,
  playCard: (index) => { state.selected = index; playSelected(index); },
  selectCard,
  endTurn,
  restart,
  aiStepNow: () => { const line = aiStep(state); draw(); return line; },
};

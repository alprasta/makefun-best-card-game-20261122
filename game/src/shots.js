// Deterministic screenshot scenes behind ?shot=start|play|win|loss.
// Each scene plays the real rules forward from a fresh seeded match with a small
// autopilot, so the frame is what a real game looks like and the same seed always
// gives the same frame. No scene edits the rules or fakes a state by hand.
import { newMatch, startMatch, playCard, endPlayerTurn, beginPlayerRound, aiStep, drawCards, PHASE_OVER } from './state.js';
import { CARD_DEFS, makeRng, SUITS } from './cards.js';

const MAX_STEPS = 400;

/** The player's autopilot: play the best affordable card, attacks first. */
function playerAuto(state) {
  for (let guard = 0; guard < 12; guard += 1) {
    let best = -1;
    let bestValue = -Infinity;
    state.you.hand.forEach((card, index) => {
      if (card.cost > state.you.energy) return;
      let value = card.value - card.cost;
      if (card.kind === 'attack' || card.kind === 'hybrid') value += 4;
      if (card.kind === 'heal' && state.you.hp > 24) value -= 10;
      if (card.kind === 'guard' && state.you.hp > 24) value -= 6;
      if (value > bestValue) { bestValue = value; best = index; }
    });
    if (best < 0) return;
    const card = state.you.hand[best];
    const line = playCard(state, 'you', best);
    state.lastPlayed = { card, who: 'you', line };
    if (state.phase === PHASE_OVER) return;
  }
}

/** Run one full AI turn synchronously. */
function runAiTurn(state) {
  for (let guard = 0; guard < 20; guard += 1) {
    const line = aiStep(state);
    if (line === null) break;
    const played = state.foe.discard[state.foe.discard.length - 1];
    state.lastPlayed = { card: played, who: 'foe', line };
    if (state.phase === PHASE_OVER) return;
  }
}

/** One full round: the player autopilot plays, then the AI, then a new round opens. */
function playRound(state, playerPlays) {
  if (playerPlays) playerAuto(state);
  if (state.phase === PHASE_OVER) return;
  endPlayerTurn(state);
  runAiTurn(state);
  if (state.phase === PHASE_OVER) return;
  beginPlayerRound(state);
}

/** A fixed attractive mid-game table: round 3, both sides hurt, hands full. */
function stagePlay(state) {
  startMatch(state);
  playRound(state, true);
  playRound(state, true);
  if (state.phase === PHASE_OVER) return;
  // Top both hands up so the table reads full: two fresh cards each.
  drawCards(state.you, 2, makeRng(state.seed + 101));
  drawCards(state.foe, 2, makeRng(state.seed + 103));
  // Leave one card selected, as if the player is about to play it.
  const playable = state.you.hand.findIndex((card) => card.cost <= state.you.energy);
  state.selected = playable >= 0 ? playable : 0;
  const card = state.you.hand[state.selected];
  if (card) {
    const suit = SUITS[card.suit];
    state.lastPlayed = { card, who: 'you', ready: true, line: `<b>${card.name}</b> <span style="color:${suit.color}">${suit.shape} ${suit.name}</span> is selected — click it again to play it.` };
  }
}

/** The player wins: the AI plays only one card a turn, so the autopilot out-damages it. */
function stageWin(state) {
  startMatch(state);
  for (let step = 0; step < MAX_STEPS && state.phase !== PHASE_OVER; step += 1) {
    playerAuto(state);
    if (state.phase === PHASE_OVER) break;
    endPlayerTurn(state);
    // Handicapped AI: a single card, then the turn passes back.
    aiStep(state);
    if (state.phase === PHASE_OVER) break;
    beginPlayerRound(state);
  }
}

/** The player loses: it fights one round, then stalls, and the AI grinds it down. */
function stageLoss(state) {
  startMatch(state);
  playRound(state, true);
  for (let step = 0; step < MAX_STEPS && state.phase !== PHASE_OVER; step += 1) {
    endPlayerTurn(state);
    runAiTurn(state);
    if (state.phase === PHASE_OVER) break;
    beginPlayerRound(state);
  }
}

/**
 * Set `state` to the named scene (start, play, win or loss; any other name is start)
 * and return the fresh state. The caller owns rendering.
 */
export function stageShot(name, seed) {
  const state = newMatch(seed);
  state.selected = -1;
  state.lastPlayed = null;
  if (name === 'play') stagePlay(state);
  else if (name === 'win') stageWin(state);
  else if (name === 'loss') stageLoss(state);
  return state;
}

export { CARD_DEFS };

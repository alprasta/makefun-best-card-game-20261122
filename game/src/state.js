// Game state, rules and the AI opponent for Ember Court.
// One match: two sides, each with HP, block, energy, a deck, a hand and a discard pile.
// A turn: gain energy, draw a card, play cards, end turn. Block soaks damage and
// clears when its owner's next turn begins. First side to 0 HP loses.
import {
  START_HP, START_HAND, HAND_LIMIT, SYNERGY_BONUS,
  buildDeck, shuffle, makeRng, energyForRound,
} from './cards.js';

export const PHASE_TITLE = 'title';
export const PHASE_PLAY = 'play';
export const PHASE_AI = 'ai';
export const PHASE_OVER = 'over';

function freshSide(rng) {
  return {
    hp: START_HP, maxHp: START_HP, block: 0,
    energy: 0, maxEnergy: 3,
    deck: shuffle(buildDeck(), rng),
    hand: [], discard: [],
    playedSuits: [],
  };
}

/** A brand-new match. `seed` drives both shuffles so a shot replays exactly. */
export function newMatch(seed) {
  const rng = makeRng(seed);
  const state = {
    seed,
    phase: PHASE_TITLE,
    round: 1,
    turn: 'you',
    winner: null,
    score: 0,
    wins: 0,
    damageDealt: 0,
    cardsPlayed: 0,
    log: [],
    you: freshSide(rng),
    foe: freshSide(rng),
  };
  return state;
}

/** Draw up to `count` cards from a side's deck into its hand (reshuffle discard when empty). */
export function drawCards(side, count, rng) {
  for (let i = 0; i < count; i += 1) {
    if (side.hand.length >= HAND_LIMIT) return;
    if (side.deck.length === 0) {
      if (side.discard.length === 0) return;
      side.deck = shuffle(side.discard, rng);
      side.discard = [];
    }
    side.hand.push(side.deck.pop());
  }
}

/** Begin a side's turn: clear its block, refill energy, draw one card. */
export function startTurn(state, who) {
  const side = state[who];
  side.block = 0;
  side.maxEnergy = energyForRound(state.round);
  side.energy = side.maxEnergy;
  side.playedSuits = [];
  drawCards(side, 1, makeRng(state.seed + state.round * 97 + (who === 'foe' ? 13 : 0)));
}

/** Deal damage to a side, block soaking first. Returns the HP damage taken. */
export function dealDamage(side, amount) {
  const soaked = Math.min(side.block, amount);
  side.block -= soaked;
  const hpDamage = amount - soaked;
  side.hp = Math.max(0, side.hp - hpDamage);
  return hpDamage;
}

/** The synergy rule: a second card of a suit already played this turn is empowered. */
export function synergyBonus(side, card) {
  return side.playedSuits.includes(card.suit) ? SYNERGY_BONUS : 0;
}

/**
 * Play the card at `handIndex` from `who`'s hand against the other side.
 * Returns a description of what happened, or null when the play is illegal.
 */
export function playCard(state, who, handIndex) {
  const side = state[who];
  const other = state[who === 'you' ? 'foe' : 'you'];
  const card = side.hand[handIndex];
  if (!card || side.energy < card.cost) return null;
  const bonus = synergyBonus(side, card);
  side.energy -= card.cost;
  side.hand.splice(handIndex, 1);
  side.discard.push(card);
  side.playedSuits.push(card.suit);
  state.cardsPlayed += 1;

  let line = '';
  if (card.kind === 'attack') {
    const dmg = card.value + bonus;
    const taken = dealDamage(other, dmg);
    if (who === 'you') { state.damageDealt += taken; state.score += taken; }
    line = `${who === 'you' ? 'You' : 'Vex'} played ${card.name} — ${dmg} damage${bonus ? ` (synergy +${bonus})` : ''}${taken < dmg ? `, ${dmg - taken} soaked by block` : ''}.`;
  } else if (card.kind === 'guard') {
    const block = card.value + bonus;
    side.block += block;
    line = `${who === 'you' ? 'You' : 'Vex'} played ${card.name} — gained ${block} block${bonus ? ` (synergy +${bonus})` : ''}.`;
  } else if (card.kind === 'heal') {
    const healed = Math.min(card.value + bonus, side.maxHp - side.hp);
    side.hp += healed;
    line = `${who === 'you' ? 'You' : 'Vex'} played ${card.name} — restored ${healed} HP${bonus ? ` (synergy +${bonus})` : ''}.`;
  } else if (card.kind === 'draw') {
    drawCards(side, card.value, makeRng(state.seed + state.cardsPlayed * 31));
    line = `${who === 'you' ? 'You' : 'Vex'} played ${card.name} — drew ${card.value} cards.`;
  } else if (card.kind === 'hybrid') {
    // A hybrid card does its damage, then its extra effect (block and/or draw).
    const dmg = card.value + bonus;
    const taken = dealDamage(other, dmg);
    const parts = [`${dmg} damage${bonus ? ` (synergy +${bonus})` : ''}`];
    if (card.block) { side.block += card.block; parts.push(`gained ${card.block} block`); }
    if (card.draw) { drawCards(side, card.draw, makeRng(state.seed + state.cardsPlayed * 31)); parts.push(`drew ${card.draw} card`); }
    if (who === 'you') { state.damageDealt += taken; state.score += taken; }
    line = `${who === 'you' ? 'You' : 'Vex'} played ${card.name} — ${parts.join(', ')}.`;
  }
  pushLog(state, line);
  checkEnd(state);
  return line;
}

function pushLog(state, line) {
  state.log.unshift(line);
  if (state.log.length > 5) state.log.length = 5;
}

/** End the match when either side hits 0 HP; a win pays a score bonus. */
export function checkEnd(state) {
  if (state.phase === PHASE_OVER) return;
  if (state.foe.hp <= 0) {
    state.phase = PHASE_OVER;
    state.winner = 'you';
    state.wins += 1;
    state.score += 100;
    pushLog(state, 'Warden Vex falls — you win the court!');
  } else if (state.you.hp <= 0) {
    state.phase = PHASE_OVER;
    state.winner = 'foe';
    pushLog(state, 'Your HP reaches 0 — Vex keeps the court.');
  }
}

/** Start a match from the title screen: deal both opening hands. */
export function startMatch(state) {
  state.phase = PHASE_PLAY;
  state.turn = 'you';
  state.round = 1;
  drawCards(state.you, START_HAND, makeRng(state.seed + 7));
  drawCards(state.foe, START_HAND, makeRng(state.seed + 11));
  startTurn(state, 'you');
  pushLog(state, 'Round 1 — your turn. Play cards, then end your turn.');
}

/** End the player's turn; the AI then takes its turn. */
export function endPlayerTurn(state) {
  if (state.phase !== PHASE_PLAY || state.turn !== 'you') return false;
  state.phase = PHASE_AI;
  state.turn = 'foe';
  startTurn(state, 'foe');
  pushLog(state, 'Vex takes the turn…');
  return true;
}

/** After the AI finishes, hand the turn back to the player and open a new round. */
export function beginPlayerRound(state) {
  state.round += 1;
  state.turn = 'you';
  state.phase = PHASE_PLAY;
  startTurn(state, 'you');
  pushLog(state, `Round ${state.round} — your turn.`);
}

// ---------- AI ----------

/**
 * Score a card for the AI: damage is worth its face value, more when the player is
 * nearly beaten; block and healing matter when Vex is hurt; drawing matters when
 * the hand is thin. The AI plays its best affordable card, then re-scores.
 */
export function aiPickCard(state) {
  const foe = state.foe;
  let best = -1;
  let bestScore = -Infinity;
  foe.hand.forEach((card, index) => {
    if (card.cost > foe.energy) return;
    const bonus = synergyBonus(foe, card);
    let value = 0;
    if (card.kind === 'attack') {
      value = card.value + bonus;
      if (state.you.hp <= value) value += 50;
      if (state.you.hp <= 10) value += 10;
    } else if (card.kind === 'guard') {
      value = foe.hp <= 12 ? (card.value + bonus) * 1.6 : (card.value + bonus) * 0.4;
    } else if (card.kind === 'heal') {
      value = foe.hp <= 15 ? (card.value + bonus) * 2 : 0.5;
    } else if (card.kind === 'draw') {
      value = foe.hand.length <= 2 ? 6 : 2;
    } else if (card.kind === 'hybrid') {
      value = (card.value + bonus) + (card.block || 0) + (card.draw || 0) * 2;
      if (foe.hp <= 12) value += 4;
    }
    value -= card.cost * 1.5;
    if (value > bestScore) { bestScore = value; best = index; }
  });
  return best;
}

/** One AI step: play its best card, or null when it is done and the turn passes back. */
export function aiStep(state) {
  if (state.phase !== PHASE_AI) return null;
  const index = aiPickCard(state);
  if (index < 0) return null;
  return playCard(state, 'foe', index);
}

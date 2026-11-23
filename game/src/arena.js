// Arena extras for Ember Court: the synergy meter, the played-history strip,
// the visible deck/discard piles and the face-down opponent hand. All display
// only — every number here is read from the match state, nothing is changed.
import { SUITS } from './cards.js';

/** Face-down card backs for the opponent's hand (count = foe hand size). */
export function foeBacksElement(count) {
  const wrap = document.createElement('div');
  wrap.className = 'foe-backs';
  for (let i = 0; i < count; i += 1) {
    const back = document.createElement('div');
    back.className = 'mini-card card-back';
    back.innerHTML = '<div class="mc-back-glyph">✦</div>';
    wrap.appendChild(back);
  }
  const label = document.createElement('div');
  label.className = 'foe-backs-label';
  label.textContent = `Vex's hand · ${count}`;
  wrap.appendChild(label);
  return wrap;
}

/**
 * Synergy meter: one pip per suit, lit when that suit was already played this
 * turn (read from side.playedSuits). Display only.
 */
export function synergyMeterElement(playedSuits) {
  const wrap = document.createElement('div');
  wrap.className = 'synergy-meter';
  const title = document.createElement('div');
  title.className = 'synergy-title';
  title.textContent = 'SYNERGY — play 2 of a suit, second +2';
  wrap.appendChild(title);
  const pips = document.createElement('div');
  pips.className = 'synergy-pips';
  for (const [key, suit] of Object.entries(SUITS)) {
    const pip = document.createElement('span');
    pip.className = `synergy-pip suit-${key}${playedSuits.includes(key) ? ' lit' : ''}`;
    pip.textContent = suit.shape;
    pip.title = `${suit.name}${playedSuits.includes(key) ? ' — played this turn' : ''}`;
    pips.appendChild(pip);
  }
  wrap.appendChild(pips);
  return wrap;
}

/**
 * History strip: the last 3 exchanges as small chips, derived from the two
 * discard piles (most recent first). Display only.
 */
export function historyStripElement(youDiscard, foeDiscard) {
  const wrap = document.createElement('div');
  wrap.className = 'history-strip';
  const title = document.createElement('div');
  title.className = 'history-title';
  title.textContent = 'LAST EXCHANGES';
  wrap.appendChild(title);
  const list = document.createElement('div');
  list.className = 'history-list';
  // Each pile is in play order (newest last). Alternate from the two tails,
  // newest first, so the strip reads as the recent back-and-forth.
  const recent = [];
  let yi = youDiscard.length - 1;
  let fi = foeDiscard.length - 1;
  let takeYou = true;
  while (recent.length < 3 && (yi >= 0 || fi >= 0)) {
    if (takeYou && yi >= 0) { recent.push({ who: 'You', card: youDiscard[yi] }); yi -= 1; }
    else if (!takeYou && fi >= 0) { recent.push({ who: 'Vex', card: foeDiscard[fi] }); fi -= 1; }
    else if (yi >= 0) { recent.push({ who: 'You', card: youDiscard[yi] }); yi -= 1; }
    else if (fi >= 0) { recent.push({ who: 'Vex', card: foeDiscard[fi] }); fi -= 1; }
    takeYou = !takeYou;
  }
  if (recent.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'history-empty';
    empty.textContent = 'No cards played yet — open the duel.';
    list.appendChild(empty);
  } else {
    for (const play of recent) {
      const chip = document.createElement('div');
      chip.className = `history-chip suit-${play.card.suit}`;
      chip.textContent = `${play.who}: ${play.card.name} ${play.card.value}`;
      list.appendChild(chip);
    }
  }
  wrap.appendChild(list);
  return wrap;
}

/**
 * A visible deck/discard pile: two stacked card backs with counts.
 * `label` is 'Deck' or 'Discard' for the pile being drawn.
 */
export function pileElement(kind, deckCount, discardCount) {
  const wrap = document.createElement('div');
  wrap.className = 'pile';
  const stack = document.createElement('div');
  stack.className = 'pile-stack';
  stack.innerHTML = '<div class="pile-card pile-card-a"></div><div class="pile-card pile-card-b"></div><div class="pile-card pile-card-c"><span>✦</span></div>';
  wrap.appendChild(stack);
  const counts = document.createElement('div');
  counts.className = 'pile-counts';
  counts.textContent = `${kind} ${kind === 'Deck' ? deckCount : discardCount}`;
  wrap.appendChild(counts);
  return wrap;
}

/** Both piles for one side, side by side. */
export function pilesElement(deckCount, discardCount) {
  const wrap = document.createElement('div');
  wrap.className = 'piles';
  wrap.appendChild(pileElement('Deck', deckCount, discardCount));
  wrap.appendChild(pileElement('Discard', deckCount, discardCount));
  return wrap;
}

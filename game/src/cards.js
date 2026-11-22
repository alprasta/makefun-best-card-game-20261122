// Card catalogue for Ember Court: four suits, each told apart by colour AND shape.
// A card is { id, name, suit, cost, kind, value, text }.
// kind: 'attack' deals damage, 'guard' adds block, 'heal' restores HP, 'draw' draws cards.
export const SUITS = {
  ember: { name: 'Ember', shape: '▲', color: '#c73e1d', blurb: 'hits hard' },
  tide: { name: 'Tide', shape: '●', color: '#1d6fb8', blurb: 'heals & shields' },
  thorn: { name: 'Thorn', shape: '◆', color: '#2e7d32', blurb: 'guards & snares' },
  gale: { name: 'Gale', shape: '★', color: '#b8860b', blurb: 'strikes fast & draws' },
};

export const CARD_DEFS = [
  { id: 'ember-slash', name: 'Ember Slash', suit: 'ember', cost: 1, kind: 'attack', value: 4, text: 'Deal 4 damage.' },
  { id: 'ember-burst', name: 'Ember Burst', suit: 'ember', cost: 2, kind: 'attack', value: 7, text: 'Deal 7 damage.' },
  { id: 'ember-inferno', name: 'Ember Inferno', suit: 'ember', cost: 3, kind: 'attack', value: 10, text: 'Deal 10 damage.' },
  { id: 'tide-mend', name: 'Tide Mend', suit: 'tide', cost: 1, kind: 'heal', value: 4, text: 'Restore 4 HP.' },
  { id: 'tide-shield', name: 'Tide Shield', suit: 'tide', cost: 2, kind: 'guard', value: 8, text: 'Gain 8 block.' },
  { id: 'tide-wave', name: 'Tide Wave', suit: 'tide', cost: 3, kind: 'attack', value: 8, text: 'Deal 8 damage.' },
  { id: 'thorn-wall', name: 'Thorn Wall', suit: 'thorn', cost: 1, kind: 'guard', value: 5, text: 'Gain 5 block.' },
  { id: 'thorn-snare', name: 'Thorn Snare', suit: 'thorn', cost: 2, kind: 'hybrid', value: 4, block: 3, text: 'Deal 4 damage and gain 3 block.' },
  { id: 'thorn-pierce', name: 'Thorn Pierce', suit: 'thorn', cost: 1, kind: 'hybrid', value: 3, block: 2, text: 'Deal 3 damage. Gain 2 block.' },
  { id: 'gale-dart', name: 'Gale Dart', suit: 'gale', cost: 1, kind: 'attack', value: 3, text: 'Deal 3 damage.' },
  { id: 'gale-rush', name: 'Gale Rush', suit: 'gale', cost: 2, kind: 'draw', value: 2, text: 'Draw 2 cards.' },
  { id: 'gale-tempest', name: 'Gale Tempest', suit: 'gale', cost: 3, kind: 'hybrid', value: 6, draw: 1, text: 'Deal 6 damage. Draw 1 card.' },
];

export const DECK_SIZE = 24;
export const START_HP = 30;
export const START_HAND = 4;
export const HAND_LIMIT = 7;
export const MAX_ENERGY = 7;
export const SYNERGY_BONUS = 2;

/** Mulberry32 — a tiny seeded RNG so ?seed= replays the same shuffle. */
export function makeRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Build a fresh 24-card deck: two copies of every card in the catalogue. */
export function buildDeck() {
  const deck = [];
  for (const def of CARD_DEFS) deck.push({ ...def }, { ...def });
  return deck;
}

/** Fisher-Yates shuffle driven by the given RNG. */
export function shuffle(deck, rng) {
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/** Energy a side starts its turn with on the given round (grows, then caps). */
export function energyForRound(round) {
  return Math.min(3 + Math.floor((round - 1) / 2), MAX_ENERGY);
}

// Per-card art for Ember Court: one distinct system-font glyph per card.
// The glyph is the card's own identity (a slash, a burst, a wave …), while the
// small suit shape in the corner keeps the suit instantly readable. Glyphs are
// plain geometric/dingbat marks from the system fonts — no emoji, no assets.
import { SUITS } from './cards.js';

/** card id -> the glyph drawn big in the card's art panel. */
export const CARD_ART = {
  'ember-slash': '✕',
  'ember-burst': '❖',
  'ember-inferno': '✹',
  'tide-mend': '✚',
  'tide-shield': '◈',
  'tide-wave': '≈',
  'thorn-wall': '▦',
  'thorn-snare': '⊗',
  'thorn-pierce': '➤',
  'gale-dart': '➶',
  'gale-rush': '»',
  'gale-tempest': '✦',
};

/** The big art glyph for a card (falls back to its suit shape). */
export function artFor(card) {
  return (card && (card.art || CARD_ART[card.id])) || SUITS[card.suit].shape;
}

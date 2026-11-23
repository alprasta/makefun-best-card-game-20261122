[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/alprasta/makefun-best-card-game-20261122/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/alprasta/makefun-best-card-game-20261122/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

# Ember Court

A turn-based dueling card battler. You are the Challenger of the Ember Court — reduce **Warden Vex** to 0 HP before yours reaches 0. Both sides start at 30 HP.

## How it plays

- **Each turn** you gain energy, draw a card, then play cards from your hand. A card costs energy — spend it wisely.
- **Four suits**, told apart by colour and shape: ▲ **Ember** (red) hits hard · ● **Tide** (blue) heals and shields · ◆ **Thorn** (green) guards and snares · ★ **Gale** (gold) strikes fast and draws.
- **Synergy:** play two cards of the same suit in one turn and the second is empowered (+2).
- **Block** soaks damage and clears when its owner's next turn begins.
- **The AI** reads the table: it presses its advantage when you are low, guards and heals when it is hurt, and draws when its hand runs thin.
- **Score** grows with every point of damage you deal; winning a match pays +100.

## What you see

- **The table:** your hand fanned along the bottom, Warden Vex across from you with his hand face-down (backs only — the count is public, the cards are not), and the clash in the middle: your last card against Vex's, with a gold VS between them.
- **The arena rail:** a synergy meter (four suit pips that light up for suits already played this turn) over the last three exchanges, e.g. "You: Ember Slash 4 — Vex: Tide Mend 4".
- **Visible piles:** your deck and discard sit as stacked card backs beside your portrait, with counts; Vex's piles sit beside his.
- **Every card has its own art:** a distinct glyph in a tall art panel — ✕ Slash, ❖ Burst, ✹ Inferno, ✚ Mend, ◈ Shield, ≈ Wave, ▦ Wall, ✜ Snare, ➤ Pierce, ➶ Dart, » Rush, ✦ Tempest — with the suit shape kept small in the top-right corner.
- **Title and end screens are banners, not walls:** the title is a compact panel docked high over a bright dealt board, and victory or defeat arrives as a gold or red ribbon across the top while the final board stays visible underneath.

## The cards

| Card | Suit | Cost | Effect |
| --- | --- | --- | --- |
| Ember Slash | Ember | 1 | Deal 4 damage. |
| Ember Burst | Ember | 2 | Deal 7 damage. |
| Ember Inferno | Ember | 3 | Deal 10 damage. |
| Tide Mend | Tide | 1 | Restore 4 HP. |
| Tide Shield | Tide | 2 | Gain 8 block. |
| Tide Wave | Tide | 3 | Deal 8 damage. |
| Thorn Wall | Thorn | 1 | Gain 5 block. |
| Thorn Snare | Thorn | 2 | Deal 4 damage and gain 3 block. |
| Thorn Pierce | Thorn | 1 | Deal 3 damage. Gain 2 block. |
| Gale Dart | Gale | 1 | Deal 3 damage. |
| Gale Rush | Gale | 2 | Draw 2 cards. |
| Gale Tempest | Gale | 3 | Deal 6 damage. Draw 1 card. |

## Controls

- Mouse: click a card to select it, click again to play it.
- **Enter** start · **Space / E** end turn · **1–7** select a hand card · **R** restart · **M** sound on/off.

Sounds are synthesized with WebAudio — no audio files.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network requests — `game/` is plain static files. Screenshots are deterministic renders of the game itself: `?shot=start|play|win|loss&seed=N`.

## Files

- `game/index.html` — the table
- `game/styles.css` — table, cards and overlays
- `game/src/cards.js` — the four suits and the 12-card catalogue
- `game/src/art.js` — the per-card art glyphs
- `game/src/arena.js` — synergy meter, history strip, deck/discard piles, foe card backs
- `game/src/state.js` — rules, turns and the AI opponent
- `game/src/render.js` — DOM rendering of the table and hands
- `game/src/audio.js` — synthesized WebAudio sound effects
- `game/src/input.js` — keyboard and button wiring
- `game/src/shots.js` — deterministic screenshot scenes
- `game/src/main.js` — bootstrap and the `window.__cardgame` debug hook
- `main.ts` — the hand-in program (copies `game/` + `screenshots/`, writes `dossier.json`)

Made for [make.fun](https://make.fun/?ref=58yp00jq&utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826).

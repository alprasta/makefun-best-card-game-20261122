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
- `game/src/state.js` — rules, turns and the AI opponent
- `game/src/render.js` — DOM rendering of the table and hands
- `game/src/audio.js` — synthesized WebAudio sound effects
- `game/src/input.js` — keyboard and button wiring
- `game/src/shots.js` — deterministic screenshot scenes
- `game/src/main.js` — bootstrap and the `window.__cardgame` debug hook
- `main.ts` — the hand-in program (copies `game/` + `screenshots/`, writes `dossier.json`)

Made for [make.fun](https://make.fun/?ref=58yp00jq&utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826).

// DOM rendering for Ember Court: builds the table, the hands and the overlays
// from the match state, and keeps every number on screen in sync with it.
import { SUITS } from './cards.js';
import { PHASE_TITLE, PHASE_OVER, synergyBonus } from './state.js';

const $ = (id) => document.getElementById(id);

function hpBarFill(side, fillEl, textEl) {
  const pct = Math.max(0, (side.hp / side.maxHp) * 100);
  fillEl.style.width = `${pct}%`;
  textEl.textContent = `${side.hp} / ${side.maxHp}`;
}

function energyPips(container, side) {
  container.innerHTML = '';
  for (let i = 0; i < side.maxEnergy; i += 1) {
    const pip = document.createElement('span');
    pip.className = `energy-pip${i < side.energy ? ' full' : ''}`;
    container.appendChild(pip);
  }
}

function blockBadge(badgeEl, side) {
  badgeEl.hidden = side.block <= 0;
  badgeEl.textContent = `Block ${side.block}`;
}

/** One full-size card element for the player's hand. */
export function cardElement(card, index, state, onSelect) {
  const suit = SUITS[card.suit];
  const el = document.createElement('div');
  el.className = `card suit-${card.suit}`;
  if (state.you.energy < card.cost) el.classList.add('unplayable');
  if (state.selected === index) el.classList.add('selected');
  const bonus = synergyBonus(state.you, card);
  el.innerHTML = `
    <div class="cost">${card.cost}</div>
    <div class="suit suit-${card.suit}" style="color:${suit.color}">${suit.shape}</div>
    <div class="key">${index + 1}</div>
    ${bonus ? `<div class="synergy">+${bonus} SYNERGY</div>` : ''}
    <div class="name">${card.name}</div>
    <div class="art suit-${card.suit}"><span class="art-glyph" style="color:#fff">${suit.shape}</span></div>
    <div class="effect">${card.text}</div>
    <div class="type">${suit.name} · ${card.kind}</div>
    <div class="value">${card.value}${bonus ? ` +${bonus}` : ''}</div>`;
  el.addEventListener('click', () => onSelect(index));
  return el;
}

/** One small card element for the opponent's visible hand. */
export function miniCardElement(card) {
  const suit = SUITS[card.suit];
  const el = document.createElement('div');
  el.className = `mini-card suit-${card.suit}`;
  el.innerHTML = `
    <div class="mc-art">${suit.shape}</div>
    <div class="mc-cost">${card.cost}</div>
    <div class="mc-name">${card.name}</div>
    <div class="mc-val" style="color:${suit.color}">${card.value}</div>
    <div class="mc-type">${suit.name} · ${card.kind}</div>`;
  return el;
}

/** One small face for the clash display: art panel, name and value. */
function clashCardElement(card, owner, latest) {
  const suit = SUITS[card.suit];
  const el = document.createElement('div');
  el.className = 'clash-side';
  el.innerHTML = `
    <div class="clash-card suit-${card.suit}${latest ? ' latest' : ''}">
      <div class="cc-art"><span>${suit.shape}</span></div>
      <div class="cc-name">${card.name}</div>
      <div class="cc-val" style="color:${suit.color}">${card.value}</div>
    </div>
    <div class="clash-label">${owner}</div>`;
  return el;
}

/** A face-down placeholder for a side that has not played a card yet. */
function clashBackElement(owner) {
  const el = document.createElement('div');
  el.className = 'clash-side';
  el.innerHTML = `
    <div class="clash-card card-back">
      <div class="cc-art"><span>?</span></div>
      <div class="cc-name">Awaiting a play…</div>
      <div class="cc-val">&nbsp;</div>
    </div>
    <div class="clash-label">${owner}</div>`;
  return el;
}

function renderSpotlight(state) {
  const spot = $('spotlight');
  spot.innerHTML = '';
  const last = state.lastPlayed;
  // The clash is the most recent exchange: each side's last card in its discard pile.
  const youLast = state.you.discard[state.you.discard.length - 1] || null;
  const foeLast = state.foe.discard[state.foe.discard.length - 1] || null;
  if (!youLast && !foeLast) {
    // Nothing played yet: the court emblem and the round's flavour line.
    const wrap = document.createElement('div');
    wrap.className = 'emblem-wrap';
    wrap.innerHTML = `
      <div class="emblem-glyphs">
        <span class="suit-ember">▲</span><span class="suit-tide">●</span><span class="suit-thorn">◆</span><span class="suit-gale">★</span>
      </div>
      <div class="emblem-line">${state.phase === PHASE_TITLE
        ? 'Welcome to the <b>Ember Court</b> — press Enter or <b>Enter the Court</b> to begin.'
        : `Round <b>${state.round}</b> — the court watches. Play a card to open the duel.`}</div>`;
    spot.appendChild(wrap);
    return;
  }
  const wrap = document.createElement('div');
  wrap.className = 'clash-wrap';
  const row = document.createElement('div');
  row.className = 'clash-row';
  const latestWho = last ? last.who : null;
  row.appendChild(youLast ? clashCardElement(youLast, 'You', latestWho === 'you') : clashBackElement('You'));
  const vs = document.createElement('div');
  vs.className = 'vs-badge';
  vs.textContent = 'VS';
  row.appendChild(vs);
  row.appendChild(foeLast ? clashCardElement(foeLast, 'Vex', latestWho === 'foe') : clashBackElement('Vex'));
  wrap.appendChild(row);
  if (last) {
    const caption = document.createElement('div');
    caption.className = 'clash-caption';
    // last.line already reads "You/Vex played <card> — <effect>"; use it as-is.
    caption.innerHTML = last.line;
    wrap.appendChild(caption);
  }
  spot.appendChild(wrap);
}

function renderLog(state) {
  const list = $('logList');
  list.innerHTML = '';
  for (const line of state.log) {
    const li = document.createElement('li');
    li.textContent = line;
    list.appendChild(li);
  }
}

function renderEndScreen(state) {
  const screen = $('endScreen');
  if (state.phase !== PHASE_OVER) { screen.hidden = true; return; }
  const win = state.winner === 'you';
  const title = $('endTitle');
  title.textContent = win ? 'VICTORY' : 'DEFEAT';
  title.className = `end-title ${win ? 'win' : 'lose'}`;
  $('endSub').textContent = win
    ? 'Warden Vex bows to you — the Ember Court is yours.'
    : 'Warden Vex keeps the court… this time. Shuffle up and try again.';
  $('endStats').innerHTML = `
    <span>Score<b>${state.score}</b></span>
    <span>Your HP<b>${state.you.hp}</b></span>
    <span>Vex HP<b>${state.foe.hp}</b></span>
    <span>Rounds<b>${state.round}</b></span>
    <span>Damage dealt<b>${state.damageDealt}</b></span>`;
  screen.hidden = false;
}

/** Redraw the whole table from the current match state. */
export function render(state, callbacks) {
  $('roundLabel').textContent = `Round ${state.round}`;
  $('scoreLabel').textContent = `Score ${state.score}`;
  $('winsLabel').textContent = `Wins ${state.wins}`;

  hpBarFill(state.foe, $('foeHpFill'), $('foeHpText'));
  hpBarFill(state.you, $('youHpFill'), $('youHpText'));
  blockBadge($('foeBlock'), state.foe);
  blockBadge($('youBlock'), state.you);
  energyPips($('foeEnergy'), state.foe);
  energyPips($('youEnergy'), state.you);
  $('youDeck').textContent = `Deck ${state.you.deck.length}`;
  $('youDiscard').textContent = `Discard ${state.you.discard.length}`;

  const foeHand = $('foeHand');
  foeHand.innerHTML = '';
  for (const card of state.foe.hand) foeHand.appendChild(miniCardElement(card));

  const hand = $('hand');
  hand.innerHTML = '';
  state.you.hand.forEach((card, index) => {
    hand.appendChild(cardElement(card, index, state, callbacks.selectCard));
  });

  $('endTurnBtn').disabled = state.phase !== 'play' || state.turn !== 'you';
  $('titleScreen').hidden = state.phase !== PHASE_TITLE;

  renderSpotlight(state);
  renderLog(state);
  renderEndScreen(state);
}

/** Flash a one-line banner over the table (turn changes, wins, errors). */
export function showBanner(text, ms = 1600) {
  const banner = $('banner');
  banner.textContent = text;
  banner.hidden = false;
  clearTimeout(showBanner.timer);
  showBanner.timer = setTimeout(() => { banner.hidden = true; }, ms);
}

/** Announce a line for screen readers. */
export function announce(text) {
  $('status').textContent = text;
}

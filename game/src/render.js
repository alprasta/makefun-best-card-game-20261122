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
    <div class="glyph suit-${card.suit}" style="color:${suit.color}">${suit.shape}</div>
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
  el.className = 'mini-card';
  el.innerHTML = `
    <div class="mc-cost">${card.cost}</div>
    <div class="mc-suit" style="color:${suit.color}">${suit.shape}</div>
    <div class="mc-name">${card.name}</div>
    <div class="mc-val" style="color:${suit.color}">${card.value}</div>
    <div class="mc-type">${suit.name} · ${card.kind}</div>`;
  return el;
}

function renderSpotlight(state) {
  const spot = $('spotlight');
  spot.innerHTML = '';
  const last = state.lastPlayed;
  if (!last) {
    const hint = document.createElement('div');
    hint.className = 'spot-text';
    hint.innerHTML = state.phase === PHASE_TITLE
      ? 'Welcome to the <b>Ember Court</b> — press Enter or <b>Enter the Court</b> to begin.'
      : 'Play a card from your hand. Two cards of the same suit in one turn empower the second (+2).';
    spot.appendChild(hint);
    return;
  }
  const suit = SUITS[last.card.suit];
  const text = document.createElement('div');
  text.className = 'spot-text';
  if (last.ready) {
    text.innerHTML = last.line;
  } else {
    text.innerHTML = `<b>${last.who === 'you' ? 'You' : 'Vex'}</b> played <b>${last.card.name}</b> <span style="color:${suit.color}">${suit.shape} ${suit.name}</span> — ${last.line}`;
  }
  spot.appendChild(text);
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

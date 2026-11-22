// Keyboard and button wiring for Ember Court. All game actions flow through the
// callbacks the main module supplies, so this file knows nothing about the rules.
import { toggleMuted } from './audio.js';

export function bindControls(actions) {
  document.getElementById('startBtn').addEventListener('click', actions.start);
  document.getElementById('againBtn').addEventListener('click', actions.restart);
  document.getElementById('restartBtn').addEventListener('click', actions.restart);
  document.getElementById('endTurnBtn').addEventListener('click', actions.endTurn);
  document.getElementById('soundBtn').addEventListener('click', () => {
    const muted = toggleMuted();
    document.getElementById('soundBtn').textContent = muted ? 'Sound: Off' : 'Sound: On';
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key;
    if (key === 'Enter') {
      actions.start();
    } else if (key === ' ' || key === 'e' || key === 'E') {
      event.preventDefault();
      actions.endTurn();
    } else if (key === 'r' || key === 'R') {
      actions.restart();
    } else if (key === 'm' || key === 'M') {
      const muted = toggleMuted();
      document.getElementById('soundBtn').textContent = muted ? 'Sound: Off' : 'Sound: On';
    } else if (key >= '1' && key <= '7') {
      actions.selectByKey(Number(key) - 1);
    }
  });
}
